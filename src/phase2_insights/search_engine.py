import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from phase1_ingestion.phase1_4_db_storage.database import get_db_connection
from phase2_insights.vector_store import LocalVectorStore

# Configure logger
logger = logging.getLogger("search_engine")

class HybridSearchEngine:
    def __init__(self, vector_store: LocalVectorStore):
        self.vector_store = vector_store

    def _execute_sparse_search(self, query: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Executes a simple sparse TF-IDF/Keyword matching query against the SQLite database.
        Returns a list of dictionary results with calculated text relevance scores.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Prepare terms
        terms = query.lower().split()
        if not terms:
            conn.close()
            return []
            
        # Dynamically build SQL matching terms
        where_clauses = []
        params = []
        for term in terms:
            where_clauses.append("(lower(content) LIKE ? OR lower(title) LIKE ?)")
            params.append(f"%{term}%")
            params.append(f"%{term}%")
            
        sql = "SELECT review_id, title, content, rating, source, version, timestamp, extra_metadata FROM feedbacks WHERE "
        sql += " AND ".join(where_clauses)
        
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        results = []
        for r in rows:
            review_id, title, content, rating, source, version, timestamp, meta_str = r
            
            # Parse JSON metadata
            try:
                meta = json.loads(meta_str) if isinstance(meta_str, str) else (meta_str or {})
            except Exception:
                meta = {}
                
            # Build full metadata dict for filtering checks
            metadata = {
                "source": source,
                "rating": rating,
                "version": version,
                "timestamp": timestamp,
                **meta
            }
            
            # Apply metadata filters
            match_filters = True
            if filters:
                for k, expected in filters.items():
                    if k not in metadata:
                        match_filters = False
                        break
                    actual = metadata[k]
                    if isinstance(expected, list):
                        if actual not in expected:
                            match_filters = False
                            break
                    else:
                        if actual != expected:
                            match_filters = False
                            break
                            
            if not match_filters:
                continue
                
            # Simple TF score: count occurrences of query terms
            text = ((title or "") + " " + content).lower()
            tf_score = sum(text.count(term) for term in terms)
            
            results.append({
                "review_id": review_id,
                "metadata": metadata,
                "score": float(tf_score)
            })
            
        conn.close()
        # Sort by term frequency score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    def query(self, query_text: str, filters: Optional[Dict[str, Any]] = None, top_k: int = 5, rrf_k: int = 60) -> List[Dict[str, Any]]:
        """
        Performs a metadata-filtered hybrid search using Reciprocal Rank Fusion (RRF)
        to combine sparse (BM25-like) and dense (BGE vector) search results.
        """
        logger.info(f"Executing hybrid search for: '{query_text}' with filters: {filters}")
        
        # 1. Fetch Sparse Rankings
        sparse_results = self._execute_sparse_search(query_text, filters)
        
        # 2. Fetch Dense Rankings
        dense_results = self.vector_store.query(query_text, filters, top_k=100) # Get larger set for fusion
        
        # 3. Apply Reciprocal Rank Fusion (RRF)
        # RRF formula: Score(d) = sum(1 / (rrf_k + rank(d)))
        rrf_scores: Dict[str, Dict[str, Any]] = {}
        
        # Helper to index ranks
        def accumulate_rrf(rank_list, list_name):
            for rank, item in enumerate(rank_list, 1):
                r_id = item["review_id"]
                if r_id not in rrf_scores:
                    rrf_scores[r_id] = {
                        "review_id": r_id,
                        "metadata": item["metadata"],
                        "score": 0.0,
                        "ranks": {}
                    }
                rrf_scores[r_id]["ranks"][list_name] = rank
                rrf_scores[r_id]["score"] += 1.0 / (rrf_k + rank)
                
        accumulate_rrf(sparse_results, "sparse")
        accumulate_rrf(dense_results, "dense")
        
        # Convert map to list and sort by RRF score descending
        fused_results = list(rrf_scores.values())
        fused_results.sort(key=lambda x: x["score"], reverse=True)
        
        # Attach readable score and strip indexing helper fields
        final_results = []
        for item in fused_results[:top_k]:
            final_results.append({
                "review_id": item["review_id"],
                "metadata": item["metadata"],
                "score": round(item["score"], 5),
                "source_ranks": item["ranks"]
            })
            
        logger.info(f"Hybrid search returned {len(final_results)} results.")
        return final_results

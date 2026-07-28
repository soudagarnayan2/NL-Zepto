import os
import argparse
import json
import logging
from typing import Dict, Any
from phase1_ingestion.phase1_4_db_storage.database import get_db_connection
from phase2_insights.absa_pipeline import run_absa_classification
from phase2_insights.vector_store import LocalVectorStore
from phase2_insights.search_engine import HybridSearchEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("insights_runner")

def build_vector_and_insights_index():
    """
    Runs ABSA sentiment tagging on database, fetches the records,
    and indexes them into the local vector database.
    """
    logger.info("Starting End-to-End Insights Index Build...")
    
    # 1. Run ABSA classifier
    run_absa_classification()
    
    # 2. Initialize Vector Store
    v_store = LocalVectorStore()
    
    # 3. Read joined staging data
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = """
    SELECT f.review_id, f.title, f.content, f.rating, f.source, f.version, f.timestamp, f.extra_metadata,
           i.sentiment, i.aspect_category, i.friction_score
    FROM feedbacks f
    LEFT JOIN classified_insights i ON f.review_id = i.review_id
    """
    cursor.execute(sql)
    rows = cursor.fetchall()
    
    logger.info(f"Indexing {len(rows)} records into Vector Store...")
    
    for r in rows:
        review_id, title, content, rating, source, version, timestamp, meta_str, sentiment, aspect, friction = r
        
        # Parse dynamic JSON metadata
        try:
            extra = json.loads(meta_str) if isinstance(meta_str, str) else (meta_str or {})
        except Exception:
            extra = {}
            
        # Standardize metadata dict
        metadata = {
            "title": title,
            "content": content,
            "rating": rating,
            "source": source,
            "version": version,
            "timestamp": timestamp,
            "sentiment": sentiment,
            "aspect_category": aspect,
            "friction_score": friction,
            **extra
        }
        
        # We index the text content + title for vector search
        indexing_text = f"{title or ''}: {content}"
        v_store.upsert(
            review_id=review_id,
            text=indexing_text,
            metadata=metadata
        )
        
    conn.close()
    logger.info("Insights and Vector Database index build completed successfully!")


def display_thematic_clustering_summary():
    """
    Displays counts of reviews grouped by aspect category and sentiment.
    """
    logger.info("Computing Thematic Summary...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='classified_insights'")
    if not cursor.fetchone():
        logger.warning("Classified insights table does not exist. Please run with --build-index first.")
        conn.close()
        return
        
    sql = """
    SELECT aspect_category, sentiment, COUNT(*) as count, AVG(friction_score) as avg_friction
    FROM classified_insights
    GROUP BY aspect_category, sentiment
    ORDER BY aspect_category, avg_friction DESC
    """
    cursor.execute(sql)
    summary_rows = cursor.fetchall()
    
    print("\n" + "="*70)
    print("                 THEMATIC FEEDBACK CLUSTERING SUMMARY")
    print("="*70)
    print(f"{'Aspect Category':<20} | {'Sentiment':<10} | {'Count':<6} | {'Avg Friction Score'}")
    print("-"*70)
    for row in summary_rows:
        aspect, sentiment, count, avg_f = row
        print(f"{aspect:<20} | {sentiment:<10} | {count:<6} | {avg_f:.2f} / 5.0")
    print("="*70 + "\n")
    conn.close()


def execute_insights_query(query: str, source: str = None, rating: int = None, version: str = None, top_k: int = 5):
    """
    Initializes retrieval engine, applies metadata filters,
    runs hybrid search, and logs clean reports.
    """
    # Build filters dictionary
    filters = {}
    if source:
        filters["source"] = source
    if rating is not None:
        filters["rating"] = rating
    if version:
        filters["version"] = version
        
    v_store = LocalVectorStore()
    search_engine = HybridSearchEngine(v_store)
    
    # Run hybrid query
    results = search_engine.query(query, filters=filters, top_k=top_k)
    
    print("\n" + "="*80)
    print(f"HYBRID RETRIEVAL RESULTS FOR QUERY: '{query}'")
    print(f"Active Metadata Filters: {filters if filters else 'None'}")
    print("="*80)
    
    if not results:
        print("No matching reviews found in database staging.")
    else:
        for idx, r in enumerate(results, 1):
            meta = r["metadata"]
            ranks = r["source_ranks"]
            print(f"{idx}. ID: {r['review_id']} | Source: {meta.get('source')} | Rating: {meta.get('rating') or 'N/A'}")
            print(f"   Aspect: {meta.get('aspect_category')} | Sentiment: {meta.get('sentiment')} | Friction: {meta.get('friction_score') or 0.0:.1f}")
            print(f"   RRF Score: {r['score']} (Sparse Rank: {ranks.get('sparse', 'N/A')}, Dense Rank: {ranks.get('dense', 'N/A')})")
            if meta.get("title"):
                print(f"   Title: {meta.get('title')}")
            print(f"   Content: {meta.get('content')}")
            print("-"*80)
    print("="*80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="PM Insights and Hybrid Search Engine CLI")
    parser.add_argument("--build-index", action="store_true", help="Run ABSA and build the local vector database")
    parser.add_argument("--summary", action="store_true", help="Display thematic feedback categories and metrics")
    parser.add_argument("--query", type=str, help="Text query to search (e.g. 'slow delivery')")
    parser.add_argument("--source", type=str, help="Filter results by source (app_store, play_store, reddit, forum)")
    parser.add_argument("--rating", type=int, help="Filter results by rating score (1-5)")
    parser.add_argument("--version", type=str, help="Filter results by app version")
    parser.add_argument("--top-k", type=int, default=5, help="Number of records to return")
    
    args = parser.parse_args()
    
    if args.build_index:
        build_vector_and_insights_index()
        display_thematic_clustering_summary()
    elif args.summary:
        display_thematic_clustering_summary()
    elif args.query:
        execute_insights_query(
            query=args.query,
            source=args.source,
            rating=args.rating,
            version=args.version,
            top_k=args.top_k
        )
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

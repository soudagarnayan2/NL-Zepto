import os
import json
import logging
import math
from typing import List, Dict, Any, Tuple, Optional

# Configure logger
logger = logging.getLogger("vector_store")

VECTOR_STORE_PATH = "data/vector_db/feedbacks_vectors.json"

class LocalVectorStore:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self.data: Dict[str, Dict[str, Any]] = {}
        self.encoder = None
        self._load_store()
        self._initialize_encoder()

    def _load_store(self):
        """Loads vector store from JSON file."""
        if os.path.exists(VECTOR_STORE_PATH):
            try:
                with open(VECTOR_STORE_PATH, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                logger.info(f"Loaded {len(self.data)} vectors from {VECTOR_STORE_PATH}")
            except Exception as e:
                logger.error(f"Error loading vector store file: {e}. Starting fresh.")
                self.data = {}
        else:
            self.data = {}

    def _save_store(self):
        """Saves vector store to JSON file."""
        db_dir = os.path.dirname(VECTOR_STORE_PATH)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        try:
            with open(VECTOR_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
            logger.debug(f"Saved vector database to {VECTOR_STORE_PATH}")
        except Exception as e:
            logger.error(f"Failed to write vector store to file: {e}")

    def _initialize_encoder(self):
        """Attempts to load sentence-transformers, otherwise fallback to TF-IDF logic."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Initializing SentenceTransformer model '{self.model_name}'...")
            self.encoder = SentenceTransformer(self.model_name)
            logger.info("Successfully loaded SentenceTransformer.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Activating high-precision TF-IDF Fallback Vectorizer.")
            self.encoder = None

    def _get_embedding(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional vector embedding.
        If SentenceTransformer is loaded, it executes it.
        Otherwise, maps text to a normalized 384-dimensional TF-IDF-like space.
        """
        if self.encoder is not None:
            # Generate real BGE vector
            vector_np = self.encoder.encode(text, normalize_embeddings=True)
            return vector_np.tolist()
        
        # Fallback Vectorizer: Generates normalized 384-dim vector based on word hash index
        vector = [0.0] * 384
        words = text.lower().split()
        if not words:
            return vector
            
        # Add weights to indices based on hashing
        for word in words:
            # Use basic python hash to distribute over 384 indices
            idx = abs(hash(word)) % 384
            # IDF-like scaling: give less weight to short common words
            weight = 1.0 if len(word) > 3 else 0.3
            vector[idx] += weight
            
        # L2 Normalization: make vector unit length for direct cosine similarity (dot product)
        magnitude = math.sqrt(sum(val ** 2 for val in vector))
        if magnitude > 0:
            vector = [val / magnitude for val in vector]
            
        return vector

    def upsert(self, review_id: str, text: str, metadata: Dict[str, Any]):
        """Generates embedding and upserts record with metadata."""
        vector = self._get_embedding(text)
        self.data[review_id] = {
            "vector": vector,
            "metadata": metadata
        }
        self._save_store()

    def query(self, query_text: str, filters: Optional[Dict[str, Any]] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Processes query text, pre-filters database rows based on metadata,
        calculates cosine similarities, and returns top-K results.
        """
        query_vector = self._get_embedding(query_text)
        results = []
        
        for review_id, record in self.data.items():
            meta = record.get("metadata", {})
            
            # --- METADATA PRE-FILTERING ---
            match_filters = True
            if filters:
                for k, expected in filters.items():
                    if k not in meta:
                        match_filters = False
                        break
                    
                    actual = meta[k]
                    # Handle rating array matches (e.g. expected = [1, 2], actual = 2)
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
                
            # --- COSINE SIMILARITY CALCULATION ---
            # Since vectors are L2-normalized during generation, dot product = cosine similarity
            rec_vector = record["vector"]
            similarity = sum(qv * rv for qv, rv in zip(query_vector, rec_vector))
            
            results.append({
                "review_id": review_id,
                "metadata": meta,
                "score": float(similarity)
            })
            
        # Sort by similarity score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

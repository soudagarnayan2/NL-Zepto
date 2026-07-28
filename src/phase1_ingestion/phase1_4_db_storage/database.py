import os
import json
import sqlite3
import logging
from typing import List, Dict, Any, Union

# Configure logger
logger = logging.getLogger(__name__)

DB_PATH = "data/db/zepto_discovery.db"

def get_db_connection():
    """
    Returns a database connection. Attempts PostgreSQL if DATABASE_URL
    is configured in environment variables, otherwise falls back to SQLite.
    """
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        logger.info("DATABASE_URL environment variable detected. Attempting Postgres connection...")
        try:
            import psycopg2
            return psycopg2.connect(db_url)
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL ({e}). Falling back to SQLite.")
            
    # Local SQLite Fallback
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    logger.debug(f"Initializing local SQLite connection to {DB_PATH}")
    return sqlite3.connect(DB_PATH)


def init_database(conn):
    """
    Initializes database tables and creates appropriate indexes.
    """
    cursor = conn.cursor()
    
    # Check connection type (Postgres vs SQLite)
    is_sqlite = isinstance(conn, sqlite3.Connection)
    
    # 1. Create feedbacks staging table
    if is_sqlite:
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS feedbacks (
            review_id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            rating INTEGER,
            title TEXT,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            version TEXT,
            extra_metadata TEXT DEFAULT '{}',
            ingested_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """
        create_index_sql = "CREATE INDEX IF NOT EXISTS idx_feedbacks_ts_src ON feedbacks (timestamp, source);"
    else:
        # PostgreSQL syntax (utilizing TIMESTAMPTZ, JSONB, and GIN Indexing)
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS feedbacks (
            review_id VARCHAR(100) PRIMARY KEY,
            source VARCHAR(50) NOT NULL,
            rating INTEGER,
            title VARCHAR(255),
            content TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            version VARCHAR(50),
            extra_metadata JSONB DEFAULT '{}'::jsonb,
            ingested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        """
        create_index_sql = "CREATE INDEX IF NOT EXISTS idx_feedbacks_ts_src ON feedbacks (timestamp, source);"
        
    cursor.execute(create_table_sql)
    cursor.execute(create_index_sql)
    
    # GIN index for JSONB in PostgreSQL only
    if not is_sqlite:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedbacks_meta_gin ON feedbacks USING gin (extra_metadata);")
        
    # 2. Create telemetry_events table
    if is_sqlite:
        create_telemetry_sql = """
        CREATE TABLE IF NOT EXISTS telemetry_events (
            event_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            category TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            variant TEXT NOT NULL
        );
        """
        create_telemetry_index = "CREATE INDEX IF NOT EXISTS idx_telemetry_var_evt ON telemetry_events (variant, event_type);"
    else:
        create_telemetry_sql = """
        CREATE TABLE IF NOT EXISTS telemetry_events (
            event_id VARCHAR(100) PRIMARY KEY,
            user_id VARCHAR(100) NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            category VARCHAR(100) NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            variant VARCHAR(50) NOT NULL
        );
        """
        create_telemetry_index = "CREATE INDEX IF NOT EXISTS idx_telemetry_var_evt ON telemetry_events (variant, event_type);"
        
    cursor.execute(create_telemetry_sql)
    cursor.execute(create_telemetry_index)
        
    conn.commit()
    logger.info("Database staging and telemetry schemas initialized successfully.")


def upsert_feedbacks_batch(conn, batch: List[Dict[str, Any]]):
    """
    Performs a batch upsert (insert or update on duplicate key) of reviews.
    """
    if not batch:
        return
        
    cursor = conn.cursor()
    is_sqlite = isinstance(conn, sqlite3.Connection)
    
    if is_sqlite:
        # SQLite UPSERT Syntax (supported in SQLite 3.24.0+)
        sql = """
        INSERT INTO feedbacks (review_id, source, rating, title, content, timestamp, version, extra_metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(review_id) 
        DO UPDATE SET 
            content = excluded.content,
            rating = excluded.rating,
            title = excluded.title,
            version = COALESCE(excluded.version, feedbacks.version),
            extra_metadata = excluded.extra_metadata,
            ingested_at = CURRENT_TIMESTAMP;
        """
        
        # Prepare parameters (SQLite doesn't support dict/jsonb directly; serialize extra_metadata to string)
        param_list = []
        for r in batch:
            meta_str = json.dumps(r.get("extra_metadata", {}))
            param_list.append((
                r.get("review_id"),
                r.get("source"),
                r.get("rating"),
                r.get("title"),
                r.get("content"),
                r.get("timestamp"),
                r.get("version"),
                meta_str
            ))
            
        cursor.executemany(sql, param_list)
        
    else:
        # PostgreSQL UPSERT Syntax
        sql = """
        INSERT INTO feedbacks (review_id, source, rating, title, content, timestamp, version, extra_metadata)
        VALUES (%(review_id)s, %(source)s, %(rating)s, %(title)s, %(content)s, %(timestamp)s, %(version)s, %(extra_metadata)s)
        ON CONFLICT (review_id) 
        DO UPDATE SET 
            content = EXCLUDED.content, 
            rating = EXCLUDED.rating, 
            title = EXCLUDED.title,
            version = COALESCE(EXCLUDED.version, feedbacks.version),
            extra_metadata = feedbacks.extra_metadata || EXCLUDED.extra_metadata,
            ingested_at = CURRENT_TIMESTAMP;
        """
        
        # Prepare parameters for Postgres (psycopg2 handles dictionaries/JSONB directly)
        param_list = []
        for r in batch:
            param_list.append({
                "review_id": r.get("review_id"),
                "source": r.get("source"),
                "rating": r.get("rating"),
                "title": r.get("title"),
                "content": r.get("content"),
                "timestamp": r.get("timestamp"),
                "version": r.get("version"),
                "extra_metadata": json.dumps(r.get("extra_metadata", {}))
            })
            
        # Execute batch using executemany
        cursor.executemany(sql, param_list)
        
    conn.commit()
    logger.info(f"Successfully upserted batch of {len(batch)} records.")

import os
import argparse
import logging
from datetime import datetime

# Import Phase 0 scrapers
from phase0_scraping.play_store_scraper import scrape_play_store_reviews
from phase0_scraping.app_store_scraper import scrape_app_store_reviews
from phase0_scraping.reddit_scraper import scrape_reddit_discussions
from phase0_scraping.forum_scraper import scrape_forum_comments
from phase0_scraping.run_scrapers import save_to_partitioned_jsonl

# Import Phase 1 ingestion layers
from phase1_ingestion.phase1_1_raw_ingestion.raw_ingestion import validate_and_archive_raw_files
from phase1_ingestion.phase1_3_message_broker.producer import publish_archive_to_broker
from phase1_ingestion.phase1_4_db_storage.db_consumer import run_db_consumer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("pipeline_orchestrator")

def execute_end_to_end_pipeline(limit: int, raw_dir: str, archive_dir: str, dlq_dir: str, broker_topic: str, db_batch_size: int):
    """
    Coordinates and runs the entire pipeline from end to end:
    1. Scrapes raw reviews/discussions.
    2. Runs schema validation and archives valid entries.
    3. Runs PII Redaction and streams entries into the message queue.
    4. Consumes stream and upserts records in chunks to PostgreSQL/SQLite database.
    """
    logger.info("=========================================================")
    logger.info("Starting End-to-End Ingestion Pipeline Orchestration Run")
    logger.info("=========================================================")
    
    # --- PHASE 0: SCRAPING & HARVESTING ---
    logger.info("[PHASE 0] Starting External Scrapers...")
    os.makedirs(raw_dir, exist_ok=True)
    
    # Execute individual scrapers
    play_reviews = scrape_play_store_reviews(package_name="com.zepto.grocery", limit=limit)
    save_to_partitioned_jsonl(play_reviews, raw_dir)
    
    ios_reviews = scrape_app_store_reviews(app_id="1578321743", limit=limit)
    save_to_partitioned_jsonl(ios_reviews, raw_dir)
    
    reddit_reviews = scrape_reddit_discussions(query="zepto", limit=limit)
    save_to_partitioned_jsonl(reddit_reviews, raw_dir)
    
    forum_reviews = scrape_forum_comments(url="https://news.ycombinator.com/")
    if len(forum_reviews) > limit:
        forum_reviews = forum_reviews[:limit]
    save_to_partitioned_jsonl(forum_reviews, raw_dir)
    
    logger.info("[PHASE 0] Data Harvesting complete.")
    
    # --- PHASE 1.1: SCHEMA VALIDATION & ARCHIVAL ---
    logger.info("[PHASE 1.1] Starting Raw Data Validation & Archival...")
    ingest_metrics = validate_and_archive_raw_files(
        raw_dir=raw_dir,
        archive_dir=archive_dir,
        dlq_dir=dlq_dir
    )
    logger.info(f"[PHASE 1.1] Completed. Archived: {ingest_metrics['valid_records']}, Corrupt: {ingest_metrics['corrupt_records']}")
    
    # --- PHASE 1.2 & 1.3: PII REDACTION & BROKER STREAMING (PRODUCER) ---
    logger.info("[PHASE 1.2 & 1.3] Starting PII Redactor & Broker Streaming (Producer)...")
    records_produced = publish_archive_to_broker(
        archive_dir=archive_dir,
        topic=broker_topic
    )
    logger.info(f"[PHASE 1.2 & 1.3] Completed. Streamed {records_produced} records to topic '{broker_topic}'")
    
    # --- PHASE 1.4: DATABASE INGESTION & DEDUPLICATION (CONSUMER) ---
    logger.info("[PHASE 1.4] Starting Database Ingestion Consumer...")
    if records_produced > 0:
        run_db_consumer(
            topic=broker_topic,
            group_id="group-zepto-pipeline-orchestrator",
            batch_size=db_batch_size,
            flush_interval=2.0,
            max_messages=records_produced  # Tells consumer to terminate cleanly after reading all streamed records
        )
        logger.info("[PHASE 1.4] Database ingestion completed successfully.")
    else:
        logger.warning("[PHASE 1.4] Skipping DB Consumer run since 0 records were streamed by producer.")
        
    logger.info("=========================================================")
    logger.info("End-to-End Ingestion Pipeline Run Successfully Completed!")
    logger.info("=========================================================")

def main():
    parser = argparse.ArgumentParser(description="Zepto E2E Discovery Pipeline Orchestrator CLI")
    parser.add_argument("--limit", type=int, default=5, help="Scraped reviews limit per source")
    parser.add_argument("--raw-dir", type=str, default="data/raw", help="Directory for raw scraped outputs")
    parser.add_argument("--archive-dir", type=str, default="data/archive", help="Directory for validated archives")
    parser.add_argument("--dlq-dir", type=str, default="data/dlq", help="Directory for corrupt files")
    parser.add_argument("--topic", type=str, default="topic-feedbacks", help="Message broker topic")
    parser.add_argument("--db-batch-size", type=int, default=20, help="Database chunk insert size")
    
    args = parser.parse_args()
    
    execute_end_to_end_pipeline(
        limit=args.limit,
        raw_dir=args.raw_dir,
        archive_dir=args.archive_dir,
        dlq_dir=args.dlq_dir,
        broker_topic=args.topic,
        db_batch_size=args.db_batch_size
    )

if __name__ == "__main__":
    main()

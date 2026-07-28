import argparse
import logging
import json
import time
from typing import List
from phase1_ingestion.phase1_3_message_broker.broker import get_consumer
from phase1_ingestion.phase1_4_db_storage.database import (
    get_db_connection, init_database, upsert_feedbacks_batch
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("db_consumer")

def run_db_consumer(topic: str, group_id: str, batch_size: int = 50, flush_interval: float = 5.0, max_messages: int = 0):
    """
    Subscribes to Kafka/Simulated topics, buffers PII-redacted reviews,
    and performs bulk upserts into the database in chunks.
    """
    logger.info(f"Starting DB Consumer. Topic: {topic}, Group: {group_id}, Batch Size: {batch_size}, Flush Interval: {flush_interval}s")
    
    # Initialize DB connection and schema
    db_conn = get_db_connection()
    init_database(db_conn)
    
    # Initialize Consumer
    consumer = get_consumer(topics=[topic], group_id=group_id)
    
    buffer: List[dict] = []
    last_flush_time = time.time()
    total_consumed = 0
    empty_polls_count = 0
    
    try:
        while True:
            # Poll message from broker
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                empty_polls_count += 1
                # If we are in test mode and the queue is empty, trigger a timeout flush and exit
                if max_messages > 0 and empty_polls_count >= 5:
                    if buffer:
                        logger.info("Test run timeout. Performing final database flush...")
                        upsert_feedbacks_batch(db_conn, buffer)
                        consumer.commit()
                        buffer = []
                    logger.info("Queue empty. Exiting test run.")
                    break
                    
                # Periodic flush checks even during silent periods
                time_since_last_flush = time.time() - last_flush_time
                if buffer and time_since_last_flush >= flush_interval:
                    logger.info(f"Flush interval reached ({time_since_last_flush:.1f}s). Bulk inserting {len(buffer)} records...")
                    upsert_feedbacks_batch(db_conn, buffer)
                    consumer.commit()
                    buffer = []
                    last_flush_time = time.time()
                continue
                
            empty_polls_count = 0
            
            try:
                # Parse message value bytes
                val_bytes = msg.value()
                val_str = val_bytes.decode("utf-8")
                record = json.loads(val_str)
                
                buffer.append(record)
                total_consumed += 1
                logger.debug(f"Buffered record ID: {record.get('review_id')}. Total buffered: {len(buffer)}")
                
                # Check flush condition 1: Batch Size Reached
                if len(buffer) >= batch_size:
                    logger.info(f"Batch size limit reached ({len(buffer)}). Bulk inserting into database...")
                    upsert_feedbacks_batch(db_conn, buffer)
                    consumer.commit()
                    buffer = []
                    last_flush_time = time.time()
                    
                # Check exit condition for test runs
                if max_messages > 0 and total_consumed >= max_messages:
                    if buffer:
                        logger.info(f"Max message target hit ({total_consumed}). Flushing remaining {len(buffer)} records...")
                        upsert_feedbacks_batch(db_conn, buffer)
                        consumer.commit()
                        buffer = []
                    logger.info(f"Target messages hit ({max_messages}). Stopping consumer.")
                    break
                    
            except Exception as e:
                logger.error(f"Error parsing/buffering message: {e}")
                
    except KeyboardInterrupt:
        logger.info("DB Consumer daemon interrupted by user.")
        # Flush any remaining items in the buffer on exit
        if buffer:
            logger.info(f"Flushing final {len(buffer)} records to database before exit...")
            try:
                upsert_feedbacks_batch(db_conn, buffer)
                consumer.commit()
            except Exception as flush_err:
                logger.error(f"Failed to execute final flush: {flush_err}")
    finally:
        consumer.close()
        db_conn.close()
        logger.info(f"DB Consumer daemon shut down. Total records processed this run: {total_consumed}")

def main():
    parser = argparse.ArgumentParser(description="Phase 1.4 Database Ingestion Consumer Daemon")
    parser.add_argument("--topic", type=str, default="topic-feedbacks", help="Broker topic to subscribe to")
    parser.add_argument("--group-id", type=str, default="group-zepto-db-ingestion", help="Consumer group identity")
    parser.add_argument("--batch-size", type=int, default=50, help="DB chunk/batch insert size")
    parser.add_argument("--flush-interval", type=float, default=5.0, help="DB flush timeout interval in seconds")
    parser.add_argument("--max-messages", type=int, default=0, help="Max records to process before exiting (0 for infinite)")
    
    args = parser.parse_args()
    
    run_db_consumer(
        topic=args.topic,
        group_id=args.group_id,
        batch_size=args.batch_size,
        flush_interval=args.flush_interval,
        max_messages=args.max_messages
    )

if __name__ == "__main__":
    main()

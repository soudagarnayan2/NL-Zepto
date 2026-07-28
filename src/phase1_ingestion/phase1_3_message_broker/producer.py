import os
import json
import argparse
import logging
from phase1_ingestion.phase1_3_message_broker.broker import get_producer
from phase1_ingestion.phase1_2_pii_redaction.redactor import redact_text

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("broker_producer")

def publish_archive_to_broker(archive_dir: str, topic: str):
    """
    Reads all validated feedbacks from the archive directory,
    redacts PII from the text, and streams them to the message broker.
    """
    logger.info(f"Starting Broker Producer. Archive Dir: {archive_dir}, Target Topic: {topic}")
    
    if not os.path.exists(archive_dir):
        logger.warning(f"Archive directory does not exist: {archive_dir}. Please run Phase 1.1 first.")
        return 0

    producer = get_producer()
    records_sent = 0
    
    for root, _, files in os.walk(archive_dir):
        for file in files:
            if file != "feedbacks_validated.jsonl":
                continue
                
            filepath = os.path.join(root, file)
            logger.info(f"Streaming file: {filepath}")
            
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
            for line_num, line in enumerate(lines, 1):
                stripped = line.strip()
                if not stripped:
                    continue
                    
                try:
                    record = json.loads(stripped)
                    
                    # Apply PII Redaction on content and title
                    if "content" in record:
                        record["content"] = redact_text(record["content"])
                    if "title" in record and record["title"]:
                        record["title"] = redact_text(record["title"])
                        
                    # Also scrub author if present in extra_metadata
                    extra_meta = record.get("extra_metadata", {})
                    if "author" in extra_meta and extra_meta["author"]:
                        extra_meta["author"] = redact_text(extra_meta["author"])
                    if "userName" in extra_meta and extra_meta["userName"]:
                        extra_meta["userName"] = redact_text(extra_meta["userName"])
                        
                    # Send to broker
                    review_id = record.get("review_id", "")
                    producer.send(
                        topic=topic,
                        key=review_id,
                        value=json.dumps(record)
                    )
                    records_sent += 1
                except Exception as e:
                    logger.error(f"Error producing line {line_num} in {file}: {e}")
                    
    producer.flush()
    logger.info(f"Streaming job completed. Total records sent to '{topic}': {records_sent}")
    return records_sent

def main():
    parser = argparse.ArgumentParser(description="Phase 1.3 Broker Producer Daemon")
    parser.add_argument("--archive-dir", type=str, default="data/archive", help="Validated archives root directory")
    parser.add_argument("--topic", type=str, default="topic-feedbacks", help="Target broker topic")
    
    args = parser.parse_args()
    publish_archive_to_broker(args.archive_dir, args.topic)

if __name__ == "__main__":
    main()

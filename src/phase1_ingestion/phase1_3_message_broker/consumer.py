import os
import json
import argparse
import logging
from phase1_ingestion.phase1_3_message_broker.broker import get_consumer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("broker_consumer")

def consume_stream_to_file(topic: str, group_id: str, output_file: str, max_messages: int = 0):
    """
    Listens to the message broker topic and writes consumed messages to a local file.
    Runs until interrupted, or until max_messages is reached (if greater than 0).
    """
    logger.info(f"Starting Broker Consumer. Topic: {topic}, Group: {group_id}, Output: {output_file}")
    
    # Ensure target output folder exists
    output_dir = os.path.dirname(output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        
    consumer = get_consumer(topics=[topic], group_id=group_id)
    records_received = 0
    empty_polls_count = 0
    
    try:
        while True:
            # Poll with a 1.0 second timeout
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                empty_polls_count += 1
                # If we are in test mode and have specified a limit,
                # we can exit after 5 consecutive empty polls to allow automated runs to finish
                if max_messages > 0 and empty_polls_count >= 5:
                    logger.info("No new messages found (polling timed out). Exiting test run.")
                    break
                continue
                
            # Reset empty poll counter on message receipt
            empty_polls_count = 0
            
            try:
                # Retrieve bytes and decode
                val_bytes = msg.value()
                val_str = val_bytes.decode("utf-8")
                record = json.loads(val_str)
                
                logger.info(f"Consumed message. ID: {record.get('review_id')}, Source: {record.get('source')}")
                
                # Append to processed output file
                with open(output_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(record) + "\n")
                    
                records_received += 1
                
                # Exit condition for testing
                if max_messages > 0 and records_received >= max_messages:
                    logger.info(f"Reached max message limit of {max_messages}. Stopping consumer.")
                    break
                    
            except Exception as parse_error:
                logger.error(f"Error parsing message payload: {parse_error}")
                
    except KeyboardInterrupt:
        logger.info("Consumer execution interrupted by user.")
    finally:
        consumer.close()
        logger.info(f"Consumer shutdown complete. Total records written to '{output_file}': {records_received}")

def main():
    parser = argparse.ArgumentParser(description="Phase 1.3 Broker Consumer Daemon")
    parser.add_argument("--topic", type=str, default="topic-feedbacks", help="Broker topic to subscribe to")
    parser.add_argument("--group-id", type=str, default="group-zepto-feedback-ingestion", help="Consumer group identity")
    parser.add_argument("--output-file", type=str, default="data/processed/feedbacks_stream_output.jsonl", help="Processed stream output filepath")
    parser.add_argument("--max-messages", type=int, default=0, help="Max records to consume before exiting (0 for infinite)")
    
    args = parser.parse_args()
    consume_stream_to_file(
        topic=args.topic,
        group_id=args.group_id,
        output_file=args.output_file,
        max_messages=args.max_messages
    )

if __name__ == "__main__":
    main()

import argparse
import logging
from phase1_ingestion.phase1_1_raw_ingestion.raw_ingestion import validate_and_archive_raw_files

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("run_ingestion")

def main():
    parser = argparse.ArgumentParser(description="Phase 1.1: Raw Data Ingestion & Archival Engine")
    parser.add_argument("--raw-dir", type=str, default="data/raw", help="Directory containing raw JSONL files")
    parser.add_argument("--archive-dir", type=str, default="data/archive", help="Target directory for validated files")
    parser.add_argument("--dlq-dir", type=str, default="data/dlq", help="Target directory for corrupt/invalid logs")
    
    args = parser.parse_args()
    
    logger.info("=========================================")
    logger.info("Starting Phase 1.1 Raw Ingestion Engine")
    logger.info("=========================================")
    
    metrics = validate_and_archive_raw_files(
        raw_dir=args.raw_dir,
        archive_dir=args.archive_dir,
        dlq_dir=args.dlq_dir
    )
    
    logger.info("=========================================")
    logger.info("Ingestion Metrics Summary:")
    logger.info(f"Total Raw Files Processed: {metrics['files_processed']}")
    logger.info(f"Total Valid Records Archived: {metrics['valid_records']}")
    logger.info(f"Total Corrupt Records Sent to DLQ: {metrics['corrupt_records']}")
    
    for source, stats in metrics["sources"].items():
        logger.info(f" -> Source '{source}': Valid={stats['valid']}, Corrupt={stats['corrupt']}")
    logger.info("=========================================")

if __name__ == "__main__":
    main()

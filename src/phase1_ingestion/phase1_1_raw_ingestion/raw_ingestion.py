import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Tuple, List
from pydantic import ValidationError
from phase0_scraping.models import ReviewSchema

# Configure logger
logger = logging.getLogger(__name__)

def parse_partition_from_path(filepath: str) -> Tuple[str, str, str, str]:
    """
    Parses the source, year, month, and day from the file path.
    Expected format: .../raw/{source}/year={year}/month={month}/day={day}/feedbacks_*.jsonl
    """
    parts = os.path.normpath(filepath).split(os.sep)
    
    # We search backwards to find partitions
    year, month, day, source = "unknown", "unknown", "unknown", "unknown"
    
    for i in range(len(parts) - 1, -1, -1):
        if parts[i].startswith("day="):
            day = parts[i].split("=")[1]
        elif parts[i].startswith("month="):
            month = parts[i].split("=")[1]
        elif parts[i].startswith("year="):
            year = parts[i].split("=")[1]
            if i > 0:
                source = parts[i-1]
                
    return source, year, month, day

def validate_and_archive_raw_files(raw_dir: str, archive_dir: str, dlq_dir: str) -> Dict[str, Any]:
    """
    Processes all raw JSONL files in raw_dir:
    1. Validates schema using Pydantic ReviewSchema.
    2. Writes valid records to partitioned folders in archive_dir.
    3. Writes corrupt records with error metadata to partitioned folders in dlq_dir.
    
    Returns:
        Summary metrics of the ingestion run.
    """
    logger.info(f"Starting raw ingestion scan. Raw: {raw_dir}, Archive: {archive_dir}, DLQ: {dlq_dir}")
    
    metrics = {
        "files_processed": 0,
        "valid_records": 0,
        "corrupt_records": 0,
        "sources": {}
    }
    
    if not os.path.exists(raw_dir):
        logger.warning(f"Raw directory does not exist: {raw_dir}")
        return metrics
        
    for root, _, files in os.walk(raw_dir):
        for file in files:
            if not file.endswith(".jsonl"):
                continue
                
            filepath = os.path.join(root, file)
            logger.info(f"Processing file: {filepath}")
            metrics["files_processed"] += 1
            
            source, year, month, day = parse_partition_from_path(filepath)
            
            if source not in metrics["sources"]:
                metrics["sources"][source] = {"valid": 0, "corrupt": 0}
                
            archive_partition_dir = os.path.join(
                archive_dir, source, f"year={year}", f"month={month}", f"day={day}"
            )
            dlq_partition_dir = os.path.join(
                dlq_dir, source, f"year={year}", f"month={month}", f"day={day}"
            )
            
            os.makedirs(archive_partition_dir, exist_ok=True)
            os.makedirs(dlq_partition_dir, exist_ok=True)
            
            validated_file = os.path.join(archive_partition_dir, "feedbacks_validated.jsonl")
            corrupt_file = os.path.join(dlq_partition_dir, "feedbacks_corrupt.jsonl")
            
            with open(filepath, "r", encoding="utf-8") as f_in:
                lines = f_in.readlines()
                
            valid_batch = []
            corrupt_batch = []
            
            for line_num, line in enumerate(lines, 1):
                stripped = line.strip()
                if not stripped:
                    continue
                    
                try:
                    record_dict = json.loads(stripped)
                    validated_record = ReviewSchema(**record_dict)
                    valid_batch.append(validated_record.model_dump_json())
                except (json.JSONDecodeError, ValidationError) as e:
                    logger.warning(f"Validation failed for {source} at line {line_num}: {e}")
                    corrupt_record = {
                        "raw_payload": stripped,
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "source_file": file,
                        "line_number": line_num
                    }
                    corrupt_batch.append(json.dumps(corrupt_record))
                    
            if valid_batch:
                with open(validated_file, "a", encoding="utf-8") as f_val:
                    for val_rec in valid_batch:
                        f_val.write(val_rec + "\n")
                metrics["valid_records"] += len(valid_batch)
                metrics["sources"][source]["valid"] += len(valid_batch)
                
            if corrupt_batch:
                with open(corrupt_file, "a", encoding="utf-8") as f_dlq:
                    for crp_rec in corrupt_batch:
                        f_dlq.write(crp_rec + "\n")
                metrics["corrupt_records"] += len(corrupt_batch)
                metrics["sources"][source]["corrupt"] += len(corrupt_batch)
                
    logger.info(f"Ingestion scan completed. Metrics: {metrics}")
    return metrics

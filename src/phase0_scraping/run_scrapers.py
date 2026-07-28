import os
import argparse
import logging
import json
from datetime import datetime
from typing import List

# Import scrapers
from phase0_scraping.play_store_scraper import scrape_play_store_reviews
from phase0_scraping.app_store_scraper import scrape_app_store_reviews
from phase0_scraping.reddit_scraper import scrape_reddit_discussions
from phase0_scraping.forum_scraper import scrape_forum_comments
from phase0_scraping.models import ReviewSchema

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("run_scrapers")

def save_to_partitioned_jsonl(reviews: List[ReviewSchema], out_dir: str):
    """
    Saves a list of standardized reviews into a JSON Lines file 
    partitioned by source and date (e.g. out_dir/source/year=YYYY/month=MM/feedbacks.jsonl)
    """
    if not reviews:
        return
        
    source = reviews[0].source
    today = datetime.utcnow()
    
    # Construct S3-like directory structure
    partition_path = os.path.join(
        out_dir, 
        source, 
        f"year={today.strftime('%Y')}", 
        f"month={today.strftime('%m')}",
        f"day={today.strftime('%d')}"
    )
    
    os.makedirs(partition_path, exist_ok=True)
    filename = f"feedbacks_{today.strftime('%Y%m%d_%H%M%S')}.jsonl"
    filepath = os.path.join(partition_path, filename)
    
    logger.info(f"Saving {len(reviews)} reviews for '{source}' to {filepath}")
    
    with open(filepath, "w", encoding="utf-8") as f:
        for r in reviews:
            f.write(r.model_dump_json() + "\n")
            
    logger.info(f"Successfully saved to {filepath}")

def main():
    parser = argparse.ArgumentParser(description="Zepto Customer Feedback Scraping CLI")
    parser.add_argument("--limit", type=int, default=30, help="Max reviews to scrape per source")
    parser.add_argument("--out-dir", type=str, default="data/raw", help="Root directory to save raw outputs")
    parser.add_argument("--query", type=str, default="zepto", help="Query term for Reddit search")
    parser.add_argument("--play-package", type=str, default="com.zepto.grocery", help="Google Play package name")
    parser.add_argument("--ios-app-id", type=str, default="1578321743", help="iOS App Store ID")
    parser.add_argument("--forum-url", type=str, default="https://news.ycombinator.com/", help="URL for general forum scraping test")
    
    args = parser.parse_args()
    
    # Ensure raw output root directory exists
    os.makedirs(args.out_dir, exist_ok=True)
    
    logger.info("=========================================")
    logger.info("Initializing Phase 0 Data Scraping Jobs")
    logger.info("=========================================")
    
    # 1. Play Store
    try:
        play_reviews = scrape_play_store_reviews(package_name=args.play_package, limit=args.limit)
        save_to_partitioned_jsonl(play_reviews, args.out_dir)
    except Exception as e:
        logger.error(f"Failed Play Store job: {e}")
        
    # 2. App Store
    try:
        ios_reviews = scrape_app_store_reviews(app_id=args.ios_app_id, limit=args.limit)
        save_to_partitioned_jsonl(ios_reviews, args.out_dir)
    except Exception as e:
        logger.error(f"Failed App Store job: {e}")
        
    # 3. Reddit
    try:
        reddit_reviews = scrape_reddit_discussions(query=args.query, limit=args.limit)
        save_to_partitioned_jsonl(reddit_reviews, args.out_dir)
    except Exception as e:
        logger.error(f"Failed Reddit job: {e}")
        
    # 4. Forums (Web page scraping)
    try:
        forum_reviews = scrape_forum_comments(url=args.forum_url)
        # Limit extracted paragraphs if generic
        if len(forum_reviews) > args.limit:
            forum_reviews = forum_reviews[:args.limit]
        save_to_partitioned_jsonl(forum_reviews, args.out_dir)
    except Exception as e:
        logger.error(f"Failed Forum job: {e}")
        
    logger.info("Phase 0 Scraping execution completed successfully.")

if __name__ == "__main__":
    main()

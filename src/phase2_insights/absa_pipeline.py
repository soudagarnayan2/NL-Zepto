import sqlite3
import logging
from typing import Tuple, Dict, Any
from phase1_ingestion.phase1_4_db_storage.database import get_db_connection

# Configure logger
logger = logging.getLogger("absa_pipeline")

# Aspect Keywords Definitions (Simulating ABSA Model Classification)
ASPECT_KEYWORDS = {
    "Freshness": ["fruit", "vegetable", "tomato", "onion", "leafy", "spinach", "coriander", "fresh", "rotten", "bruised", "bad quality", "curd", "yogurt", "milk", "produce", "moldy"],
    "Delivery Speed": ["slow", "fast", "speed", "delivery", "minutes", "delay", "rider", "driver", "time", "late", "arrive", "reached"],
    "Pricing & Fees": ["price", "fee", "charge", "coupon", "discount", "cost", "expensive", "cheap", "surge", "handling", "pricing", "delivery fee", "money"],
    "Inventory": ["stock", "out of stock", "empty", "inventory", "available", "missing", "catalog", "selection"],
    "App Experience": ["crash", "app", "ui", "ux", "payment", "login", "logout", "otp", "screen", "widget", "activities", "search", "autocomplete", "refund", "deducted"]
}

def analyze_aspect_and_sentiment(content: str, title: str = "", rating: int = None) -> Tuple[str, str, float]:
    """
    Simulates Aspect-Based Sentiment Analysis using keyword weights and rating heuristics.
    Returns: Tuple[sentiment, aspect_category, friction_score]
    """
    text = (title + " " + content).lower()
    
    # 1. Determine Aspect Category based on keyword counts
    aspect_counts = {aspect: 0 for aspect in ASPECT_KEYWORDS}
    for aspect, keywords in ASPECT_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                aspect_counts[aspect] += 1
                
    # Identify aspect with the maximum occurrences, default to "General" if no matches
    max_aspect = max(aspect_counts, key=aspect_counts.get)
    if aspect_counts[max_aspect] == 0:
        aspect_category = "General"
    else:
        aspect_category = max_aspect
        
    # 2. Determine Sentiment
    sentiment = "NEUTRAL"
    if rating is not None:
        if rating >= 4:
            sentiment = "POSITIVE"
        elif rating <= 2:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"
    else:
        # Fallback to sentiment lexicon if rating is missing (Reddit/Forum)
        pos_words = ["good", "great", "excellent", "awesome", "fast", "polite", "fresh", "smooth", "love"]
        neg_words = ["bad", "slow", "rotten", "crash", "expensive", "annoying", "poor", "rubbish", "trash", "hate", "fail", "complained"]
        
        pos_score = sum(1 for w in pos_words if w in text)
        neg_score = sum(1 for w in neg_words if w in text)
        
        if pos_score > neg_score:
            sentiment = "POSITIVE"
        elif neg_score > pos_score:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"

    # 3. Calculate Friction Score (0.0 to 5.0, where 5.0 is highest friction)
    if sentiment == "POSITIVE":
        friction_score = 0.0
    elif sentiment == "NEUTRAL":
        friction_score = 2.0
    else:
        # Negative sentiment calculations
        if rating == 1:
            friction_score = 5.0
        elif rating == 2:
            friction_score = 4.0
        elif rating == 3:
            friction_score = 3.0
        else:
            # Rating is missing (Reddit/Forum) but negative sentiment
            friction_score = 4.0

    return sentiment, aspect_category, friction_score


def run_absa_classification():
    """
    Reads all raw staging feedbacks from database, performs aspect-based
    sentiment categorization, and stores them in the classified_insights table.
    """
    logger.info("Initializing ABSA Pipeline Classification Job...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create classified_insights table
    is_sqlite = isinstance(conn, sqlite3.Connection)
    if is_sqlite:
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS classified_insights (
            review_id TEXT PRIMARY KEY,
            sentiment TEXT NOT NULL,
            aspect_category TEXT NOT NULL,
            friction_score REAL NOT NULL,
            FOREIGN KEY (review_id) REFERENCES feedbacks (review_id)
        );
        """
    else:
        # PostgreSQL syntax
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS classified_insights (
            review_id VARCHAR(100) PRIMARY KEY,
            sentiment VARCHAR(50) NOT NULL,
            aspect_category VARCHAR(100) NOT NULL,
            friction_score REAL NOT NULL,
            FOREIGN KEY (review_id) REFERENCES feedbacks (review_id) ON DELETE CASCADE
        );
        """
        
    cursor.execute(create_table_sql)
    conn.commit()
    
    # 2. Fetch all staging feedbacks
    cursor.execute("SELECT review_id, title, content, rating FROM feedbacks")
    feedbacks = cursor.fetchall()
    logger.info(f"Loaded {len(feedbacks)} staging feedbacks for sentiment processing.")
    
    records_saved = 0
    
    for row in feedbacks:
        review_id, title, content, rating = row
        sentiment, aspect_category, friction_score = analyze_aspect_and_sentiment(content, title or "", rating)
        
        # Storing or updating insights
        if is_sqlite:
            upsert_sql = """
            INSERT INTO classified_insights (review_id, sentiment, aspect_category, friction_score)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(review_id) 
            DO UPDATE SET 
                sentiment = excluded.sentiment,
                aspect_category = excluded.aspect_category,
                friction_score = excluded.friction_score;
            """
            cursor.execute(upsert_sql, (review_id, sentiment, aspect_category, friction_score))
        else:
            upsert_sql = """
            INSERT INTO classified_insights (review_id, sentiment, aspect_category, friction_score)
            VALUES (%(review_id)s, %(sentiment)s, %(aspect_category)s, %(friction_score)s)
            ON CONFLICT (review_id) 
            DO UPDATE SET 
                sentiment = EXCLUDED.sentiment,
                aspect_category = EXCLUDED.aspect_category,
                friction_score = EXCLUDED.friction_score;
            """
            cursor.execute(upsert_sql, {
                "review_id": review_id,
                "sentiment": sentiment,
                "aspect_category": aspect_category,
                "friction_score": friction_score
            })
        records_saved += 1
        
    conn.commit()
    conn.close()
    logger.info(f"ABSA classification completed. Processed {records_saved} feedbacks.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_absa_classification()

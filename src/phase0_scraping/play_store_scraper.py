import logging
from typing import List
from datetime import datetime, timedelta
import random
from phase0_scraping.models import ReviewSchema

# Configure logger
logger = logging.getLogger(__name__)

# Curated high-quality mock reviews for Zepto (Play Store)
MOCK_PLAY_STORE_REVIEWS = [
    {
        "content": "Excellent app! Extremely fast delivery, got my order in 9 minutes. The vegetables are fresh and clean. Highly recommended.",
        "score": 5,
        "reviewCreatedVersion": "2.14.0",
        "userName": "Rahul Sharma",
        "thumbsUpCount": 14
    },
    {
        "content": "Zepto has changed the way I shop. But off late, they are showing many items out of stock in my area (Indiranagar). Please fix the inventory issues.",
        "score": 3,
        "reviewCreatedVersion": "2.13.5",
        "userName": "Priyanka Nair",
        "thumbsUpCount": 42
    },
    {
        "content": "App keeps crashing on payment screen. Tried placing order twice and money got deducted but order was not placed. Very bad UI experience.",
        "score": 1,
        "reviewCreatedVersion": "2.14.1",
        "userName": "Amit Patel",
        "thumbsUpCount": 8
    },
    {
        "content": "The delivery guy was very polite. Veggies were neat and well packed. It would be great if they could add more organic brands in the personal care section.",
        "score": 4,
        "reviewCreatedVersion": "2.12.0",
        "userName": "Sneha Reddy",
        "thumbsUpCount": 3
    },
    {
        "content": "Why did you guys increase the delivery charges? Earlier it was free above 99, now even for 199 you are charging delivery. Instamart is offering better coupons.",
        "score": 2,
        "reviewCreatedVersion": "2.14.0",
        "userName": "Vikram Singh",
        "thumbsUpCount": 29
    },
    {
        "content": "I ordered gourmet cheese and it was close to expiry date. Quick commerce shouldn't mean delivering old stock. Quality check needs improvement.",
        "score": 2,
        "reviewCreatedVersion": "2.13.0",
        "userName": "Rohan Das",
        "thumbsUpCount": 19
    },
    {
        "content": "Super convenient! Order milk and eggs daily. They always deliver on time. UI is simple and reordering is very easy.",
        "score": 5,
        "reviewCreatedVersion": "2.14.1",
        "userName": "Anjali Gupta",
        "thumbsUpCount": 5
    }
]

def scrape_play_store_reviews(package_name: str = "com.zepto.grocery", limit: int = 50) -> List[ReviewSchema]:
    """
    Scrapes reviews for a specified Android app from the Google Play Store.
    Falls back to generating realistic mock reviews if live scraping yields 0 results.
    """
    logger.info(f"Starting Play Store scraping for package: {package_name} (limit: {limit})")
    
    raw_reviews = []
    
    try:
        from google_play_scraper import Sort, reviews as fetch_reviews
        raw_reviews, _ = fetch_reviews(
            package_name,
            lang='en',
            country='in',
            sort=Sort.NEWEST,
            count=limit
        )
    except Exception as e:
        logger.warning(f"Live Play Store scraping failed or library missing ({e}). Using fallback generator.")
        
    standardized_reviews = []
    
    # Process live reviews if fetched
    if raw_reviews:
        for r in raw_reviews:
            app_version = r.get('reviewCreatedVersion') or r.get('appVersion')
            dt = r.get('at')
            timestamp_str = dt.isoformat() if isinstance(dt, datetime) else str(dt)
            
            review_obj = ReviewSchema(
                review_id=str(r.get('reviewId', '')),
                source="play_store",
                rating=r.get('score'),
                title=None,
                content=str(r.get('content', '')),
                timestamp=timestamp_str,
                version=app_version,
                extra_metadata={
                    "userName": r.get('userName'),
                    "thumbsUpCount": r.get('thumbsUpCount', 0),
                    "mode": "live"
                }
            )
            standardized_reviews.append(review_obj)
            
    # Fallback to high-quality mock data if no reviews fetched
    if not standardized_reviews:
        logger.info("Live Play Store returned 0 records. Generating realistic mock data.")
        now = datetime.utcnow()
        for idx, mock in enumerate(MOCK_PLAY_STORE_REVIEWS[:limit]):
            timestamp_str = (now - timedelta(hours=idx * 4)).isoformat() + "Z"
            review_obj = ReviewSchema(
                review_id=f"mock_play_{package_name}_{idx}",
                source="play_store",
                rating=mock["score"],
                title=None,
                content=mock["content"],
                timestamp=timestamp_str,
                version=mock["reviewCreatedVersion"],
                extra_metadata={
                    "userName": mock["userName"],
                    "thumbsUpCount": mock["thumbsUpCount"],
                    "mode": "fallback_simulated"
                }
            )
            standardized_reviews.append(review_obj)
            
    logger.info(f"Successfully returned {len(standardized_reviews)} reviews for Play Store.")
    return standardized_reviews

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = scrape_play_store_reviews(limit=5)
    print(f"Play Store fetched {len(results)} items:")
    for r in results:
        print(r.model_dump())

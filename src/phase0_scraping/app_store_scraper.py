import logging
import requests
from typing import List
from datetime import datetime, timedelta
from phase0_scraping.models import ReviewSchema

# Configure logger
logger = logging.getLogger(__name__)

MOCK_APP_STORE_REVIEWS = [
    {
        "title": "Excellent iOS App UI",
        "content": "Zepto iOS app is beautiful. Dark mode and live activities support are great. Apple Pay/UPI integration is super smooth. But sometimes search fails to show organic baby food.",
        "rating": 4,
        "version": "3.2.0",
        "author": "Kunal Kapoor"
    },
    {
        "title": "Search Autocomplete issues",
        "content": "The search auto-complete is annoying. It keeps correcting my brand searches to wrong generic items. E.g., searching for 'Epigamia yogurt' gives me generic local curd.",
        "rating": 3,
        "version": "3.1.8",
        "author": "Aishwarya Sen"
    },
    {
        "title": "Frequent Logouts",
        "content": "Why does it log me out every time the app updates? I have to do OTP login again and again. Delivery speed is good but app convenience is decreasing.",
        "rating": 2,
        "version": "3.2.0",
        "author": "Neeraj Chopra"
    },
    {
        "title": "Request: Health & Wellness products",
        "content": "Vitamins and supplements category is totally empty. We have to buy from Tata 1mg because Zepto has nothing here. Quick delivery would be amazing for health wellness items.",
        "rating": 3,
        "version": "3.1.0",
        "author": "Dr. Kavita Rao"
    },
    {
        "title": "Unbelievably Fast!",
        "content": "Awesome application. Sleek widgets and live activities support on iOS is next level. Got milk and bread in 7 mins. Incredible logistics!",
        "rating": 5,
        "version": "3.2.1",
        "author": "Kabir Mehta"
    }
]

def scrape_app_store_reviews(app_id: str = "1578321743", country: str = "in", limit: int = 50) -> List[ReviewSchema]:
    """
    Scrapes reviews for a specified iOS app from the Apple App Store RSS feed.
    Falls back to generating realistic mock reviews if live scraping yields 0 results.
    """
    logger.info(f"Starting App Store scraping for App ID: {app_id} (country: {country}, limit: {limit})")
    
    url = f"https://itunes.apple.com/{country}/rss/customerreviews/id={app_id}/sortby=mostrecent/json"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    standardized_reviews = []

    try:
        response = requests.get(url, headers=headers, timeout=12)
        if response.status_code == 200:
            data = response.json()
            feed = data.get("feed", {})
            entries = feed.get("entry", [])
            
            if isinstance(entries, dict):
                entries = [entries]
                
            for entry in entries:
                if "im:name" in entry:
                    continue
                    
                review_id = entry.get("id", {}).get("label")
                if not review_id:
                    continue
                    
                rating = entry.get("im:rating", {}).get("label")
                rating_val = int(rating) if rating else None
                
                title = entry.get("title", {}).get("label")
                content = entry.get("content", {}).get("label", "")
                version = entry.get("im:version", {}).get("label")
                
                updated_str = entry.get("updated", {}).get("label")
                timestamp = updated_str if updated_str else datetime.utcnow().isoformat() + "Z"
                author_name = entry.get("author", {}).get("name", {}).get("label", "Anonymous")
                
                review_obj = ReviewSchema(
                    review_id=str(review_id),
                    source="app_store",
                    rating=rating_val,
                    title=title,
                    content=content,
                    timestamp=timestamp,
                    version=version,
                    extra_metadata={
                        "author": author_name,
                        "country": country,
                        "mode": "live"
                    }
                )
                standardized_reviews.append(review_obj)
                
                if len(standardized_reviews) >= limit:
                    break
    except Exception as e:
        logger.warning(f"Live App Store scraping failed ({e}). Falling back to simulated data.")

    # Fallback if empty
    if not standardized_reviews:
        logger.info("Live App Store RSS returned 0 records. Generating realistic mock data.")
        now = datetime.utcnow()
        for idx, mock in enumerate(MOCK_APP_STORE_REVIEWS[:limit]):
            timestamp_str = (now - timedelta(hours=idx * 6)).isoformat() + "Z"
            review_obj = ReviewSchema(
                review_id=f"mock_ios_{app_id}_{idx}",
                source="app_store",
                rating=mock["rating"],
                title=mock["title"],
                content=mock["content"],
                timestamp=timestamp_str,
                version=mock["version"],
                extra_metadata={
                    "author": mock["author"],
                    "country": country,
                    "mode": "fallback_simulated"
                }
            )
            standardized_reviews.append(review_obj)

    logger.info(f"Successfully returned {len(standardized_reviews)} reviews for App Store.")
    return standardized_reviews

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = scrape_app_store_reviews(limit=5)
    print(f"App Store fetched {len(results)} items:")
    for r in results:
        print(r.model_dump())

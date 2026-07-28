import logging
import requests
import time
from typing import List
from datetime import datetime, timedelta
from phase0_scraping.models import ReviewSchema

# Configure logger
logger = logging.getLogger(__name__)

MOCK_REDDIT_POSTS = [
    {
        "title": "Why is Zepto so successful despite charging premium?",
        "selftext": "I mean, Blinkit has a larger catalog, but Zepto's delivery is consistently under 10 minutes. I live in Bangalore and they deliver my daily milk and bread before I even brush. How do they manage their hyper-local supply chain so well? Do they pay their delivery partners well?",
        "subreddit": "r/india",
        "author": "tech_geek_99",
        "score": 142,
        "num_comments": 54,
        "permalink": "/r/india/comments/z1/success_story/"
    },
    {
        "title": "Zepto delivery riders driving dangerously in Indiranagar",
        "selftext": "Seriously, I almost got hit by a Zepto delivery boy today. They drive like crazy in narrow lanes just to meet the 10-minute target. This is getting out of hand. Zepto needs to relax the 10-min constraint. Human lives are more important than quick tomatoes.",
        "subreddit": "r/bangalore",
        "author": "road_safety_first",
        "score": 389,
        "num_comments": 112,
        "permalink": "/r/bangalore/comments/z2/rider_safety/"
    },
    {
        "title": "Anyone else facing quality issues with Zepto Fresh veggies?",
        "selftext": "Lately the onions and tomatoes I order from Zepto are half rotten or bruised. They do issue refunds instantly, but it is a hassle to re-order. I feel their dark store sorting is too rushed. Anyone else moving back to local vendors?",
        "subreddit": "r/mumbai",
        "author": "foodie_mumbaikar",
        "score": 67,
        "num_comments": 28,
        "permalink": "/r/mumbai/comments/z3/fresh_veggies/"
    },
    {
        "title": "Instamart vs Blinkit vs Zepto - Which is your go-to app?",
        "selftext": "I use Zepto for dairy and fresh items, Blinkit for electronics and home utility things, and Instamart when they give good discounts. But Zepto's search is trash compared to Blinkit. Searching for specific gourmet chocolate returns zero matches even if they have it.",
        "subreddit": "r/india",
        "author": "grocery_queen",
        "score": 98,
        "num_comments": 42,
        "permalink": "/r/india/comments/z4/app_comparison/"
    }
]

def scrape_reddit_discussions(query: str = "zepto", limit: int = 25) -> List[ReviewSchema]:
    """
    Scrapes public discussions and posts mentioning the target brand from Reddit search.
    Falls back to high-quality simulated Reddit data if rate-limited or blocked (HTTP 403).
    """
    logger.info(f"Starting Reddit scraping for query: '{query}' (limit: {limit})")
    
    url = f"https://www.reddit.com/search.json?q={query}&sort=new&limit={limit}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 NextLeapZeptoDiscovery/1.0"
    }
    
    standardized_reviews = []

    try:
        response = requests.get(url, headers=headers, timeout=12)
        if response.status_code == 429:
            logger.warning("Reddit API returned 429. Waiting before retry...")
            time.sleep(1.5)
            response = requests.get(url, headers=headers, timeout=12)
            
        if response.status_code == 200:
            payload = response.json()
            children = payload.get("data", {}).get("children", [])
            
            for child in children:
                data = child.get("data", {})
                post_id = data.get("id")
                if not post_id:
                    continue
                    
                title = data.get("title")
                selftext = data.get("selftext", "")
                content = selftext if selftext else title
                
                created_utc = data.get("created_utc")
                timestamp = datetime.utcfromtimestamp(created_utc).isoformat() + "Z" if created_utc else datetime.utcnow().isoformat() + "Z"
                
                review_obj = ReviewSchema(
                    review_id=f"reddit_{post_id}",
                    source="reddit",
                    rating=None,
                    title=title,
                    content=content,
                    timestamp=timestamp,
                    version=None,
                    extra_metadata={
                        "subreddit": data.get("subreddit", "unknown"),
                        "author": data.get("author", "[deleted]"),
                        "score": data.get("score", 0),
                        "num_comments": data.get("num_comments", 0),
                        "url": f"https://reddit.com{data.get('permalink', '')}",
                        "mode": "live"
                    }
                )
                standardized_reviews.append(review_obj)
        else:
            logger.warning(f"Reddit API returned non-200 status: {response.status_code}. Activating fallback.")
            
    except Exception as e:
        logger.warning(f"Reddit scraper encountered an error ({e}). Activating fallback.")

    # Fallback if blocked/empty
    if not standardized_reviews:
        logger.info("Reddit live scraping yielded 0 records or was blocked. Generating realistic mock data.")
        now = datetime.utcnow()
        for idx, mock in enumerate(MOCK_REDDIT_POSTS[:limit]):
            timestamp_str = (now - timedelta(days=idx)).isoformat() + "Z"
            review_obj = ReviewSchema(
                review_id=f"mock_reddit_{query}_{idx}",
                source="reddit",
                rating=None,
                title=mock["title"],
                content=mock["selftext"],
                timestamp=timestamp_str,
                version=None,
                extra_metadata={
                    "subreddit": mock["subreddit"],
                    "author": mock["author"],
                    "score": mock["score"],
                    "num_comments": mock["num_comments"],
                    "url": f"https://reddit.com{mock['permalink']}",
                    "mode": "fallback_simulated"
                }
            )
            standardized_reviews.append(review_obj)

    logger.info(f"Successfully returned {len(standardized_reviews)} posts for Reddit.")
    return standardized_reviews

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = scrape_reddit_discussions(limit=5)
    print(f"Reddit fetched {len(results)} items:")
    for r in results:
        print(r.model_dump())

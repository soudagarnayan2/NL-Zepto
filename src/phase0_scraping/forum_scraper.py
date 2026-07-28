import logging
import hashlib
import requests
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from phase0_scraping.models import ReviewSchema

# Configure logger
logger = logging.getLogger(__name__)

MOCK_FORUM_POSTS = [
    {
        "content": "Zepto has been expanding their category lists. Now they have kitchen utility and home cleaning products too. But catalog discovery is extremely difficult. You have to click multiple sub-menus just to find garbage bags or foil rolls. The search bar is not helpful.",
        "title": "Category discovery is hard on Zepto",
        "rating": 3
    },
    {
        "content": "I want to complain about Zepto's fresh produce quality. Sometimes the coriander and spinach have roots covered in thick mud, and half the leaves are yellow. I get they want to deliver under 10 minutes, but basic QC is a must before packing.",
        "title": "Poor quality check for leafy vegetables",
        "rating": 2
    },
    {
        "content": "Quick commerce pricing is rising. Earlier there was no handling fee. Now they charge surge fees during rains, dynamic delivery charges, and handling fees. It is becoming cheaper and more reliable to walk down to the local kirana shop.",
        "title": "Handling fees and surge pricing ruins it",
        "rating": 2
    }
]

def scrape_forum_comments(url: str, selectors: Dict[str, str] = None) -> List[ReviewSchema]:
    """
    A generic BeautifulSoup4-based scraper to extract unstructured feedback, reviews,
    or comments from public forums, blogs, or product pages.
    Falls back to high-quality simulated discussions if live scraping fails or returns 0 items.
    """
    logger.info(f"Starting general forum scraping for URL: {url}")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    if not selectors:
        selectors = {
            "container": "article, .comment, .review, .feedback-item",
            "content": "p, .content, .description, .body",
            "rating": ".rating, .score, .stars",
            "title": "h3, h4, .title, .subject",
            "date": "time, .date, .timestamp"
        }

    standardized_reviews = []

    try:
        response = requests.get(url, headers=headers, timeout=12)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            containers = soup.select(selectors.get("container", ""))
            
            if not containers:
                logger.warning(f"No containers matched selector '{selectors.get('container')}' in live scrape. Checking paragraphs fallback.")
                paragraphs = soup.find_all('p')
                for i, p in enumerate(paragraphs):
                    text = p.get_text(strip=True)
                    if len(text) < 40:  # Skip short text snippets
                        continue
                        
                    content_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:12]
                    review_obj = ReviewSchema(
                        review_id=f"web_{content_hash}_{i}",
                        source="forum",
                        rating=None,
                        title=None,
                        content=text,
                        timestamp=datetime.utcnow().isoformat() + "Z",
                        version=None,
                        extra_metadata={"url": url, "mode": "fallback_paragraphs_live"}
                    )
                    standardized_reviews.append(review_obj)
            else:
                for idx, container in enumerate(containers):
                    content_elem = container.select_one(selectors.get("content", ""))
                    content_text = content_elem.get_text(strip=True) if content_elem else ""
                    if not content_text:
                        continue
                        
                    title_elem = container.select_one(selectors.get("title", ""))
                    title_text = title_elem.get_text(strip=True) if title_elem else None
                    
                    rating_val = None
                    rating_elem = container.select_one(selectors.get("rating", ""))
                    if rating_elem:
                        rating_str = rating_elem.get_text(strip=True)
                        digits = [int(s) for s in rating_str.split() if s.isdigit()]
                        if digits:
                            rating_val = digits[0]
                    
                    date_elem = container.select_one(selectors.get("date", ""))
                    timestamp = datetime.utcnow().isoformat() + "Z"
                    if date_elem:
                        if date_elem.has_attr("datetime"):
                            timestamp = date_elem["datetime"]
                        else:
                            timestamp_text = date_elem.get_text(strip=True)
                            if timestamp_text:
                                timestamp = timestamp_text
                    
                    content_hash = hashlib.md5(content_text.encode('utf-8')).hexdigest()[:12]
                    review_obj = ReviewSchema(
                        review_id=f"forum_{content_hash}_{idx}",
                        source="forum",
                        rating=rating_val,
                        title=title_text,
                        content=content_text,
                        timestamp=timestamp,
                        version=None,
                        extra_metadata={"url": url, "mode": "selectors_live"}
                    )
                    standardized_reviews.append(review_obj)
    except Exception as e:
        logger.warning(f"Live forum scraping failed ({e}). Activating fallback.")

    # Fallback if empty
    if not standardized_reviews:
        logger.info("Forum live scraping yielded 0 records. Generating realistic mock data.")
        now = datetime.utcnow()
        for idx, mock in enumerate(MOCK_FORUM_POSTS):
            timestamp_str = (now - timedelta(days=idx)).isoformat() + "Z"
            content_hash = hashlib.md5(mock["content"].encode('utf-8')).hexdigest()[:12]
            review_obj = ReviewSchema(
                review_id=f"mock_forum_{content_hash}_{idx}",
                source="forum",
                rating=mock["rating"],
                title=mock["title"],
                content=mock["content"],
                timestamp=timestamp_str,
                version=None,
                extra_metadata={
                    "url": url,
                    "mode": "fallback_simulated"
                }
            )
            standardized_reviews.append(review_obj)

    logger.info(f"Successfully returned {len(standardized_reviews)} reviews for Forum.")
    return standardized_reviews

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_url = "https://news.ycombinator.com/"
    results = scrape_forum_comments(test_url)
    print(f"Forum fetched {len(results)} items:")
    for r in results[:3]:
        print(r.model_dump())

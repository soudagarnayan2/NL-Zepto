import os
import re
import requests
from typing import Optional, Dict, Any, List
from app.zepto_catalog_500 import ZEPTO_500_CATALOG

LOCAL_ZEPTO_CATALOG: List[Dict[str, Any]] = ZEPTO_500_CATALOG


class ZeptoAPI:
    """Client for interacting with Zepto's live product catalog API with offline local catalog fallback."""

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (
            base_url or os.getenv("ZEPTO_API_BASE", "https://api.zepto.example/v1")
        ).rstrip("/")
        self.api_key = api_key or os.getenv("ZEPTO_API_KEY", "")

        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({
                "Authorization": f"Bearer {self.api_key}"
            })

    def get_categories(self) -> Any:
        """GET /categories — returns full category/subcategory tree."""
        try:
            url = f"{self.base_url}/categories"
            response = self.session.get(url, timeout=2)
            response.raise_for_status()
            return response.json()
        except Exception:
            # Local fallback categories
            return [
                {"id": "cat_dairy", "name": "Dairy, Bread & Eggs"},
                {"id": "cat_fruits", "name": "Fruits & Vegetables"},
                {"id": "cat_munchies", "name": "Munchies & Chocolates"},
                {"id": "cat_beverages", "name": "Tea, Coffee & Beverages"},
                {"id": "cat_protein", "name": "Protein & Wellness"},
            ]

    def search_items(
        self, query: str, category_id: Optional[str] = None, limit: int = 10
    ) -> Any:
        """GET /items/search — search catalog items by query and optional category filter."""
        try:
            url = f"{self.base_url}/items/search"
            params: Dict[str, Any] = {"q": query, "limit": limit}
            if category_id is not None:
                params["category_id"] = category_id

            response = self.session.get(url, params=params, timeout=2)
            response.raise_for_status()
            return response.json()
        except Exception:
            return self._local_search(query, limit)

    def _local_search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Perform fuzzy token matching on local catalog dataset."""
        q_clean = query.lower()
        
        # Keyword synonym normalization mapping
        synonyms = {
            "paneer": ["paneer", "cottage cheese", "malai paneer"],
            "cheese": ["cheese", "paneer"],
            "butter": ["butter", "ghee"],
            "milk": ["milk", "dairy", "taaza"],
            "curd": ["curd", "dahi", "yogurt"],
            "atta": ["atta", "wheat flour", "flour"],
            "rice": ["rice", "basmati"],
            "dal": ["dal", "dals", "lentils", "pulses", "moong", "toor", "chana"],
            "oil": ["oil", "ghee"],
            "ghee": ["ghee", "butter"],
            "bread": ["bread", "pav", "toast"],
            "egg": ["egg", "eggs"],
            "tomato": ["tomato", "tomatoes"],
            "onion": ["onion", "onions"],
            "tea": ["tea", "chai"],
            "coffee": ["coffee", "brew"],
            "chocolate": ["chocolate", "chocolates", "cocoa"],
            "protein": ["protein", "whey", "peanut butter", "isolate", "creatine", "bcaa", "gainer"],
            "whey": ["whey", "protein", "isolate"],
            "jewellery": ["jewellery", "jewelry", "jhumka", "jhumkas", "earrings", "necklace", "ring", "pendant", "bracelet", "bangle", "choker", "giva", "zaveri"],
            "jhumka": ["jhumka", "jhumkas", "earrings", "jewellery"],
            "earrings": ["earrings", "jhumka", "studs", "hoops", "drop earrings", "jewellery"],
            "necklace": ["necklace", "pendant", "choker", "chain", "jewellery"],
            "ring": ["ring", "solitaire", "band ring", "jewellery"],
            "apparel": ["apparel", "clothing", "tshirt", "shirt", "kurti", "hoodie", "pants", "socks", "boxers", "jockey", "levis", "puma"],
            "tshirt": ["tshirt", "tee", "shirt", "polo", "apparel"],
            "shirt": ["shirt", "tshirt", "denim shirt", "apparel"],
            "kurti": ["kurti", "tunic", "ethnic", "apparel"],
            "healthcare": ["healthcare", "pharmacy", "medicine", "first aid", "dettol", "volini", "moov", "cough", "syrup", "antiseptic", "multivitamin", "vitamin"],
            "medicine": ["healthcare", "pharmacy", "medicine", "tablets", "syrup"],
            "electronics": ["electronics", "earbuds", "tws", "charger", "power bank", "smartwatch", "speaker", "boat", "noise"],
            "earbuds": ["earbuds", "airdopes", "tws", "earphones", "headphones"],
            "kitchen": ["kitchen", "home", "cooker", "tawa", "flask", "kettle", "casserole", "milton", "prestige"]
        }

        tokens = [t for t in re.findall(r"\w+", q_clean) if len(t) > 1]
        expanded_tokens = set(tokens)
        for t in tokens:
            if t in synonyms:
                expanded_tokens.update(synonyms[t])

        # Extract budget constraints if mentioned (e.g. under 200 / under ₹200)
        budget = None
        budget_match = re.search(r"(?:under|below|<|<=|budget)?\s*₹?\s*(\d{2,5})", q_clean)
        if budget_match:
            try:
                budget = float(budget_match.group(1))
            except ValueError:
                pass

        matched_results = []
        for item in LOCAL_ZEPTO_CATALOG:
            # Check price budget constraint if budget specified
            if budget is not None and item["price"] > budget:
                continue

            score = 0
            item_text = f"{item['title']} {item['category']} {' '.join(item['tags'])}".lower()

            for token in expanded_tokens:
                if token in item_text:
                    score += 3
                for tag in item["tags"]:
                    if token in tag or tag in token:
                        score += 4

            if score > 0:
                matched_results.append((score, item))

        # Sort by match score descending, then rating descending
        matched_results.sort(key=lambda x: (x[0], x[1]["rating"]), reverse=True)

        items = [x[1] for x in matched_results[:limit]]

        return {
            "status": "success",
            "count": len(items),
            "items": items,
        }

    def get_item_details(self, item_id: str) -> Any:
        """GET /items/{item_id} — get details for a specific item."""
        try:
            url = f"{self.base_url}/items/{item_id}"
            response = self.session.get(url, timeout=2)
            response.raise_for_status()
            return response.json()
        except Exception:
            item = next((i for i in LOCAL_ZEPTO_CATALOG if i["id"] == item_id), LOCAL_ZEPTO_CATALOG[0])
            return {"status": "success", "item": item}

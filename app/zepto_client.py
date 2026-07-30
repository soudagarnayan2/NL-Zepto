import os
import re
import requests
from typing import Optional, Dict, Any, List

LOCAL_ZEPTO_CATALOG: List[Dict[str, Any]] = [
    # Dairy & Milk (Organic & Regular)
    {
        "id": "m1",
        "title": "Country Delight Organic Cow Milk (Pasteurised)",
        "category": "Dairy, Bread & Eggs",
        "price": 42,
        "mrp": 45,
        "rating": 4.9,
        "quantity": "500 ml",
        "tags": ["milk", "organic milk", "cow milk", "country delight", "organic", "dairy"],
    },
    {
        "id": "m2",
        "title": "Epigamia Artisanal Organic Whole Milk",
        "category": "Dairy, Bread & Eggs",
        "price": 65,
        "mrp": 70,
        "rating": 4.8,
        "quantity": "1 L",
        "tags": ["milk", "organic milk", "epigamia", "organic", "whole milk", "dairy"],
    },
    {
        "id": "m3",
        "title": "Amul Taaza T-Special Homogenised Toned Milk",
        "category": "Dairy, Bread & Eggs",
        "price": 28,
        "mrp": 30,
        "rating": 4.8,
        "quantity": "500 ml",
        "tags": ["milk", "toned milk", "amul", "taaza", "dairy"],
    },
    {
        "id": "m4",
        "title": "Mother Dairy Full Cream Fresh Milk",
        "category": "Dairy, Bread & Eggs",
        "price": 34,
        "mrp": 35,
        "rating": 4.7,
        "quantity": "500 ml",
        "tags": ["milk", "full cream milk", "mother dairy", "dairy"],
    },
    {
        "id": "m5",
        "title": "Raw Pressery Organic Almond Milk (Unsweetened)",
        "category": "Dairy & Plant Milk",
        "price": 180,
        "mrp": 210,
        "rating": 4.6,
        "quantity": "1 L",
        "tags": ["milk", "almond milk", "plant milk", "vegan", "organic milk", "organic"],
    },

    # Fruits & Strawberries
    {
        "id": "f1",
        "title": "Mahabaleshwar Fresh Sweet Strawberries",
        "category": "Fruits & Vegetables",
        "price": 89,
        "mrp": 120,
        "rating": 4.8,
        "quantity": "200 g pack",
        "tags": ["strawberries", "strawberry", "fresh strawberries", "fruits", "berries"],
    },
    {
        "id": "f2",
        "title": "Organic Hydroponic Sweet Strawberries",
        "category": "Fruits & Vegetables",
        "price": 129,
        "mrp": 150,
        "rating": 4.9,
        "quantity": "250 g box",
        "tags": ["strawberries", "organic strawberries", "strawberry", "organic", "fruits"],
    },
    {
        "id": "f3",
        "title": "Fresh Kashmiri Red Royal Apples",
        "category": "Fruits & Vegetables",
        "price": 149,
        "mrp": 180,
        "rating": 4.7,
        "quantity": "4 pcs (approx 500g)",
        "tags": ["apple", "apples", "fruits", "fresh fruits"],
    },
    {
        "id": "f4",
        "title": "Fresh Robusta Bananas (Sweet & Ripe)",
        "category": "Fruits & Vegetables",
        "price": 38,
        "mrp": 45,
        "rating": 4.8,
        "quantity": "1 kg (approx 6 pcs)",
        "tags": ["banana", "bananas", "fruits"],
    },
    {
        "id": "f5",
        "title": "Fresh Imported Blueberries Box",
        "category": "Fruits & Vegetables",
        "price": 199,
        "mrp": 250,
        "rating": 4.7,
        "quantity": "125 g pack",
        "tags": ["blueberries", "berries", "fruits"],
    },

    # Dark Chocolates & Chocolates under 200
    {
        "id": "c1",
        "title": "Amul Dark Chocolate (75% Intense Dark)",
        "category": "Munchies & Chocolates",
        "price": 115,
        "mrp": 130,
        "rating": 4.8,
        "quantity": "150 g bar",
        "tags": ["dark chocolate", "chocolate", "chocolates", "amul", "under 200"],
    },
    {
        "id": "c2",
        "title": "Cadbury Bournville 70% Dark Chocolate",
        "category": "Munchies & Chocolates",
        "price": 105,
        "mrp": 120,
        "rating": 4.7,
        "quantity": "80 g bar",
        "tags": ["dark chocolate", "chocolate", "chocolates", "bournville", "cadbury", "under 200"],
    },
    {
        "id": "c3",
        "title": "Lindt Excellence 70% Cocoa Dark Chocolate",
        "category": "Gourmet Chocolates",
        "price": 195,
        "mrp": 225,
        "rating": 4.9,
        "quantity": "100 g bar",
        "tags": ["dark chocolate", "chocolate", "chocolates", "lindt", "gourmet", "under 200"],
    },
    {
        "id": "c4",
        "title": "Hershey's Special Dark Whole Almonds Chocolate",
        "category": "Munchies & Chocolates",
        "price": 140,
        "mrp": 160,
        "rating": 4.7,
        "quantity": "100 g bar",
        "tags": ["dark chocolate", "chocolate", "chocolates", "hershey", "almond", "under 200"],
    },
    {
        "id": "c5",
        "title": "Ketofy Vegan Sugar-Free Dark Chocolate (85%)",
        "category": "Healthy Snacks",
        "price": 185,
        "mrp": 210,
        "rating": 4.6,
        "quantity": "75 g bar",
        "tags": ["dark chocolate", "chocolate", "chocolates", "sugar free", "keto", "under 200"],
    },

    # Protein & Healthy Snacks
    {
        "id": "p1",
        "title": "Pintola All Natural Organic Peanut Butter (Crunchy)",
        "category": "Protein & Wellness",
        "price": 299,
        "mrp": 349,
        "rating": 4.9,
        "quantity": "1 kg jar",
        "tags": ["protein", "peanut butter", "organic", "healthy", "weight loss"],
    },
    {
        "id": "p2",
        "title": "RiteBite Max Protein Bar (20g Protein - Choco Fudge)",
        "category": "Protein & Wellness",
        "price": 110,
        "mrp": 130,
        "rating": 4.7,
        "quantity": "70 g bar",
        "tags": ["protein", "protein bar", "healthy", "weight loss", "under 200"],
    },
    {
        "id": "p3",
        "title": "Yogabar High Protein Oats (Dark Chocolate & Nuts)",
        "category": "Breakfast & Oats",
        "price": 199,
        "mrp": 240,
        "rating": 4.8,
        "quantity": "400 g pack",
        "tags": ["protein", "oats", "healthy", "breakfast", "under 200"],
    },

    # Tea, Coffee & Beverages
    {
        "id": "t1",
        "title": "Tata Tea Gold Premium Assam Tea",
        "category": "Tea & Coffee",
        "price": 160,
        "mrp": 180,
        "rating": 4.8,
        "quantity": "500 g pack",
        "tags": ["tea", "chai", "tata tea", "beverages"],
    },
    {
        "id": "t2",
        "title": "Nescafe Classic Instant Coffee Jar",
        "category": "Tea & Coffee",
        "price": 185,
        "mrp": 210,
        "rating": 4.8,
        "quantity": "100 g jar",
        "tags": ["coffee", "nescafe", "instant coffee", "beverages"],
    },
]


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
        tokens = [t for t in re.findall(r"\w+", q_clean) if len(t) > 1]

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

            for token in tokens:
                if token in item_text:
                    score += 2
                for tag in item["tags"]:
                    if token in tag:
                        score += 3

            if score > 0 or not tokens:
                matched_results.append((score, item))

        # Sort by match score descending, then rating descending
        matched_results.sort(key=lambda x: (x[0], x[1]["rating"]), reverse=True)

        items = [x[1] for x in matched_results[:limit]]
        if not items:
            # Return top general items if no match
            items = LOCAL_ZEPTO_CATALOG[:limit]

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

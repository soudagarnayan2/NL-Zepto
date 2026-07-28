import os
import requests
from typing import Optional, Dict, Any, List


class ZeptoAPI:
    """Client for interacting with Zepto's live product catalog API."""

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
        url = f"{self.base_url}/categories"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

    def search_items(
        self, query: str, category_id: Optional[str] = None, limit: int = 10
    ) -> Any:
        """GET /items/search — search catalog items by query and optional category filter."""
        url = f"{self.base_url}/items/search"
        params: Dict[str, Any] = {"q": query, "limit": limit}
        if category_id is not None:
            params["category_id"] = category_id

        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def get_item_details(self, item_id: str) -> Any:
        """GET /items/{item_id} — get details for a specific item."""
        url = f"{self.base_url}/items/{item_id}"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

import unittest
from unittest.mock import patch, MagicMock
from app.zepto_client import ZeptoAPI
from app.tools import TOOLS, TOOL_IMPL


class TestZeptoAPI(unittest.TestCase):

    def setUp(self):
        self.api_key = "test_bearer_token_123"
        self.base_url = "http://api.zepto.test"
        self.client = ZeptoAPI(base_url=self.base_url, api_key=self.api_key)

    def test_bearer_authorization_header(self):
        self.assertEqual(
            self.client.session.headers.get("Authorization"),
            f"Bearer {self.api_key}",
        )

    @patch("requests.Session.get")
    def test_get_categories(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"id": "cat_dairy", "name": "Dairy, Bread & Eggs"}
        ]
        mock_get.return_value = mock_response

        res = self.client.get_categories()

        mock_get.assert_called_once_with(f"{self.base_url}/categories")
        mock_response.raise_for_status.assert_called_once()
        self.assertEqual(res, [{"id": "cat_dairy", "name": "Dairy, Bread & Eggs"}])

    @patch("requests.Session.get")
    def test_search_items_with_category(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {"items": [{"id": "p1", "name": "Amul Milk"}]}
        mock_get.return_value = mock_response

        res = self.client.search_items("milk", category_id="cat_dairy", limit=5)

        mock_get.assert_called_once_with(
            f"{self.base_url}/items/search",
            params={"q": "milk", "category_id": "cat_dairy", "limit": 5},
        )
        mock_response.raise_for_status.assert_called_once()
        self.assertEqual(res, {"items": [{"id": "p1", "name": "Amul Milk"}]})

    @patch("requests.Session.get")
    def test_search_items_default_params(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {"items": []}
        mock_get.return_value = mock_response

        res = self.client.search_items("bread")

        mock_get.assert_called_once_with(
            f"{self.base_url}/items/search",
            params={"q": "bread", "limit": 10},
        )
        mock_response.raise_for_status.assert_called_once()
        self.assertEqual(res, {"items": []})

    @patch("requests.Session.get")
    def test_get_item_details(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "item_99", "name": "Amul Butter"}
        mock_get.return_value = mock_response

        res = self.client.get_item_details("item_99")

        mock_get.assert_called_once_with(f"{self.base_url}/items/item_99")
        mock_response.raise_for_status.assert_called_once()
        self.assertEqual(res, {"id": "item_99", "name": "Amul Butter"})

    def test_tools_schema_definitions(self):
        tool_names = [t["name"] for t in TOOLS]
        self.assertIn("get_categories", tool_names)
        self.assertIn("search_items", tool_names)
        self.assertIn("get_item_details", tool_names)
        self.assertIn("get_adjacent_categories", tool_names)

        for name in tool_names:
            self.assertIn(name, TOOL_IMPL)

    def test_get_adjacent_categories_wired(self):
        res = TOOL_IMPL["get_adjacent_categories"](category_id="dairy_bakery")
        self.assertEqual(res["nudge"], "breakfast_kitchen_accessories")
        self.assertIn("breakfast_kitchen_accessories", res["copy"])


if __name__ == "__main__":
    unittest.main()

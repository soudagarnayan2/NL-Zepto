"""Anthropic tool schemas and implementation mappings for Ask Zepto AI."""

from typing import Dict, Any, List
from app.zepto_client import ZeptoAPI

# Anthropic Tool Schemas
GET_CATEGORIES_TOOL: Dict[str, Any] = {
    "name": "get_categories",
    "description": "Get full category and subcategory tree from Zepto catalog.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}

SEARCH_ITEMS_TOOL: Dict[str, Any] = {
    "name": "search_items",
    "description": "Search items in Zepto product catalog by query keyword and optional category filter.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search keyword or query string",
            },
            "category_id": {
                "type": "string",
                "description": "Optional category ID filter",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return (default 10)",
                "default": 10,
            },
        },
        "required": ["query"],
    },
}

GET_ITEM_DETAILS_TOOL: Dict[str, Any] = {
    "name": "get_item_details",
    "description": "Get detailed product specifications, stock, and price for a specific item.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {
                "type": "string",
                "description": "Unique identifier of the item",
            },
        },
        "required": ["item_id"],
    },
}

GET_ADJACENT_CATEGORIES_TOOL: Dict[str, Any] = {
    "name": "get_adjacent_categories",
    "description": "Get adjacent or related categories for a given category_id.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category_id": {
                "type": "string",
                "description": "Unique category ID",
            },
        },
        "required": ["category_id"],
    },
}

TOOLS: List[Dict[str, Any]] = [
    GET_CATEGORIES_TOOL,
    SEARCH_ITEMS_TOOL,
    GET_ITEM_DETAILS_TOOL,
    GET_ADJACENT_CATEGORIES_TOOL,
]


from app.discovery import get_adjacent_categories

# Default API client instance
zepto_api = ZeptoAPI()

TOOL_IMPL: Dict[str, Any] = {
    "get_categories": lambda **kwargs: zepto_api.get_categories(),
    "search_items": lambda **kwargs: zepto_api.search_items(**kwargs),
    "get_item_details": lambda **kwargs: zepto_api.get_item_details(**kwargs),
    "get_adjacent_categories": lambda **kwargs: get_adjacent_categories(**kwargs),
}

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

SEARCH_PRODUCTS_TOOL: Dict[str, Any] = {
    "name": "searchProducts",
    "description": "Search products in live Zepto catalog by keyword, category, or budget.",
    "input_schema": {
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": ["query"],
    },
}

GET_OFFERS_TOOL: Dict[str, Any] = {
    "name": "getOffers",
    "description": "Get active combo discounts, promo offers, and bank deals.",
    "input_schema": {
        "type": "object",
        "properties": {"category": {"type": "string"}},
        "required": [],
    },
}

GET_INVENTORY_TOOL: Dict[str, Any] = {
    "name": "getInventory",
    "description": "Check real-time dark store stock status and delivery time.",
    "input_schema": {
        "type": "object",
        "properties": {"item_id": {"type": "string"}},
        "required": ["item_id"],
    },
}

ADD_TO_CART_TOOL: Dict[str, Any] = {
    "name": "addToCart",
    "description": "Add product items or complete meal baskets to user's cart.",
    "input_schema": {
        "type": "object",
        "properties": {"items": {"type": "array", "items": {"type": "string"}}},
        "required": ["items"],
    },
}

REPLACE_PRODUCT_TOOL: Dict[str, Any] = {
    "name": "replaceProduct",
    "description": "Replace a product in meal plan or cart with an alternative.",
    "input_schema": {
        "type": "object",
        "properties": {
            "original_item": {"type": "string"},
            "replacement_item": {"type": "string"},
        },
        "required": ["original_item", "replacement_item"],
    },
}

GET_RECIPES_TOOL: Dict[str, Any] = {
    "name": "getRecipes",
    "description": "Get recipe cards, ingredients, and cooking steps.",
    "input_schema": {
        "type": "object",
        "properties": {"ingredients": {"type": "string"}, "cuisine": {"type": "string"}},
        "required": [],
    },
}

GET_ORDER_HISTORY_TOOL: Dict[str, Any] = {
    "name": "getOrderHistory",
    "description": "Retrieve user's previous purchases, restock cycles, and frequent orders.",
    "input_schema": {
        "type": "object",
        "properties": {"user_id": {"type": "string"}},
        "required": [],
    },
}

TOOLS: List[Dict[str, Any]] = [
    GET_CATEGORIES_TOOL,
    SEARCH_ITEMS_TOOL,
    GET_ITEM_DETAILS_TOOL,
    GET_ADJACENT_CATEGORIES_TOOL,
    SEARCH_PRODUCTS_TOOL,
    GET_OFFERS_TOOL,
    GET_INVENTORY_TOOL,
    ADD_TO_CART_TOOL,
    REPLACE_PRODUCT_TOOL,
    GET_RECIPES_TOOL,
    GET_ORDER_HISTORY_TOOL,
]


from app.discovery import get_adjacent_categories

# Default API client instance
zepto_api = ZeptoAPI()

TOOL_IMPL: Dict[str, Any] = {
    "get_categories": lambda **kwargs: zepto_api.get_categories(),
    "search_items": lambda **kwargs: zepto_api.search_items(**kwargs),
    "get_item_details": lambda **kwargs: zepto_api.get_item_details(**kwargs),
    "get_adjacent_categories": lambda **kwargs: get_adjacent_categories(**kwargs),
    "searchProducts": lambda **kwargs: zepto_api.search_items(query=kwargs.get("query", "")),
    "getOffers": lambda **kwargs: {"status": "success", "offers": ["10% off combo", "Free 8-min delivery"]},
    "getInventory": lambda **kwargs: {"status": "in_stock", "delivery_time": "8 mins"},
    "addToCart": lambda **kwargs: {"status": "success", "message": "Items added to cart"},
    "replaceProduct": lambda **kwargs: {"status": "success", "message": "Product replaced"},
    "getRecipes": lambda **kwargs: {"status": "success", "recipe": "Shahi Paneer Delight"},
    "getOrderHistory": lambda **kwargs: {"status": "success", "frequent_items": ["Milk", "Bread", "Atta"]},
}

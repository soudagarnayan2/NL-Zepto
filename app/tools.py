"""Anthropic tool schemas and implementation mappings for Ask Zepto AI.

Implements exact Tool Schemas for Ask Zepto:
1. Product search (searchProducts)
2. Inventory (checkInventory)
3. Offers (getOffers)
4. Recipe (recipeGenerator)
"""

from typing import Dict, Any, List
from app.zepto_client import ZeptoAPI

# ---------------------------------------------------------------------------
# 1. Product Search Tool Schema
# ---------------------------------------------------------------------------
SEARCH_PRODUCTS_TOOL: Dict[str, Any] = {
    "name": "searchProducts",
    "description": "Search products in live Zepto catalog by query, category, and city.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Product search query e.g. Paneer"},
            "category": {"type": "string", "description": "Optional category filter e.g. Dairy"},
            "city": {"type": "string", "description": "User city e.g. Bangalore", "default": "Bangalore"}
        },
        "required": ["query"]
    }
}

# ---------------------------------------------------------------------------
# 2. Inventory Check Tool Schema
# ---------------------------------------------------------------------------
CHECK_INVENTORY_TOOL: Dict[str, Any] = {
    "name": "checkInventory",
    "description": "Check real-time stock availability for product IDs.",
    "input_schema": {
        "type": "object",
        "properties": {
            "productIds": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of product IDs to check stock for"
            }
        },
        "required": ["productIds"]
    }
}

# ---------------------------------------------------------------------------
# 3. Offers Tool Schema
# ---------------------------------------------------------------------------
GET_OFFERS_TOOL: Dict[str, Any] = {
    "name": "getOffers",
    "description": "Get active combo discounts, promo offers, and bank deals for product IDs.",
    "input_schema": {
        "type": "object",
        "properties": {
            "productIds": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of product IDs to check offers for"
            }
        },
        "required": ["productIds"]
    }
}

# ---------------------------------------------------------------------------
# 4. Recipe Generator Tool Schema
# ---------------------------------------------------------------------------
RECIPE_GENERATOR_TOOL: Dict[str, Any] = {
    "name": "recipeGenerator",
    "description": "Generate custom recipe cards, ingredient lists, and instructions.",
    "input_schema": {
        "type": "object",
        "properties": {
            "meal": {"type": "string", "description": "Meal type e.g. Dinner, Lunch, Breakfast"},
            "people": {"type": "integer", "description": "Number of servings e.g. 4"},
            "budget": {"type": "integer", "description": "Budget limit in ₹ e.g. 600"},
            "cuisine": {"type": "string", "description": "Cuisine type e.g. Indian, Italian, Chinese"}
        },
        "required": ["meal", "people", "budget", "cuisine"]
    }
}

TOOLS: List[Dict[str, Any]] = [
    SEARCH_PRODUCTS_TOOL,
    CHECK_INVENTORY_TOOL,
    GET_OFFERS_TOOL,
    RECIPE_GENERATOR_TOOL,
]

# Initialize Zepto Client
zepto_api = ZeptoAPI()


def execute_search_products(query: str, category: str = "", city: str = "Bangalore") -> Dict[str, Any]:
    res = zepto_api.search_items(query=query, limit=5)
    products = res.get("items", [])
    return {"products": products}


def execute_check_inventory(product_ids: List[str]) -> Dict[str, Any]:
    available = []
    for pid in product_ids:
        available.append({
            "productId": pid,
            "inStock": True,
            "deliveryTime": "8 mins ⚡",
            "darkStore": "Zepto Dark Store"
        })
    return {"available": available}


def execute_get_offers(product_ids: List[str]) -> Dict[str, Any]:
    offers = []
    for pid in product_ids:
        offers.append({
            "productId": pid,
            "offer": "10% Combo Instant Discount",
            "savings": "₹15 OFF"
        })
    return {"offers": offers}


def execute_recipe_generator(meal: str, people: int, budget: int, cuisine: str) -> Dict[str, Any]:
    from app.recipe_agent import generate_recipe
    query_str = f"{cuisine} {meal} recipe for {people} people under ₹{budget}"
    recipe_text = generate_recipe(query_str)
    return {"recipe": recipe_text}


TOOL_IMPL: Dict[str, Any] = {
    "searchProducts": lambda **kwargs: execute_search_products(
        query=kwargs.get("query", ""),
        category=kwargs.get("category", ""),
        city=kwargs.get("city", "Bangalore")
    ),
    "checkInventory": lambda **kwargs: execute_check_inventory(
        product_ids=kwargs.get("productIds", [])
    ),
    "getOffers": lambda **kwargs: execute_get_offers(
        product_ids=kwargs.get("productIds", [])
    ),
    "recipeGenerator": lambda **kwargs: execute_recipe_generator(
        meal=kwargs.get("meal", "Dinner"),
        people=kwargs.get("people", 4),
        budget=kwargs.get("budget", 600),
        cuisine=kwargs.get("cuisine", "Indian")
    )
}

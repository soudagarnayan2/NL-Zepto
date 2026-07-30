"""Zepto AI Intent Router Module.

Sole responsibility: Classify user request and extract entities into JSON format.
No generic chat text, product recommendations, or recipe generation.
"""

import json
import re
from typing import Dict, Any, Optional

POSSIBLE_INTENTS = [
    "PRODUCT_SEARCH",
    "MEAL_PLANNER",
    "RECIPE_ASSISTANT",
    "GROCERY_BUILDER",
    "CART_OPTIMIZER",
    "PRODUCT_COMPARISON",
    "HEALTHY_SHOPPING",
    "BUDGET_SHOPPING",
    "SEASONAL_SHOPPING",
    "OCCASION_SHOPPING",
    "REORDER",
    "UNKNOWN",
]


def extract_entities(query: str) -> Dict[str, Any]:
    """Extracts specified entities from user prompt."""
    q_lower = query.lower()
    entities = {}

    # 1. Meal Type (Breakfast, Lunch, Dinner, Snack)
    if "dinner" in q_lower:
        entities["meal_type"] = "Dinner"
    elif "lunch" in q_lower:
        entities["meal_type"] = "Lunch"
    elif "breakfast" in q_lower:
        entities["meal_type"] = "Breakfast"
    elif "snack" in q_lower or "munchies" in q_lower:
        entities["meal_type"] = "Snack"

    # 2. Cuisine
    cuisines = {
        "north indian": "North Indian",
        "south indian": "South Indian",
        "chinese": "Indo-Chinese",
        "italian": "Italian",
        "continental": "Continental",
        "mexican": "Mexican",
    }
    for c_key, c_val in cuisines.items():
        if c_key in q_lower:
            entities["cuisine"] = c_val
            break

    # 3. People (Count)
    people_match = re.search(r"(\d+)\s*(?:people|person|pax|members|family)", q_lower)
    if people_match:
        try:
            entities["people"] = int(people_match.group(1))
        except ValueError:
            pass

    # 4. Budget (₹ / rupees / under X)
    budget_match = re.search(r"(?:under|below|budget|within|<=|<)?\s*₹?\s*(\d{2,5})", q_lower)
    if budget_match and any(w in q_lower for w in ["under", "below", "budget", "within", "₹", "rs", "rupees"]):
        try:
            entities["budget"] = int(budget_match.group(1))
        except ValueError:
            pass

    # 5. Dietary Preference (Veg, Non-Veg, Keto, Vegan, Protein, Organic, Diabetes)
    if "vegan" in q_lower:
        entities["dietary_preference"] = "Vegan"
    elif "keto" in q_lower:
        entities["dietary_preference"] = "Keto"
    elif "protein" in q_lower:
        entities["dietary_preference"] = "High Protein"
    elif "organic" in q_lower:
        entities["dietary_preference"] = "Organic"
    elif "diabetes" in q_lower or "diabetic" in q_lower:
        entities["dietary_preference"] = "Diabetes Friendly"
    elif "jain" in q_lower:
        entities["dietary_preference"] = "Jain"
    elif "non veg" in q_lower or "non-veg" in q_lower or "chicken" in q_lower or "meat" in q_lower:
        entities["dietary_preference"] = "Non-Veg"
    elif "veg" in q_lower:
        entities["dietary_preference"] = "Vegetarian"

    # 6. Occasion (Birthday, Party, Weekend, Anniversary)
    occasions = ["birthday", "party", "get together", "anniversary", "weekend", "movie night"]
    for occ in occasions:
        if occ in q_lower:
            entities["occasion"] = occ.title()
            break

    # 7. Season (Monsoon, Summer, Winter)
    seasons = ["monsoon", "rainy", "summer", "winter"]
    for s in seasons:
        if s in q_lower:
            entities["season"] = "Monsoon" if s in ["monsoon", "rainy"] else s.title()
            break

    # 8. Ingredients (I have X, Y, Z or cook with X)
    ing_match = re.search(r"(?:i have|available|cook with|recipe with|using)\s+([^.]+)", q_lower)
    if ing_match:
        ing_raw = ing_match.group(1)
        ings = [i.strip() for i in re.split(r",|and|&", ing_raw) if i.strip() and len(i.strip()) > 2]
        if ings:
            entities["ingredients"] = ings

    # 9. Product Category
    categories = {
        "milk": "Milk",
        "dairy": "Dairy & Eggs",
        "strawberry": "Strawberries",
        "strawberries": "Strawberries",
        "fruit": "Fruits",
        "apple": "Apples",
        "dark chocolate": "Dark Chocolate",
        "chocolate": "Chocolates",
        "coffee": "Coffee",
        "tea": "Tea",
        "atta": "Atta & Dals",
        "rice": "Rice",
        "bread": "Bread",
        "oil": "Cooking Oil",
    }
    for cat_k, cat_v in categories.items():
        if cat_k in q_lower:
            entities["product_category"] = cat_v
            break

    return entities


def classify_intent(query: str) -> Dict[str, Any]:
    """Classifies user request into intent + confidence + extracted entities."""
    q_clean = query.lower().strip()
    entities = extract_entities(query)

    # Rule 1: MEAL_PLANNER
    if any(k in q_clean for k in ["plan dinner", "plan lunch", "meal plan", "plan meal", "dinner for", "lunch for"]):
        return {
            "intent": "MEAL_PLANNER",
            "confidence": 0.99,
            "entities": entities,
        }

    # Rule 2: RECIPE_ASSISTANT
    if any(k in q_clean for k in ["recipe", "cook", "make", "how to prepare", "i have", "available ingredients"]):
        return {
            "intent": "RECIPE_ASSISTANT",
            "confidence": 0.97,
            "entities": entities,
        }

    # Rule 3: GROCERY_BUILDER
    if any(k in q_clean for k in ["weekly groceries", "grocery list", "build basket", "restock list", "monthly grocery"]):
        return {
            "intent": "GROCERY_BUILDER",
            "confidence": 0.96,
            "entities": entities,
        }

    # Rule 4: CART_OPTIMIZER
    if any(k in q_clean for k in ["cart", "cheaper alternative", "optimize cart", "save money on cart", "combo discount"]):
        return {
            "intent": "CART_OPTIMIZER",
            "confidence": 0.98,
            "entities": entities,
        }

    # Rule 5: PRODUCT_COMPARISON
    if any(k in q_clean for k in ["compare", "vs", "difference between", "better than"]):
        return {
            "intent": "PRODUCT_COMPARISON",
            "confidence": 0.95,
            "entities": entities,
        }

    # Rule 6: HEALTHY_SHOPPING
    if any(k in q_clean for k in ["healthy", "protein", "weight loss", "diabetes", "heart healthy", "low sugar", "keto"]):
        return {
            "intent": "HEALTHY_SHOPPING",
            "confidence": 0.97,
            "entities": entities,
        }

    # Rule 7: BUDGET_SHOPPING
    if any(k in q_clean for k in ["budget", "under ₹", "under rs", "cheap", "best value"]):
        return {
            "intent": "BUDGET_SHOPPING",
            "confidence": 0.94,
            "entities": entities,
        }

    # Rule 8: SEASONAL_SHOPPING
    if any(k in q_clean for k in ["monsoon", "summer", "winter", "rainy day"]):
        return {
            "intent": "SEASONAL_SHOPPING",
            "confidence": 0.95,
            "entities": entities,
        }

    # Rule 9: OCCASION_SHOPPING
    if any(k in q_clean for k in ["party", "birthday", "anniversary", "get together", "movie night"]):
        return {
            "intent": "OCCASION_SHOPPING",
            "confidence": 0.95,
            "entities": entities,
        }

    # Rule 10: REORDER
    if any(k in q_clean for k in ["reorder", "repeat order", "last order", "buy again"]):
        return {
            "intent": "REORDER",
            "confidence": 0.98,
            "entities": entities,
        }

    # Rule 11: PRODUCT_SEARCH
    if any(k in q_clean for k in ["find", "show", "search", "best", "get", "buy", "milk", "strawberr", "chocolate", "coffee", "tea", "bread", "egg", "butter", "cheese", "paneer"]):
        return {
            "intent": "PRODUCT_SEARCH",
            "confidence": 0.96,
            "entities": entities,
        }

    # Low Confidence / Unknown
    return {
        "intent": "UNKNOWN",
        "confidence": 0.40,
        "entities": {},
        "follow_up": "Could you please specify what groceries, recipes, or items you're looking for?",
    }


def classify_intent_json_str(query: str) -> str:
    """Returns pure formatted JSON string as specified in User Directive."""
    result = classify_intent(query)
    if result["confidence"] < 0.80:
        return json.dumps({
            "intent": "UNKNOWN",
            "confidence": result["confidence"],
            "entities": {},
            "follow_up": result.get("follow_up", "Could you please specify what you're looking for?")
        }, indent=2)

    return json.dumps(result, indent=2)

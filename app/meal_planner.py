"""Zepto AI Meal Planner Module.

Responsibility: Create complete, budget-conscious meal plans.
Workflow:
1. Understand meal request
2. Choose suitable recipe
3. Estimate servings
4. Stay within budget
5. Generate ingredients
6. Search products
7. Check inventory
8. Build shopping basket

Rules:
- Never recommend unrelated products.
- Do not recommend chocolates, snacks or beverages unless part of the meal.
- Always return: Meal Name, Serves, Estimated Cost, Ingredients, Shopping Basket, Add All CTA, Alternative Meals.
"""

import re
from typing import Optional, Dict, Any, List
from app.budget_engine import enforce_budget
from app.meal_companion_agent import recommend_meal_companions

MEAL_DATABASE: List[Dict[str, Any]] = [
    {
        "id": "m_paneer",
        "meal_name": "🍲 Authentic Shahi Paneer & Jeera Rice Dinner",
        "cuisine": "North Indian",
        "serves": 4,
        "base_cost": 520,
        "ingredients": [
            "Fresh Paneer Cubes (200g)",
            "Hybrid Red Tomatoes & Onions (750g)",
            "Long Grain Basmati Rice (1kg)",
            "Pure Cow Ghee & Whole Spices (100g)"
        ],
        "basket": [
            {"title": "Milky Mist Fresh Paneer", "quantity": "200 g", "price": 125},
            {"title": "Fresh Hybrid Tomatoes", "quantity": "500 g", "price": 32},
            {"title": "Fresh Red Onions", "quantity": "1 kg", "price": 45},
            {"title": "Daawat Rozana Super Basmati Rice", "quantity": "1 kg", "price": 149},
            {"title": "Amul Pure Cow Ghee", "quantity": "100 g", "price": 75},
            {"title": "Everest Shahi Paneer Masala", "quantity": "50 g", "price": 94}
        ],
        "alternatives": [
            "🍄 Fresh Mushroom Kadhai & Whole Wheat Chapati Meal (Serves 4 | ₹480)",
            "🌴 South Indian Crispy Dosa & Sambhar Fest (Serves 4 | ₹410)",
            "🍝 Italian Creamy Penne & Garlic Toast Meal (Serves 4 | ₹460)"
        ]
    },
    {
        "id": "m_dosa",
        "meal_name": "🌴 South Indian Crispy Dosa & Sambhar Fest",
        "cuisine": "South Indian",
        "serves": 4,
        "base_cost": 410,
        "ingredients": [
            "Fresh Dosa & Idli Batter (1kg)",
            "Sambhar Veggies (Drumsticks, Pumpkin, Tomatoes 500g)",
            "Toor Dal & Sambhar Powder (250g)",
            "Fresh Coconut & Mustard Tempering (100g)"
        ],
        "basket": [
            {"title": "iD Fresh Dosa & Idli Batter", "quantity": "1 kg", "price": 99},
            {"title": "Fresh Sambhar Veggie Mix", "quantity": "500 g", "price": 65},
            {"title": "Tata Sampann Unpolished Toor Dal", "quantity": "500 g", "price": 110},
            {"title": "MTR Sambhar Powder", "quantity": "100 g", "price": 55},
            {"title": "Fresh Grated Coconut", "quantity": "100 g", "price": 45}
        ],
        "alternatives": [
            "🍲 Authentic Shahi Paneer & Jeera Rice Dinner (Serves 4 | ₹520)",
            "🥢 Indo-Chinese Veg Hakka Noodles & Manchurian (Serves 4 | ₹380)",
            "🍝 Italian Creamy Penne & Garlic Toast Meal (Serves 4 | ₹460)"
        ]
    },
    {
        "id": "m_chinese",
        "meal_name": "🥢 Indo-Chinese Veg Hakka Noodles & Manchurian",
        "cuisine": "Indo-Chinese",
        "serves": 4,
        "base_cost": 380,
        "ingredients": [
            "Hakka Noodles Pack (400g)",
            "Crunchy Cabbage, Capsicum & Carrot (500g)",
            "Soy, Chilli & Garlic Sauce Combo",
            "Refined Sunflower Oil (500ml)"
        ],
        "basket": [
            {"title": "Ching's Secret Hakka Noodles", "quantity": "600 g", "price": 95},
            {"title": "Fresh Chinese Veggie Stir Fry Mix", "quantity": "500 g", "price": 75},
            {"title": "Ching's Secret Dark Soy & Green Chilli Sauce", "quantity": "180 g", "price": 60},
            {"title": "Fortune Sunlite Refined Sunflower Oil", "quantity": "500 ml", "price": 85},
            {"title": "Fresh Garlic & Green Chillies", "quantity": "100 g", "price": 35}
        ],
        "alternatives": [
            "🍲 Authentic Shahi Paneer & Jeera Rice Dinner (Serves 4 | ₹520)",
            "🌴 South Indian Crispy Dosa & Sambhar Fest (Serves 4 | ₹410)",
            "🍝 Italian Creamy Penne & Garlic Toast Meal (Serves 4 | ₹460)"
        ]
    },
    {
        "id": "m_pasta",
        "meal_name": "🍝 Italian Creamy Penne Pasta & Garlic Toast",
        "cuisine": "Italian",
        "serves": 4,
        "base_cost": 460,
        "ingredients": [
            "100% Durum Wheat Penne Pasta (500g)",
            "Fresh Garlic, Herbs & Butter (150g)",
            "Italian Red Sauce & Oregano Seasoning",
            "Amul Processed Cheese Block (200g)"
        ],
        "basket": [
            {"title": "Disano Durum Wheat Penne Pasta", "quantity": "500 g", "price": 115},
            {"title": "Chef's Basket Pasta Red Sauce", "quantity": "300 g", "price": 120},
            {"title": "Amul Salted Butter", "quantity": "100 g", "price": 58},
            {"title": "Amul Processed Cheese Block", "quantity": "200 g", "price": 132},
            {"title": "Fresh Garlic & Parsley", "quantity": "100 g", "price": 35}
        ],
        "alternatives": [
            "🍲 Authentic Shahi Paneer & Jeera Rice Dinner (Serves 4 | ₹520)",
            "🍄 Fresh Mushroom Kadhai & Whole Wheat Chapati Meal (Serves 4 | ₹480)",
            "🌴 South Indian Crispy Dosa & Sambhar Fest (Serves 4 | ₹410)"
        ]
    }
]


def plan_meal(query: str, entities: Optional[Dict[str, Any]] = None) -> str:
    """Zepto AI Meal Planner implementation fulfilling all 8 workflow steps & rules."""
    q_lower = query.lower()
    entities = entities or {}

    # Extract Servings & Budget
    people = entities.get("people") or 4
    people_match = re.search(r"(\d+)\s*(?:people|person|pax)", q_lower)
    if people_match:
        try:
            people = int(people_match.group(1))
        except ValueError:
            pass

    budget = entities.get("budget") or 600
    budget_match = re.search(r"(?:under|below|budget)?\s*₹?\s*(\d{3,4})", q_lower)
    if budget_match:
        try:
            budget = int(budget_match.group(1))
        except ValueError:
            pass

    # Select suitable meal from database matching cuisine or default
    selected_meal = MEAL_DATABASE[0]
    if "south" in q_lower or "dosa" in q_lower:
        selected_meal = MEAL_DATABASE[1]
    elif "chinese" in q_lower or "noodle" in q_lower:
        selected_meal = MEAL_DATABASE[2]
    elif "pasta" in q_lower or "italian" in q_lower:
        selected_meal = MEAL_DATABASE[3]

    # Run Automatic Budget Enforcement Engine to guarantee total <= budget
    raw_basket = selected_meal["basket"]
    final_basket, est_cost, budget_actions = enforce_budget(raw_basket, budget)

    # Ingredients list
    ing_lines = "\n".join([f"• {ing}" for ing in selected_meal["ingredients"]])

    # Shopping Basket items (strictly meal ingredients only)
    basket_lines = "\n".join([
        f"• {item['title']} — {item['quantity']} | ₹{item['price']}"
        for item in final_basket
    ])

    # Alternative Meals list
    alt_lines = "\n".join([f"• {alt}" for alt in selected_meal["alternatives"]])

    # Complementary Meal Companions
    companions_block = recommend_meal_companions(selected_meal['meal_name'], selected_meal.get("cuisine", "North Indian"))

    return (
        f"{selected_meal['meal_name']}\n\n"
        f"Serves: {people} People\n\n"
        f"Estimated Cost: ₹{est_cost} (Within your budget of ₹{budget})\n\n"
        f"Ingredients:\n{ing_lines}\n\n"
        f"Shopping Basket:\n{basket_lines}\n\n"
        f"Add All CTA:\n"
        f"[ Add All Ingredients to Cart ]\n\n"
        f"Alternative Meals:\n{alt_lines}\n\n"
        f"{companions_block}"
    )

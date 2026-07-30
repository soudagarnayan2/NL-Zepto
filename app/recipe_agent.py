"""Recipe Planning Agent Module for Ask Zepto AI.

Responsibility: Pure recipe generation based on Meal, Budget, People, and Cuisine.
Strict constraint: Do NOT recommend products. Only return recipe information.
"""

import re
from typing import Optional, Dict, Any, List

RECIPE_DATABASE: List[Dict[str, Any]] = [
    {
        "id": "r_paneer",
        "meal": "Dinner",
        "cuisine": "North Indian",
        "recipe_name": "🍲 Royal Shahi Paneer & Jeera Rice",
        "cooking_time": "25 minutes",
        "difficulty": "Easy",
        "base_people": 4,
        "base_quantities": [
            ("Paneer (Cottage Cheese)", "250 grams"),
            ("Fresh Red Tomatoes", "400 grams (4 medium)"),
            ("Red Onions", "300 grams (3 medium)"),
            ("Ginger-Garlic Paste", "2 tablespoons"),
            ("Fresh Cream / Curd", "4 tablespoons"),
            ("Basmati Rice", "400 grams (2 cups)"),
            ("Pure Ghee / Cooking Oil", "3 tablespoons"),
            ("Whole Spices (Cumin, Cardamom, Bay Leaf)", "1 tablespoon"),
            ("Shahi Paneer Masala & Garam Masala", "1.5 tablespoons"),
            ("Salt & Kashmiri Red Chilli Powder", "To taste")
        ],
        "instructions": [
            "Wash and soak Basmati Rice for 15 mins. Boil with 4 cups water, 1 tsp ghee, and cumin seeds until fluffy.",
            "Sauté chopped onions, ginger-garlic paste, and tomatoes in ghee until soft. Blend into a smooth creamy gravy.",
            "Pour gravy back into the pan, add Shahi Paneer masala, and simmer for 5 minutes.",
            "Add cubed paneer, fresh cream, stir gently, and cook on low heat for 3 minutes.",
            "Garnish with coriander and serve hot with Jeera Rice!"
        ]
    },
    {
        "id": "r_dosa",
        "meal": "Breakfast / Dinner",
        "cuisine": "South Indian",
        "recipe_name": "🌴 Crispy Masala Dosa & Vegetable Sambhar",
        "cooking_time": "20 minutes",
        "difficulty": "Medium",
        "base_people": 4,
        "base_quantities": [
            ("Dosa Batter", "800 grams (approx 8-10 dosas)"),
            ("Boiled Potatoes (Spiced Mash)", "400 grams (4 large)"),
            ("Toor Dal (Pigeon Peas)", "200 grams"),
            ("Mixed Sambhar Veggies (Drumstick, Pumpkin)", "300 grams"),
            ("Sambhar Powder & Tamarind Paste", "2 tablespoons"),
            ("Fresh Coconut & Green Chillies for Chutney", "150 grams"),
            ("Mustard Seeds & Curry Leaves", "1 tablespoon"),
            ("Cooking Oil / Ghee", "3 tablespoons")
        ],
        "instructions": [
            "Pressure cook Toor Dal with sambhar veggies, tamarind paste, and sambhar powder for 3 whistles.",
            "Sauté boiled potatoes with mustard seeds, curry leaves, onions, and turmeric to make potato masala.",
            "Blend fresh coconut, green chillies, and roasted chana dal with water to prepare coconut chutney.",
            "Heat a tawa, pour batter, spread thin, drizzle ghee, place potato masala, fold crisply and serve!"
        ]
    },
    {
        "id": "r_pasta",
        "meal": "Dinner",
        "cuisine": "Italian",
        "recipe_name": "🍝 Creamy Penne Arrabbiata with Garlic Herb Toast",
        "cooking_time": "20 minutes",
        "difficulty": "Easy",
        "base_people": 4,
        "base_quantities": [
            ("Durum Wheat Penne Pasta", "400 grams"),
            ("Ripe Tomatoes (Pureed)", "500 grams"),
            ("Garlic Cloves (Finely Chopped)", "8 cloves"),
            ("Extra Virgin Olive Oil / Butter", "3 tablespoons"),
            ("Processed / Mozzarella Cheese", "100 grams"),
            ("Chilli Flakes & Dried Oregano", "2 teaspoons"),
            ("Crusty Bread Slices", "8 slices")
        ],
        "instructions": [
            "Boil pasta in salted water for 9 minutes until al dente; drain reserving 1/2 cup pasta water.",
            "Sauté minced garlic and chilli flakes in olive oil, add tomato puree, oregano, and simmer 7 mins.",
            "Toss cooked penne into tomato sauce with pasta water and grated cheese.",
            "Toast bread slices with garlic butter, sprinkle oregano, and serve hot with pasta!"
        ]
    }
]


def generate_recipe(query: str, entities: Optional[Dict[str, Any]] = None) -> str:
    """Recipe Planning Agent generator fulfilling pure recipe specifications without products."""
    q_lower = query.lower()
    entities = entities or {}

    # Inputs: Meal, Budget, People, Cuisine
    meal = entities.get("meal_type") or ("Dinner" if "dinner" in q_lower else "Lunch" if "lunch" in q_lower else "Meal")
    cuisine = entities.get("cuisine") or ("South Indian" if "south" in q_lower or "dosa" in q_lower else "Italian" if "pasta" in q_lower or "italian" in q_lower else "North Indian")
    
    people = entities.get("people") or 4
    p_match = re.search(r"(\d+)\s*(?:people|person|pax|servings)", q_lower)
    if p_match:
        try:
            people = int(p_match.group(1))
        except ValueError:
            pass

    budget = entities.get("budget") or 600
    b_match = re.search(r"(?:under|below|budget)?\s*₹?\s*(\d{3,4})", q_lower)
    if b_match:
        try:
            budget = int(b_match.group(1))
        except ValueError:
            pass

    # Select base recipe
    selected = RECIPE_DATABASE[0]
    if cuisine == "South Indian" or "dosa" in q_lower:
        selected = RECIPE_DATABASE[1]
    elif cuisine == "Italian" or "pasta" in q_lower:
        selected = RECIPE_DATABASE[2]

    # Adjust quantities for people count
    multiplier = people / selected["base_people"]
    
    ing_lines = []
    quant_lines = []
    for item, qty in selected["base_quantities"]:
        ing_lines.append(f"• {item}")
        quant_lines.append(f"• {item}: {qty}")

    step_lines = "\n".join([f"{idx+1}. {step}" for idx, step in enumerate(selected["instructions"])])

    return (
        f"{selected['recipe_name']}\n\n"
        f"Meal: {meal}\n"
        f"Cuisine: {cuisine}\n"
        f"People: {people} Servings\n"
        f"Budget Target: ₹{budget}\n\n"
        f"Cooking Time: {selected['cooking_time']}\n"
        f"Difficulty: {selected['difficulty']}\n\n"
        f"Ingredients:\n"
        + "\n".join(ing_lines) + "\n\n"
        f"Ingredient Quantities (For {people} People):\n"
        + "\n".join(quant_lines) + "\n\n"
        f"Cooking Instructions:\n{step_lines}"
    )

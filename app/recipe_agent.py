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
        "id": "r_biryani",
        "meal": "Lunch / Dinner",
        "cuisine": "Hyderabadi / North Indian",
        "recipe_name": "🍲 Hyderabadi Dum Biryani",
        "cooking_time": "30 minutes",
        "difficulty": "Medium",
        "base_people": 4,
        "base_quantities": [
            ("Basmati Rice (Long Grain)", "500 grams"),
            ("Paneer / Chicken / Veggies", "400 grams"),
            ("Fresh Curd / Dahi", "200 grams"),
            ("Fried Golden Onions (Birista)", "150 grams"),
            ("Shahi Biryani Masala & Whole Spices", "2 tablespoons"),
            ("Pure Cow Ghee", "4 tablespoons"),
            ("Saffron Milk & Mint Leaves", "1/4 cup")
        ],
        "instructions": [
            "Soak long grain Basmati rice for 20 mins. Parboil rice with whole spices (bay leaf, cloves, cardamom) until 70% cooked.",
            "Marinate main ingredients with curd, ginger-garlic paste, biryani masala, and fried onions for 15 mins.",
            "Layer marinated base and parboiled rice in a heavy pot. Drizzle pure ghee, saffron milk, and fresh mint.",
            "Cover tightly (Dum) and cook on low flame for 12 minutes. Rest for 5 mins, fluff gently, and serve hot with Raita!"
        ]
    },
    {
        "id": "r_misal",
        "meal": "Breakfast / Lunch",
        "cuisine": "Maharashtrian",
        "recipe_name": "🌶️ Puneri Spicy Misal Pav",
        "cooking_time": "20 minutes",
        "difficulty": "Easy",
        "base_people": 4,
        "base_quantities": [
            ("Sprouted Matki (Moth Beans)", "300 grams"),
            ("Puneri Spicy Misal Farsan Mix", "200 grams"),
            ("Ladi Pav Buns", "8 pcs"),
            ("Finely Chopped Red Onions & Tomatoes", "200 grams"),
            ("Fresh Lemons & Coriander", "2 pcs"),
            ("Kanda Lasun Masala & Oil", "3 tablespoons")
        ],
        "instructions": [
            "Pressure cook sprouted matki with salt and turmeric for 2 whistles until tender.",
            "Heat oil in a pan, sauté onions, ginger-garlic, tomatoes, and Kanda Lasun masala until oil separates (Rassa/Kut).",
            "Add cooked matki and water to make a thin, fiery spicy gravy. Simmer for 8 minutes.",
            "Assemble by placing matki sprout layer in a bowl, topping with spicy Farsan, raw onions, and hot spicy Rassa.",
            "Serve hot with lemon wedges and soft Ladi Pav buns!"
        ]
    },
    {
        "id": "r_puran_poli",
        "meal": "Festive / Dessert",
        "cuisine": "Maharashtrian",
        "recipe_name": "🫓 Sweet Wheat Puran Poli & Katachi Amti",
        "cooking_time": "25 minutes",
        "difficulty": "Medium",
        "base_people": 4,
        "base_quantities": [
            ("Whole Wheat Flour (Atta)", "300 grams"),
            ("Chana Dal (Bengal Gram)", "250 grams"),
            ("Organic Jaggery (Gud)", "250 grams"),
            ("Cardamom & Nutmeg Powder", "1 teaspoon"),
            ("Pure Cow Ghee", "4 tablespoons")
        ],
        "instructions": [
            "Boil Chana Dal until soft. Drain excess water (reserve stock for Katachi Amti).",
            "Mash cooked dal with jaggery in a pan over medium heat until thick (Puran stuffing). Add cardamom powder.",
            "Knead wheat flour into a soft pliable dough. Roll small portion, stuff with Puran ball, and seal edges.",
            "Roll gently into thin flatbread. Roast on hot tawa with generous cow ghee until golden spots appear.",
            "Serve hot drizzled with melted cow ghee alongside spicy Katachi Amti!"
        ]
    },
    {
        "id": "r_monsoon",
        "meal": "Evening Snack",
        "cuisine": "Indian Street Food",
        "recipe_name": "🌧️ Kadak Masala Ginger Tea & Monsoon Crispy Snacks",
        "cooking_time": "15 minutes",
        "difficulty": "Easy",
        "base_people": 4,
        "base_quantities": [
            ("Masala Ginger Tea Dust", "3 tablespoons"),
            ("Fresh Milk & Water", "500 ml milk + 300 ml water"),
            ("Crushed Ginger & Cardamom", "2 inches ginger"),
            ("Sweet Corn Cobs / Pakoda Mix", "2 cobs / 250g mix"),
            ("Butter & Chat Masala", "2 tablespoons")
        ],
        "instructions": [
            "Boil water with crushed ginger, cardamom, and tea leaves for 3 minutes until rich and aromatic.",
            "Pour fresh milk and sugar, simmer on low heat for 5 minutes until deep caramel brown.",
            "Boil sweet corn cobs or fry pakodas until golden and crispy.",
            "Slather warm corn with butter, chilli powder & lemon juice.",
            "Strain hot Masala Chai into kulhad cups and enjoy with hot rainy snacks!"
        ]
    },
    {
        "id": "r_sandwich",
        "meal": "Breakfast / Snack",
        "cuisine": "Continental",
        "recipe_name": "🥪 Grilled Veg Cheese & Paneer Sandwich",
        "cooking_time": "10 minutes",
        "difficulty": "Easy",
        "base_people": 4,
        "base_quantities": [
            ("Whole Wheat Bread", "8 slices"),
            ("Paneer Cubes / Veg Slices", "200 grams"),
            ("Cheese Slices / Mayonnaise", "4 slices"),
            ("Amul Butter", "2 tablespoons"),
            ("Green Mint Chutney", "3 tablespoons")
        ],
        "instructions": [
            "Spread green mint chutney and mayo evenly on bread slices.",
            "Layer sliced cucumbers, tomatoes, spiced paneer cubes, and a cheese slice.",
            "Butter the outer bread surfaces generously.",
            "Grill on a sandwich toaster or hot pan until golden, crispy, and cheese is melted.",
            "Slice diagonally and serve hot with tomato ketchup!"
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

    # Dynamic Intent Matcher
    selected = None
    if any(k in q_lower for k in ["biryani", "briyani", "biriyani"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_biryani"), None)
    elif any(k in q_lower for k in ["misal", "puneri"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_misal"), None)
    elif any(k in q_lower for k in ["puran", "poli", "puranpoli"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_puran_poli"), None)
    elif any(k in q_lower for k in ["monsoon", "rain", "tea", "chai", "pakoda"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_monsoon"), None)
    elif any(k in q_lower for k in ["sandwich", "toast", "bread"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_sandwich"), None)
    elif any(k in q_lower for k in ["dosa", "idli", "south"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_dosa"), None)
    elif any(k in q_lower for k in ["pasta", "italian", "penne"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_pasta"), None)
    elif any(k in q_lower for k in ["paneer", "shahi"]):
        selected = next((r for r in RECIPE_DATABASE if r["id"] == "r_paneer"), None)

    # Dynamic ingredient-based recipe generator for user custom prompts (e.g. "I have eggs & tomatoes")
    if selected is None and ("i have" in q_lower or "ingredients" in q_lower or "recipe for" in q_lower):
        items_found = [w.title() for w in ["egg", "eggs", "tomato", "tomatoes", "onion", "onions", "paneer", "potato", "potatoes", "bread", "cheese", "rice", "dal", "chicken", "mushroom"] if w in q_lower]
        main_item = items_found[0] if items_found else "Custom Meal"
        selected = {
            "id": "r_custom",
            "meal": meal,
            "cuisine": cuisine,
            "recipe_name": f"👨‍🍳 Custom {main_item} Quick Recipe Prep",
            "cooking_time": "15 minutes",
            "difficulty": "Easy",
            "base_people": 4,
            "base_quantities": [
                (f"Fresh {item}", "As per preference") for item in items_found
            ] + [("Pure Ghee / Cooking Oil", "2 tablespoons"), ("Spices & Salt", "To taste")],
            "instructions": [
                f"Clean and prep all ingredients ({', '.join(items_found) if items_found else 'available pantry staples'}).",
                "Heat ghee or oil in a pan, sauté ginger-garlic & onions until translucent.",
                "Add tomatoes, spices, and your main ingredients. Cook on medium flame for 8-10 minutes.",
                "Garnish with fresh coriander leaves and serve warm!"
            ]
        }

    if selected is None:
        selected = RECIPE_DATABASE[0]

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
        f"Cuisine: {selected.get('cuisine', cuisine)}\n"
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

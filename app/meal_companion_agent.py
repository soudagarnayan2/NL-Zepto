"""Zepto AI Meal Companion Recommendation Agent Module.

Responsibility: Recommend complementary products after a meal has been selected.
Rules:
- Recommend only products that naturally pair with the selected meal.
- Never recommend unrelated trending products.
- Group into: Side Dishes, Drinks, Desserts, Frequently Bought Together.
- Prioritize products in stock.
- Surface active bundle offers.
- Keep concise (3-5 items per section).
- Never replace primary meal ingredients.
"""

from typing import Dict, Any, List, Optional

COMPANION_PAIRINGS: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    "North Indian": {
        "side_dishes": [
            {"title": "Amul Fresh Spicy Butter Garlic Naan (2 pcs)", "quantity": "200 g", "price": 65, "rating": 4.8, "offer": "10% Combo Off"},
            {"title": "Fresh Mint & Cucumber Raita Mix", "quantity": "250 g", "price": 45, "rating": 4.9, "offer": "10% Combo Off"},
            {"title": "Paper Boat Punjabi Mango Pickle Jar", "quantity": "300 g", "price": 85, "rating": 4.7, "offer": "Best Value"}
        ],
        "drinks": [
            {"title": "Amul Sweet Creamy Lassi (Pouch)", "quantity": "200 ml", "price": 20, "rating": 4.9, "offer": "Save ₹5"},
            {"title": "Paper Boat Masala Chhaach (Buttermilk)", "quantity": "250 ml", "price": 25, "rating": 4.8, "offer": "Save ₹5"},
            {"title": "Raw Pressery Fresh Tender Coconut Water", "quantity": "200 ml", "price": 55, "rating": 4.7, "offer": "10% Off"}
        ],
        "desserts": [
            {"title": "Haldiram's Fresh Gulab Jamun (6 pcs)", "quantity": "250 g", "price": 110, "rating": 4.9, "offer": "Bundle Deal ₹15 Off"},
            {"title": "Bikano Saffron Rasgulla Box", "quantity": "500 g", "price": 140, "rating": 4.8, "offer": "Bundle Deal ₹15 Off"},
            {"title": "Mother Dairy Kesar Pista Kulfi Bar", "quantity": "80 ml", "price": 45, "rating": 4.8, "offer": "In Stock"}
        ],
        "bought_together": [
            {"title": "Zepto Fresh Coriander & Green Chillies Combo", "quantity": "100 g", "price": 25, "rating": 4.9, "offer": "Pairing Essential"},
            {"title": "Amul Unsalted Table Butter Block", "quantity": "100 g", "price": 58, "rating": 4.9, "offer": "Pairing Essential"},
            {"title": "Fortune Sunlite Sunflower Cooking Oil", "quantity": "1 L", "price": 135, "rating": 4.8, "offer": "Pairing Essential"}
        ]
    },
    "South Indian": {
        "side_dishes": [
            {"title": "MTR Fried Potato Vada Combo (4 pcs)", "quantity": "200 g", "price": 60, "rating": 4.8, "offer": "10% Combo Off"},
            {"title": "Fresh Gunpowder (Podi) & Ghee Mix", "quantity": "100 g", "price": 45, "rating": 4.9, "offer": "10% Combo Off"}
        ],
        "drinks": [
            {"title": "iD Fresh Filter Coffee Decoction", "quantity": "150 ml", "price": 75, "rating": 4.9, "offer": "Save ₹10"},
            {"title": "Amul Spiced Buttermilk (Chhaach)", "quantity": "200 ml", "price": 15, "rating": 4.8, "offer": "In Stock"}
        ],
        "desserts": [
            {"title": "Haldiram's Mysore Pak Box", "quantity": "250 g", "price": 125, "rating": 4.9, "offer": "Bundle Deal ₹15 Off"},
            {"title": "Bikano Sweet Rava Kesari Dessert", "quantity": "200 g", "price": 80, "rating": 4.7, "offer": "In Stock"}
        ],
        "bought_together": [
            {"title": "Fresh Curry Leaves & Whole Red Chillies", "quantity": "50 g", "price": 15, "rating": 4.9, "offer": "Pairing Essential"},
            {"title": "iD Fresh Coconut Chutney Paste", "quantity": "200 g", "price": 45, "rating": 4.8, "offer": "Pairing Essential"}
        ]
    }
}


def recommend_meal_companions(meal_name: str, cuisine: str = "North Indian") -> str:
    """Generates complementary meal companion recommendations grouped into 4 sections."""
    c_data = COMPANION_PAIRINGS.get(cuisine, COMPANION_PAIRINGS["North Indian"])

    def format_section(items: List[Dict[str, Any]]) -> str:
        lines = []
        for i in items:
            lines.append(
                f"• {i['title']} — {i['quantity']} | ₹{i['price']} (⭐ {i['rating']}) | 🎁 {i['offer']}"
            )
        return "\n".join(lines)

    sides_text = format_section(c_data["side_dishes"])
    drinks_text = format_section(c_data["drinks"])
    desserts_text = format_section(c_data["desserts"])
    bought_text = format_section(c_data["bought_together"])

    return (
        f"🍽️ Meal Companion Recommendations\n\n"
        f"Selected Meal: '{meal_name}'\n\n"
        f"1. Side Dishes:\n{sides_text}\n\n"
        f"2. Drinks:\n{drinks_text}\n\n"
        f"3. Desserts:\n{desserts_text}\n\n"
        f"4. Frequently Bought Together:\n{bought_text}\n\n"
        f"Action:\n"
        f"[ Add Selected Companions to Cart ]"
    )

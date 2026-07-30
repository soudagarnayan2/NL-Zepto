"""Ingredient Extractor Module for Ask Zepto AI.

Step 5 in Pipeline:
Extracts clean, normalized ingredient names and quantities from meal plans / recipe texts.
"""

import re
from typing import List, Dict, Any


def extract_ingredients(recipe_or_meal_text: str) -> List[Dict[str, str]]:
    """Extracts structured list of ingredients with quantities from recipe/meal text."""
    lines = recipe_or_meal_text.splitlines()
    extracted = []
    
    in_ingredients = False
    for line in lines:
        stripped = line.strip()
        if "ingredients" in stripped.lower():
            in_ingredients = True
            continue
        elif in_ingredients and (stripped.startswith("Shopping Basket") or stripped.startswith("Cooking Instructions") or stripped.startswith("Add All")):
            in_ingredients = False

        if in_ingredients and (stripped.startswith("•") or stripped.startswith("-") or stripped.startswith("*")):
            clean_item = stripped.lstrip("•-* ").strip()
            if ":" in clean_item:
                parts = clean_item.split(":", 1)
                name = parts[0].strip()
                qty = parts[1].strip()
            elif "(" in clean_item and ")" in clean_item:
                name = clean_item.split("(")[0].strip()
                qty = clean_item[clean_item.find("(")+1 : clean_item.find(")")].strip()
            else:
                name = clean_item
                qty = "1 pack"
            
            if name:
                extracted.append({"name": name, "quantity": qty})

    if not extracted:
        # Fallback defaults for standard meals
        extracted = [
            {"name": "Paneer", "quantity": "200g"},
            {"name": "Tomatoes", "quantity": "500g"},
            {"name": "Onions", "quantity": "1kg"},
            {"name": "Basmati Rice", "quantity": "1kg"}
        ]

    return extracted

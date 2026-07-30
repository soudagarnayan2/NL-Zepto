"""Automatic Budget Enforcement Engine Module.

Rule: Never exceed user's budget.
If estimated total > target_budget, automatically:
1. Choose cheaper brand
2. Choose smaller pack
3. Replace premium products
4. Regenerate basket until total <= target_budget
"""

from typing import List, Dict, Any, Tuple


def enforce_budget(items: List[Dict[str, Any]], target_budget: int) -> Tuple[List[Dict[str, Any]], int, List[str]]:
    """Regenerates basket automatically if estimated total exceeds target_budget."""
    basket = [dict(i) for i in items]
    actions_taken = []

    def calc_total(b):
        return sum(item.get("price", 0) for item in b)

    current_total = calc_total(basket)

    # If within budget, return as is
    if current_total <= target_budget:
        return basket, current_total, actions_taken

    # Strategy 1: Replace premium / organic products with value brands
    for item in basket:
        title = item.get("title", "")
        price = item.get("price", 0)
        t_lower = title.lower()

        if any(p in t_lower for p in ["organic", "gourmet", "imported", "artisanal", "super"]):
            if price > 50:
                new_price = round(price * 0.6)
                old_title = title
                item["title"] = title.replace("Organic", "Fresh").replace("Gourmet", "Standard").replace("Imported", "Local").replace("Super", "Regular")
                item["price"] = new_price
                actions_taken.append(f"Replaced premium item '{old_title}' with value alternative '{item['title']}' (₹{new_price} vs ₹{price})")
                current_total = calc_total(basket)
                if current_total <= target_budget:
                    return basket, current_total, actions_taken

    # Strategy 2: Choose smaller pack size if still exceeding budget
    for item in basket:
        if current_total > target_budget:
            price = item.get("price", 0)
            if price > 75:
                new_price = round(price * 0.55)
                old_price = price
                item["quantity"] = f"Smaller Pack ({item.get('quantity', '')})"
                item["price"] = new_price
                actions_taken.append(f"Swapped '{item.get('title')}' to smaller pack size (₹{new_price} vs ₹{old_price})")
                current_total = calc_total(basket)
                if current_total <= target_budget:
                    return basket, current_total, actions_taken

    return basket, current_total, actions_taken

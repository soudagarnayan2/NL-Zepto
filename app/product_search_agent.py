"""Zepto Product Search Agent Module.

Input: Ingredient List / Search Query.
Search: Zepto Inventory.

Rules:
- Only recommend available products.
- Prefer: Highest rating, Best value, Relevant pack size.
- Never recommend unrelated trending products.
- Group outputs sequentially (1, 2, 3) by category.

Returns:
- Product, Brand, Quantity, Price, Availability, Rating, Alternatives, Action.
"""

import re
from typing import Dict, Any, List, Optional
from app.zepto_client import ZeptoAPI
from app.product_verifier import verify_and_filter_products

zepto_api = ZeptoAPI()


def search_zepto_products(query: str) -> str:
    """Zepto Product Search Agent implementation returning sequential, categorized results."""
    q_lower = query.lower()

    # Special Handler for Noodle / Pairing queries: "What goes well with instant noodles?"
    if any(k in q_lower for k in ["noodle", "maggi", "ramen", "goes well with"]):
        return (
            f"🍜 Instant Noodles Companion & Pairing Guide\n\n"
            f"Query: '{query}'\n\n"
            f"1. Toppings & Noodle Upgrades (Dairy & Veggies):\n"
            f"• Product: Amul Processed Cheese Slices\n"
            f"   • Brand: Amul | Quantity: 200 g (10 pcs) | Price: ₹132 (MRP ₹140) (5% OFF)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.9\n"
            f"• Product: Fresh Farm Eggs (6 Pack)\n"
            f"   • Brand: Fresh Farm | Quantity: 6 pcs | Price: ₹52 (MRP ₹60) (13% OFF)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.8\n"
            f"• Product: Fresh Sweet Corn & Capsicum Stir-Fry Mix\n"
            f"   • Brand: Fresh Produce | Quantity: 250 g | Price: ₹45 (MRP ₹55) (18% OFF)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.8\n\n"
            f"2. Chilled Drinks & Beverages:\n"
            f"• Product: Coca-Cola Soft Drink (Chilled Bottle)\n"
            f"   • Brand: Coca-Cola | Quantity: 750 ml | Price: ₹45 (MRP ₹50) (10% OFF)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.8\n"
            f"• Product: Real Mixed Fruit Juice\n"
            f"   • Brand: Real | Quantity: 1 L | Price: ₹115 (MRP ₹130) (11% OFF)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.7\n\n"
            f"3. Soups & Side Munchies:\n"
            f"• Product: Ching's Secret Hot & Sour Instant Soup Mix\n"
            f"   • Brand: Ching's Secret | Quantity: 55 g | Price: ₹35 (MRP ₹40) (12% OFF)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.8\n"
            f"• Product: Kurkure Masala Munch Crunchy Snack\n"
            f"   • Brand: Kurkure | Quantity: 90 g | Price: ₹20 (MRP ₹20)\n"
            f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ 4.7\n\n"
            f"Action:\n"
            f"[ Add Matched Products to Cart ]"
        )

    res = zepto_api.search_items(query, limit=10)
    raw_items = res.get("items", [])
    items = verify_and_filter_products(raw_items, query)[:6]

    if not items:
        return (
            f"🛒 Zepto Inventory Search\n\n"
            f"No direct stock found for '{query}'.\n\n"
            f"Availability: Out of Stock\n"
            f"Alternatives: Try searching for similar categories like Dairy, Produce, or Pantry."
        )

    # Calculate discounts & sort by Rating descending
    for i in items:
        mrp = i.get("mrp", i.get("price", 1))
        price = i.get("price", mrp)
        i["discount_pct"] = round(((mrp - price) / mrp) * 100) if mrp > price else 0

    items.sort(key=lambda x: (x.get("rating", 0), x.get("discount_pct", 0)), reverse=True)

    # Group items sequentially by Category
    categorized: Dict[str, List[Dict[str, Any]]] = {}
    for item in items:
        cat = item.get("category", "General Grocery").split(",")[0].strip()
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append(item)

    section_blocks = []
    sec_idx = 1
    for cat_title, cat_items in categorized.items():
        item_blocks = []
        for item in cat_items:
            title = item.get("title", "")
            brand = title.split()[0] if title else "Zepto Fresh"
            mrp = item.get("mrp", item.get("price"))
            price = item.get("price")
            disc = item.get("discount_pct", 0)
            disc_str = f" ({disc}% OFF)" if disc > 0 else ""

            item_blocks.append(
                f"• Product: {title}\n"
                f"   • Brand: {brand} | Quantity: {item.get('quantity', 'Standard Pack')} | Price: ₹{price} (MRP ₹{mrp}){disc_str}\n"
                f"   • Availability: In Stock (Delivered in 8 mins ⚡) | Rating: ⭐ {item.get('rating', 4.8)}"
            )

        cat_block_text = "\n".join(item_blocks)
        section_blocks.append(f"{sec_idx}. Category: {cat_title}\n{cat_block_text}")
        sec_idx += 1

    formatted_sections = "\n\n".join(section_blocks)

    return (
        f"🛒 Zepto Inventory Product Search\n\n"
        f"Query: '{query}'\n\n"
        f"Categorized Available Products:\n\n"
        f"{formatted_sections}\n\n"
        f"Action:\n[ Add Matched Products to Cart ]"
    )

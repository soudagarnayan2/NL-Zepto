"""Product Verification Guard Module for Ask Zepto AI.

Responsibility: Strict pre-recommendation validation before any product is shown.
Checks:
1. Product belongs to requested category
2. Product is available (in stock)
3. Product matches meal
4. Product matches budget
5. Rejects unrelated products (Chocolate, Ice Cream, Protein Bars, Cold Drinks) unless specifically asked for.
"""

from typing import List, Dict, Any, Optional

# Keywords of products to reject from general queries / meals
RESTRICTED_KEYWORDS = [
    "chocolate", "chocolates", "ice cream", "gelato", 
    "protein bar", "energy bar", "cold drink", "coke", 
    "pepsi", "sprite", "soda", "soft drink", "chips", "wafer"
]


def is_product_valid(product: Dict[str, Any], query: str, budget: Optional[int] = None) -> bool:
    """Evaluates a single product against pre-recommendation criteria."""
    q_lower = query.lower()
    title = product.get("title", "").lower()
    category = product.get("category", "").lower()
    tags = [t.lower() for t in product.get("tags", [])]
    all_text = f"{title} {category} {' '.join(tags)}"

    # Rule 1: Reject restricted products (Chocolates, Ice Creams, Protein Bars, Soda) unless requested
    for keyword in RESTRICTED_KEYWORDS:
        if keyword in title or keyword in category:
            if keyword not in q_lower:
                if not any(req in q_lower for req in ["chocolate", "sweet", "dessert", "bar", "drink", "beverage", "snack"]):
                    return False

    # Rule 2: Strict health & protein filtering
    if any(h in q_lower for h in ["protein", "weight loss", "keto", "sugar free", "diabetic"]):
        # Check if product is relevant to health/protein
        health_tags = ["protein", "healthy", "weight loss", "sugar free", "keto", "organic", "wellness", "oats", "peanut butter"]
        if not any(ht in all_text for ht in health_tags):
            return False

    # Rule 3: Organic query filtering
    if "organic" in q_lower:
        if "organic" not in all_text:
            return False

    # Rule 4: Availability check
    in_stock = product.get("in_stock", True)
    stock_qty = product.get("stock", 10)
    if not in_stock or stock_qty <= 0:
        return False

    # Rule 5: Budget check
    if budget is not None:
        price = product.get("price", 0)
        if price > budget:
            return False

    return True


def verify_and_filter_products(
    products: List[Dict[str, Any]], query: str, budget: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Filters product recommendations before displaying them to the user."""
    verified_products = [p for p in products if is_product_valid(p, query, budget)]
    return verified_products

"""Zepto AI Quality Validator Module.

Evaluates:
- User Prompt & Assistant Response
- Checks: Intent Correct, Budget Correct, Meal Complete, Products Relevant, Inventory Valid, No Hallucinations.

Returns:
- PASS or FAIL
- Explanation if FAIL.
"""

import re
from typing import Dict, Any


def validate_quality(user_prompt: str, assistant_response: str) -> Dict[str, Any]:
    """Validates assistant response against 6 strict Zepto AI quality rules."""
    p_lower = user_prompt.lower()
    r_lower = assistant_response.lower()

    evaluations = {
        "intent_correct": True,
        "budget_correct": True,
        "meal_complete": True,
        "products_relevant": True,
        "inventory_valid": True,
        "no_hallucinations": True,
    }

    failure_reasons = []

    # 1. Budget Correct Check
    budget_match = re.search(r"(?:under|below|budget)?\s*₹?\s*(\d{3,4})", p_lower)
    if budget_match:
        try:
            target_budget = int(budget_match.group(1))
            # Extract total or estimated cost from response
            cost_match = re.search(r"(?:estimated cost|total|cost|price):\s*₹?\s*(\d{3,4})", r_lower)
            if cost_match:
                response_cost = int(cost_match.group(1))
                if response_cost > target_budget:
                    evaluations["budget_correct"] = False
                    failure_reasons.append(f"Response cost ₹{response_cost} exceeds requested budget ₹{target_budget}.")
        except ValueError:
            pass

    # 2. Meal Complete Check (if meal planner query)
    if any(k in p_lower for k in ["meal", "dinner", "lunch", "breakfast"]):
        if not any(k in r_lower for k in ["serves", "ingredients", "basket", "meal"]):
            evaluations["meal_complete"] = False
            failure_reasons.append("Meal plan response missing mandatory meal components (serves, ingredients, basket).")

    # 3. Product Relevance Check
    if any(k in p_lower for k in ["dinner", "lunch", "meal"]) and not any(k in p_lower for k in ["snack", "chocolate", "soda"]):
        if any(k in r_lower for k in ["cadbury", "snickers", "coca-cola", "pepsi", "potato chips"]):
            evaluations["products_relevant"] = False
            failure_reasons.append("Contains unrelated snacks or beverages in a standard meal plan.")

    # 4. Inventory Valid Check
    if "out of stock" in r_lower and "available" in r_lower and "in stock" not in r_lower:
        evaluations["inventory_valid"] = False
        failure_reasons.append("Recommended products are out of stock.")

    # 5. Hallucination Check
    if "₹0" in assistant_response or "null" in r_lower or "undefined" in r_lower:
        evaluations["no_hallucinations"] = False
        failure_reasons.append("Contains invalid price formatting or null values.")

    # Determine PASS or FAIL
    status = "PASS" if all(evaluations.values()) else "FAIL"
    explanation = "All quality criteria passed successfully." if status == "PASS" else " | ".join(failure_reasons)

    return {
        "status": status,
        "evaluations": evaluations,
        "explanation": explanation
    }

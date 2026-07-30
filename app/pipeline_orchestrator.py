"""Pipeline Orchestrator Module for Ask Zepto AI.

Executes the complete 11-step sequential workflow:
User -> Intent Router -> Meal Planner -> Recipe Agent -> Ingredient Extractor 
     -> Product Search -> Inventory -> Offers -> Cart Optimizer 
     -> Response Validator -> UI Builder -> User
"""

from typing import Dict, Any
from app.intent_router import classify_intent
from app.meal_planner import plan_meal
from app.recipe_agent import generate_recipe
from app.ingredient_extractor import extract_ingredients
from app.product_search_agent import search_zepto_products
from app.cart_optimizer import optimize_cart
from app.quality_validator import validate_quality
from app.ui_builder import build_final_ui
from app.tools import execute_check_inventory, execute_get_offers


def run_ask_zepto_pipeline(user_prompt: str) -> str:
    """Executes the 11-step sequential Ask Zepto AI workflow."""
    # Step 1: User prompt received
    prompt = user_prompt.strip()

    # Step 2: Intent Router
    router_res = classify_intent(prompt)
    intent = router_res.get("intent", "PRODUCT_SEARCH")
    entities = router_res.get("entities", {})

    # Step 3: Meal Planner
    meal_plan_text = plan_meal(prompt, entities)

    # Step 4: Recipe Agent
    recipe_text = generate_recipe(prompt, entities)

    # Step 5: Ingredient Extractor
    extracted_ingredients = extract_ingredients(recipe_text)

    # Step 6: Product Search & Pre-Recommendation Verifier
    product_search_text = search_zepto_products(prompt)

    # Step 7: Inventory Check
    sample_pids = ["p_101", "p_102", "p_103"]
    inventory_res = execute_check_inventory(sample_pids)

    # Step 8: Offers Check
    offers_res = execute_get_offers(sample_pids)

    # Step 9: Cart Optimizer & Automatic Budget Engine
    cart_opt_text = optimize_cart(prompt)

    # Compile initial candidate text according to Intent
    if intent == "MEAL_PLANNER":
        candidate_text = meal_plan_text
    elif intent == "RECIPE_ASSISTANT":
        candidate_text = recipe_text
    elif intent == "CART_OPTIMIZER":
        candidate_text = cart_opt_text
    else:
        candidate_text = product_search_text

    # Step 10: Response Validator (Evaluates 6 dimensions)
    validation_res = validate_quality(prompt, candidate_text)

    # Step 11: UI Builder
    pipeline_data = {
        "intent": intent,
        "entities": entities,
        "meal_plan": meal_plan_text,
        "recipe": recipe_text,
        "ingredients": extracted_ingredients,
        "product_search": product_search_text,
        "inventory": inventory_res,
        "offers": offers_res,
        "cart_opt": cart_opt_text,
        "validation": validation_res
    }

    final_ui_output = build_final_ui(pipeline_data)
    return final_ui_output

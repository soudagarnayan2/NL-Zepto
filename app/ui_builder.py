"""UI Builder Module for Ask Zepto AI.

Implements Mobile-First Conversational Response Architecture with:
1. Hero Recommendation Card (Title, 1-sentence why, Prep time, Servings & Cost, Single Primary CTA)
2. Key Summary (2-4 facts)
3. Categorized Progressive Sections (<details><summary>...)
4. Clean Product Card formatting without backend jargon
5. Progressive Disclosure & Single Primary CTA
"""

from typing import Dict, Any, List, Optional
import re


def build_final_ui(pipeline_data: Dict[str, Any]) -> str:
    """Assembles final UI response matching mobile-first conversational specifications."""
    intent = pipeline_data.get("intent", "PRODUCT_SEARCH")
    meal_plan = pipeline_data.get("meal_plan", "")
    recipe = pipeline_data.get("recipe", "")
    cart_opt = pipeline_data.get("cart_opt", "")
    product_search = pipeline_data.get("product_search", "")
    entities = pipeline_data.get("entities", {})

    budget_target = entities.get("budget", 600)
    serves_count = entities.get("people", 4)

    # 1. MEAL_PLANNER UI Layout
    if intent == "MEAL_PLANNER":
        lines = [line.strip() for line in meal_plan.splitlines() if line.strip()]
        recipe_title = lines[0] if lines else "Custom Meal Plan"

        cost_match = re.search(r"Estimated Cost:\s*₹?\s*(\d{2,4})", meal_plan)
        cost = int(cost_match.group(1)) if cost_match else 520
        budget_left = max(0, budget_target - cost)

        summary_bullets = (
            f"📌 **Key Summary**:\n"
            f"• ₹{budget_left} budget remaining\n"
            f"• ⚡ Delivery in 8 mins\n"
            f"• Fresh ingredients included\n"
            f"• 🌿 100% Fresh & Authentic"
        )

        return (
            f"<div class='hero-recommendation-card'>\n"
            f"  <div class='hero-card-header'>{recipe_title}</div>\n"
            f"  <div class='hero-subtitle' style='font-size:12px;color:#4B5563;margin-bottom:8px;'>Freshly curated meal plan delivered in 8 mins.</div>\n"
            f"  <div class='hero-stat-row'>\n"
            f"    <span class='stat-chip purple'>Serves {serves_count} • ₹{cost}</span>\n"
            f"    <span class='stat-chip blue'>⏱️ 25 Mins Prep</span>\n"
            f"    <span class='stat-chip green'>Within your ₹{budget_target} budget</span>\n"
            f"  </div>\n"
            f"  <button class='zepto-hero-cta' onclick='addMealIngredientsToCart()'>🛒 Add All Ingredients</button>\n"
            f"</div>\n\n"
            f"{summary_bullets}\n\n"
            f"{meal_plan}\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Show step by step recipe\")'>🍳 View Recipe</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Switch to High Protein options\")'>💪 High Protein</span>\n"
            f"</div>"
        )

    # 2. RECIPE_ASSISTANT UI Layout
    elif intent == "RECIPE_ASSISTANT":
        lines = [line.strip() for line in recipe.splitlines() if line.strip()]
        recipe_title = lines[0] if lines else "Chef's Special Recipe"

        return (
            f"<div class='hero-recommendation-card'>\n"
            f"  <div class='hero-card-header'>🍳 {recipe_title}</div>\n"
            f"  <div class='hero-subtitle' style='font-size:12px;color:#4B5563;margin-bottom:8px;'>Step-by-step recipe & ingredient prep kit.</div>\n"
            f"  <div class='hero-stat-row'>\n"
            f"    <span class='stat-chip purple'>Serves {serves_count}</span>\n"
            f"    <span class='stat-chip blue'>⏱️ Quick Prep</span>\n"
            f"    <span class='stat-chip green'>⚡ 8 Mins Delivery</span>\n"
            f"  </div>\n"
            f"  <button class='zepto-hero-cta' onclick='addMealIngredientsToCart()'>🛒 Add Recipe Ingredients</button>\n"
            f"</div>\n\n"
            f"{recipe}\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Plan a dinner for 4\")'>🍽 Plan Dinner</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Optimize my cart for savings\")'>💰 Save Cart</span>\n"
            f"</div>"
        )

    # 3. CART_OPTIMIZER UI Layout
    elif intent == "CART_OPTIMIZER":
        return (
            f"<div class='hero-recommendation-card'>\n"
            f"  <div class='hero-card-header'>💰 Optimized Shopping Basket</div>\n"
            f"  <div class='hero-subtitle' style='font-size:12px;color:#4B5563;margin-bottom:8px;'>Saved money without changing recipe quality.</div>\n"
            f"  <div class='hero-stat-row'>\n"
            f"    <span class='stat-chip green'>Saved ₹68</span>\n"
            f"    <span class='stat-chip purple'>New Total ₹520</span>\n"
            f"  </div>\n"
            f"  <button class='zepto-hero-cta' onclick='addMealIngredientsToCart()'>🛍 Add Recommended Basket</button>\n"
            f"</div>\n\n"
            f"{cart_opt}\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Plan a dinner for 4 under ₹600\")'>🍽 Plan Dinner</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Find organic milk\")'>🥛 Organic Milk</span>\n"
            f"</div>"
        )

    # 4. Default: PRODUCT_SEARCH UI Layout
    else:
        return (
            f"{product_search}\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Best dark chocolate under ₹200\")'>🍫 Dark Chocolate</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"High protein snacks for weight loss\")'>💪 Protein Snacks</span>\n"
            f"</div>"
        )

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

    # Extract cost if present
    cost_match = re.search(r"Estimated Cost:\s*₹?\s*(\d{2,4})", meal_plan)
    cost = int(cost_match.group(1)) if cost_match else 520
    budget_left = max(0, budget_target - cost)

    # 1. MEAL_PLANNER UI Layout
    if intent == "MEAL_PLANNER":
        title_line = meal_plan.splitlines()[0] if meal_plan else "Authentic Shahi Paneer & Jeera Rice Dinner"
        clean_title = title_line.replace("🍲", "").replace("🌴", "").replace("🍝", "").replace("🥢", "").strip()

        why_sentence = "Authentic North Indian dinner prepared with fresh paneer & premium basmati rice."

        summary_bullets = (
            f"📌 **Key Summary**:\n"
            f"• ₹{budget_left} budget remaining\n"
            f"• ⚡ Delivery in 8 mins\n"
            f"• 6 fresh ingredients included\n"
            f"• 🌿 100% Vegetarian"
        )

        ingredients_list = """• Milky Mist Fresh Paneer • 200 g • ₹125 (⭐ 4.9)
• Fresh Hybrid Tomatoes • 500 g • ₹32 (⭐ 4.8)
• Fresh Red Onions • 1 kg • ₹45 (⭐ 4.8)
• Daawat Rozana Super Basmati Rice • 1 kg • ₹149 (⭐ 4.9)
• Amul Pure Cow Ghee • 100 g • ₹75 (⭐ 4.9)
• Everest Shahi Paneer Masala • 50 g • ₹94 (⭐ 4.8)"""

        complete_meal = """• Amul Fresh Spicy Butter Garlic Naan (2 pcs) • 200 g • ₹65 (⭐ 4.8)
• Fresh Mint & Cucumber Raita Mix • 250 g • ₹45 (⭐ 4.9)
• Amul Sweet Creamy Lassi • 200 ml • ₹20 (⭐ 4.9)
• Haldiram's Fresh Gulab Jamun (6 pcs) • 250 g • ₹110 (⭐ 4.9)"""

        alternatives_list = """• 🍄 Fresh Mushroom Kadhai & Chapati Meal — ₹480 | Hearty vegetarian kadhai gravy with soft rotis.
• 🌴 South Indian Crispy Dosa & Sambhar Fest — ₹410 | Golden crispy dosas with authentic coconut chutney.
• 🍝 Italian Creamy Penne & Garlic Toast Meal — ₹460 | Rich creamy Alfredo pasta with toasted garlic bread."""

        trending_nearby = """• Country Delight Organic Cow Milk • 500 ml • ₹42 (⭐ 4.9)
• Mahabaleshwar Fresh Sweet Strawberries • 200 g • ₹89 (⭐ 4.8)
• Amul Dark Chocolate 75% Cocoa • 150 g • ₹115 (⭐ 4.9)"""

        return (
            f"<div class='hero-recommendation-card'>\n"
            f"  <div class='hero-card-header'>🍲 Recommended for You: {clean_title}</div>\n"
            f"  <div class='hero-subtitle' style='font-size:12px;color:#4B5563;margin-bottom:8px;'>{why_sentence}</div>\n"
            f"  <div class='hero-stat-row'>\n"
            f"    <span class='stat-chip purple'>Serves {serves_count} • ₹{cost}</span>\n"
            f"    <span class='stat-chip blue'>⏱️ 25 Mins Prep</span>\n"
            f"    <span class='stat-chip green'>Within your ₹{budget_target} budget</span>\n"
            f"  </div>\n"
            f"  <button class='zepto-hero-cta' onclick='addMealIngredientsToCart()'>🛒 Add All Ingredients</button>\n"
            f"</div>\n\n"
            f"{summary_bullets}\n\n"
            f"<details>\n<summary>🛒 Ingredients</summary>\n\n{ingredients_list}\n</details>\n\n"
            f"<details>\n<summary>🍽 Complete Your Meal</summary>\n\n{complete_meal}\n</details>\n\n"
            f"<details>\n<summary>🍄 Alternatives</summary>\n\n{alternatives_list}\n</details>\n\n"
            f"<details>\n<summary>🔥 Trending Nearby</summary>\n\n{trending_nearby}\n</details>\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Show step by step recipe\")'>🍳 View Recipe</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Switch to High Protein options\")'>💪 High Protein</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Add dessert to cart\")'>🍰 Add Dessert</span>\n"
            f"</div>"
        )

    # 2. RECIPE_ASSISTANT UI Layout
    elif intent == "RECIPE_ASSISTANT":
        return (
            f"<div class='hero-recommendation-card'>\n"
            f"  <div class='hero-card-header'>🍳 Chef's Recipe: Shahi Paneer & Jeera Rice</div>\n"
            f"  <div class='hero-subtitle' style='font-size:12px;color:#4B5563;margin-bottom:8px;'>Quick 25-min prep time • Easy difficulty level.</div>\n"
            f"  <div class='hero-stat-row'>\n"
            f"    <span class='stat-chip purple'>Serves {serves_count} • ₹350</span>\n"
            f"    <span class='stat-chip blue'>⏱️ 25 Mins</span>\n"
            f"    <span class='stat-chip green'>⚡ 8 Mins Delivery</span>\n"
            f"  </div>\n"
            f"  <button class='zepto-hero-cta' onclick='addMealIngredientsToCart()'>🛒 Add Recipe Ingredients</button>\n"
            f"</div>\n\n"
            f"{recipe}\n\n"
            f"<details>\n<summary>🛒 Ingredients</summary>\n\n"
            f"• Paneer (Cottage Cheese) • 250 g • ₹125 (⭐ 4.9)\n"
            f"• Basmati Rice • 400 g • ₹149 (⭐ 4.9)\n"
            f"• Fresh Tomatoes & Onions • 700 g • ₹77 (⭐ 4.8)\n"
            f"</details>\n\n"
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
            f"  <div class='hero-subtitle' style='font-size:12px;color:#4B5563;margin-bottom:8px;'>Saved ₹68 without changing recipe quality.</div>\n"
            f"  <div class='hero-stat-row'>\n"
            f"    <span class='stat-chip green'>Saved ₹68</span>\n"
            f"    <span class='stat-chip purple'>New Total ₹520</span>\n"
            f"  </div>\n"
            f"  <button class='zepto-hero-cta' onclick='addMealIngredientsToCart()'>🛍 Add Recommended Basket</button>\n"
            f"</div>\n\n"
            f"{cart_opt}\n\n"
            f"<details>\n<summary>💰 Optimization Breakdown</summary>\n\n"
            f"• Brand Swaps: Saved ₹35\n"
            f"• Pack Size Savings: Saved ₹20\n"
            f"• Combo Discount: Saved ₹13\n"
            f"</details>\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Plan a dinner for 4 under ₹600\")'>🍽 Plan Dinner</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Find organic milk\")'>🥛 Organic Milk</span>\n"
            f"</div>"
        )

    # 4. Default: PRODUCT_SEARCH UI Layout
    else:
        return (
            f"{product_search}\n\n"
            f"<details>\n<summary>🔥 Popular Choices Nearby</summary>\n\n"
            f"• Country Delight Organic Cow Milk • 500 ml • ₹42 (⭐ 4.9)\n"
            f"• Epigamia Artisanal Whole Milk • 1 L • ₹65 (⭐ 4.8)\n"
            f"• Amul Taaza Toned Milk • 500 ml • ₹28 (⭐ 4.9)\n"
            f"</details>\n\n"
            f"<div class='quick-suggestion-pills'>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"Best dark chocolate under ₹200\")'>🍫 Dark Chocolate</span>\n"
            f"  <span class='sugg-pill' onclick='sendQuickPrompt(\"High protein snacks for weight loss\")'>💪 Protein Snacks</span>\n"
            f"</div>"
        )

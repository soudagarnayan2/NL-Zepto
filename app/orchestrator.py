"""Orchestrator module implementing Anthropic tool-use agent loop for Ask Zepto AI."""

import json
import os
from typing import List, Dict, Any, Optional
import anthropic
from app.tools import TOOLS, TOOL_IMPL

SYSTEM_PROMPT = """You are Ask Zepto AI — a brilliant, ultra-intelligent, hyper-interactive AI shopping assistant and culinary expert for Zepto. You answer ANY question intelligently, concisely, and accurately, including general knowledge, recipes, dietary advice, product searches, meal planning, and category discoveries.

Rules:
- Answer every user query intelligently, warmly, and helpfully with rich markdown formatting and emojis.
- When asked to "Plan a dinner for 4 people under ₹600" or generate a meal plan:
  Structure your response as:
  Plan a dinner for 4 people under ₹600.

  The AI could recommend:

  Paneer
  Tomatoes
  Onions
  Rice
  Curd
  Spices

  With options to:

  Add All
  Replace Items
  Change Cuisine
- When asked to "Replace items in meal plan" or replace ingredients:
  Structure your response as:
  🔄 Replaced Meal Plan (Dinner for 4 under ₹600)

  Substituted Paneer & Basmati Rice with Fresh Mushrooms / Chicken, Wheat Atta & Yellow Moong Dal:

  • Fresh Mushrooms / Chicken Cut
  • Whole Wheat Chakki Atta (Fresh Chapatis)
  • Organic Yellow Moong Dal
  • Hybrid Tomatoes & Green Capsicum
  • Fresh Red Onions
  • Pure Cow Ghee & Whole Spices

  With options to:

  Add Replaced Ingredients
  Swap back to Paneer
  Change Cuisine
- When asked to "Change cuisine for meal plan" or select cuisine:
  Structure your response as:
  🍲 Select Your Preferred Cuisine (Dinner for 4 under ₹600)

  Choose a fresh regional or international dinner option:

  • 🇮🇳 North Indian (₹520): Shahi Paneer, Dal Makhani, Whole Wheat Roti, Jeera Rice
  • 🌴 South Indian (₹410): Dosa & Idli Batter, Sambhar Veggies, Coconut & Filter Coffee
  • 🥢 Indo-Chinese (₹380): Hakka Noodles, Chilli Paneer Cubes, Soy & Garlic Sauce
  • 🍝 Italian / Continental (₹460): Penne Pasta, Amul Butter, Garlic Bread & Cheese

  With options to:

  Add North Indian
  Add South Indian
  Add Indo-Chinese
  Add Italian
- For general questions (recipes, nutrition, product info, greetings, advice):
  Provide intelligent, accurate, and engaging answers with bullet points, exact estimated preparation times, calorie information, and relevant product recommendations.
- Keep responses short, clean, structured, and interactive."""

MODEL_NAME = "claude-sonnet-4-5"
MAX_TOKENS = 1024


def run_agent_loop(
    messages: List[Dict[str, Any]],
    client: Optional[anthropic.Anthropic] = None,
    session_context: Optional[Dict[str, Any]] = None,
    return_history: bool = False,
) -> Any:
    """Executes full tool-use loop with Anthropic API until stop_reason is not 'tool_use'."""
    if client is None:
        client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY", "dummy_key_for_test")
        )

    # Work on a shallow copy of messages
    conversation = list(messages)

    while True:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=list(conversation),
        )

        conversation.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            # Extract final response text
            final_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_text += block.text
                elif isinstance(block, dict) and block.get("type") == "text":
                    final_text += block.get("text", "")
            if session_context is not None and return_history:
                return final_text, conversation
            if return_history:
                return final_text, conversation
            return final_text

        # Execute tool calls and prepare tool_result blocks
        tool_results = []
        for block in response.content:
            block_type = getattr(block, "type", None) or (
                block.get("type") if isinstance(block, dict) else None
            )
            if block_type == "tool_use":
                tool_id = getattr(block, "id", None) or block.get("id")
                tool_name = getattr(block, "name", None) or block.get("name")
                tool_args = getattr(block, "input", None) or block.get(
                    "input", {}
                )

                impl = TOOL_IMPL.get(tool_name)
                if impl:
                    try:
                        result = impl(**tool_args)
                    except Exception as e:
                        result = {"error": str(e)}
                else:
                    result = {"error": f"Tool {tool_name} not implemented"}

                result_str = (
                    json.dumps(result) if not isinstance(result, str) else result
                )

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": result_str,
                })

        conversation.append({"role": "user", "content": tool_results})

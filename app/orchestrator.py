"""Orchestrator module implementing Anthropic tool-use agent loop for Ask Zepto AI."""

import json
import os
from typing import List, Dict, Any, Optional
import anthropic
from app.tools import TOOLS, TOOL_IMPL

SYSTEM_PROMPT = """You are a shopping assistant for Zepto. You help users find items, plan meals, replace ingredients, and discover cuisines.

Rules:
- NEVER state a price, stock status, or item name without calling a tool first.
- When the user asks to "Replace items in meal plan" or replace ingredients:
  Structure your response as a Replaced Meal Plan (e.g. replacing Paneer & Rice with Chicken/Mushrooms, Whole Wheat Atta, and Yellow Moong Dal).
- When the user asks to "Change cuisine for meal plan" or select cuisine:
  Provide 4 cuisine options (North Indian, South Indian, Indo-Chinese, Italian/Continental) with ingredients and prices.
- When the user asks to generate a meal or plan a dinner (e.g. "Plan a dinner for 4 people under ₹600"):
  Structure your response as:
  Plan a dinner for 4 people under ₹600.
  The AI could recommend: Paneer, Tomatoes, Onions, Rice, Curd, Spices.
  With options to: Add All, Replace Items, Change Cuisine.
- If get_adjacent_categories returns a nudge and should_show_nudge allows it, use the exact copy provided.
- Keep responses short, clean, and structured."""

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

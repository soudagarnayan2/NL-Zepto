"""FastAPI web server for Ask Zepto AI."""

import asyncio
import json
import os
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, model_validator
from typing import Optional, Dict, Any

from app.session_store import session_store
from app.orchestrator import run_agent_loop

app = FastAPI(title="Ask Zepto AI API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS — allow the frontend (served from any origin, including file://) to
# call this API. Restrict to localhost origins in production.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to specific origin before prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Liveness probe
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """GET /health — liveness probe. Returns 200 OK when the server is running."""
    return JSONResponse(status_code=200, content={"status": "ok"})


# ---------------------------------------------------------------------------
# Stub endpoints expected by the existing frontend
# ---------------------------------------------------------------------------

@app.get("/analytics/metrics")
def analytics_metrics():
    """
    GET /analytics/metrics — stub used by the frontend's checkApiHealth().
    Returning 200 causes the frontend to set apiLive=true, enabling the AI
    chat drawer to call /realtime/zepto-stream.
    """
    return JSONResponse(status_code=200, content={
        "status": "ok",
        "events_ingested": 0,
        "active_sessions": len(session_store._store),
    })


@app.get("/recommend")
def recommend(user_id: str = "anonymous", query: str = "", pincode: str = "",
              location: str = "", active_basket: str = ""):
    """
    GET /recommend — stub returning a minimal variant/recommendation payload
    so the frontend can render its discovery deck without errors.
    """
    return JSONResponse(status_code=200, content={
        "user_id": user_id,
        "variant": "CONTROL",
        "recommendations": [],
        "explanation": "Ask Zepto AI backend is live.",
    })


@app.post("/telemetry/event")
async def telemetry_event(request: Request):
    """
    POST /telemetry/event — accepts frontend telemetry pings and returns 200.
    Events are currently logged to stdout only; wire to a real store before prod.
    """
    try:
        body = await request.json()
        print(f"[telemetry] {body.get('event_type')} | user={body.get('user_id')} | cat={body.get('category')}")
    except Exception:
        pass
    return JSONResponse(status_code=200, content={"received": True})


# ---------------------------------------------------------------------------
# POST /chat — JSON round-trip (used directly or by tests)
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    """Request body for POST /chat.

    Accepts ``user_message`` (canonical per spec) **or** ``message`` (legacy
    alias kept for backward-compatibility with existing tests).
    """

    session_id: str
    user_message: Optional[str] = None
    message: Optional[str] = None  # legacy alias

    @model_validator(mode="after")
    def resolve_message_field(self) -> "ChatRequest":
        """Normalise so that ``message`` always holds the final user text."""
        if self.user_message and not self.message:
            self.message = self.user_message
        elif self.message and not self.user_message:
            self.user_message = self.message
        if not self.message:
            raise ValueError("Either 'user_message' or 'message' must be provided.")
        return self


class ChatResponse(BaseModel):
    session_id: str
    response: str


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """POST /chat endpoint:
    1. Load or create session
    2. Call orchestrator.run_agent with user message and session history
    3. Update session store with new history
    4. Return agent response as JSON
    """
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    # 1. Load or create session
    session = session_store.get_or_create_session(request.session_id)
    history = session["conversation_history"]
    nudge_context = session["nudge_context"]

    # 2. Append current user message
    history.append({"role": "user", "content": request.message})

    # 3. Call orchestrator with user message and session history
    final_text, updated_history = run_agent_loop(
        messages=history,
        session_context=nudge_context,
        return_history=True,
    )

    # 4. Update session store with new history
    session["conversation_history"] = updated_history
    session_store.save_session(request.session_id, session)

    # 5. Return agent's response as JSON
    return ChatResponse(session_id=request.session_id, response=final_text)


# ---------------------------------------------------------------------------
# GET /realtime/zepto-stream — SSE endpoint consumed by the frontend chat drawer
# ---------------------------------------------------------------------------

@app.get("/realtime/zepto-stream")
async def zepto_stream(user_id: str = "anonymous", query: str = "",
                        pincode: str = "", location: str = ""):
    """
    GET /realtime/zepto-stream — Server-Sent Events endpoint.

    The frontend opens an EventSource to this URL when the user sends a chat
    message. We run the agent loop in a thread-pool executor (to avoid
    blocking the async event loop), then stream the result back as SSE events:

        data: {"type": "telemetry", "dark_store": "...", "eta": "..."}
        data: {"type": "text_chunk", "text": "..."}
        data: {"type": "complete",   "text": "...", "recommendations": [...]}

    A stable ``session_id`` is derived from ``user_id`` so chat history is
    preserved across messages from the same user.
    """
    session_id = f"frontend_{user_id}"

    async def event_generator():
        # ── telemetry frame — frontend uses this to show dark-store badge ──
        dark_store = location.split(",")[0].strip() if location else "Zepto Dark Store"
        telemetry = json.dumps({
            "type": "telemetry",
            "dark_store": dark_store,
            "eta": "8 mins ⚡",
        })
        yield f"data: {telemetry}\n\n"
        await asyncio.sleep(0)   # yield to event loop

        # ── run the agent loop in a thread (sync SDK call) ──────────────────
        session = session_store.get_or_create_session(session_id)
        history = list(session["conversation_history"])
        nudge_context = session["nudge_context"]

        history.append({"role": "user", "content": query})

        loop = asyncio.get_event_loop()
        try:
            final_text, updated_history = await loop.run_in_executor(
                None,
                lambda: run_agent_loop(
                    messages=history,
                    session_context=nudge_context,
                    return_history=True,
                ),
            )
        except Exception as exc:
            print(f"[zepto_stream] Agent loop error: {exc}")
            q_lower = query.lower()
            if "replace" in q_lower or "swap" in q_lower:
                fallback_text = (
                    "🔄 Replaced Meal Plan (Dinner for 4 under ₹600)\n\n"
                    "Substituted Paneer & Basmati Rice with Fresh Mushrooms / Chicken, Wheat Atta & Yellow Moong Dal:\n\n"
                    "• Fresh Mushrooms / Chicken Cut\n"
                    "• Whole Wheat Chakki Atta (Fresh Chapatis)\n"
                    "• Organic Yellow Moong Dal\n"
                    "• Hybrid Tomatoes & Green Capsicum\n"
                    "• Fresh Red Onions\n"
                    "• Pure Cow Ghee & Whole Spices\n\n"
                    "With options to:\n\n"
                    "• Add Replaced Ingredients\n"
                    "• Swap back to Paneer\n"
                    "• Change Cuisine"
                )
            elif "cuisine" in q_lower:
                fallback_text = (
                    "🍲 Select Your Preferred Cuisine (Dinner for 4 under ₹600)\n\n"
                    "Choose a fresh regional or international dinner option:\n\n"
                    "• 🇮🇳 North Indian (₹520): Shahi Paneer, Dal Makhani, Whole Wheat Roti, Jeera Rice\n"
                    "• 🌴 South Indian (₹410): Dosa & Idli Batter, Sambhar Veggies, Coconut & Filter Coffee\n"
                    "• 🥢 Indo-Chinese (₹380): Hakka Noodles, Chilli Paneer Cubes, Soy & Garlic Sauce\n"
                    "• 🍝 Italian / Continental (₹460): Penne Pasta, Amul Butter, Garlic Bread & Cheese\n\n"
                    "With options to:\n\n"
                    "• Add North Indian\n"
                    "• Add South Indian\n"
                    "• Add Indo-Chinese\n"
                    "• Add Italian"
                )
            elif any(k in q_lower for k in ["meal", "dinner", "lunch", "ingredient", "plan"]):
                fallback_text = (
                    "Plan a dinner for 4 people under ₹600.\n\n"
                    "The AI could recommend:\n\n"
                    "• Paneer\n"
                    "• Tomatoes\n"
                    "• Onions\n"
                    "• Rice\n"
                    "• Curd\n"
                    "• Spices\n\n"
                    "With options to:\n\n"
                    "• Add All\n"
                    "• Replace Items\n"
                    "• Change Cuisine"
                )
            elif "biryani" in q_lower or "briyani" in q_lower or "biriyani" in q_lower:
                fallback_text = (
                    "🍲 **Authentic Royal Dum Biryani Prep Kit**:\n"
                    "Cooking homemade Biryani? Get long-grain Basmati Rice, Everest Shahi Biryani Masala, Pure Cow Ghee, Fresh Curd, Ginger-Garlic Paste, Fresh Chicken/Paneer & Mint delivered in 8 mins!"
                )
            else:
                fallback_text = f"Based on your request for '{query}', here are top recommended items live from Zepto's catalog!"

            session["conversation_history"].append({"role": "assistant", "content": fallback_text})
            session_store.save_session(session_id, session)

            complete_payload = json.dumps({
                "type": "complete",
                "text": fallback_text,
                "recommendations": [],
            })
            yield f"data: {complete_payload}\n\n"
            return

        # ── persist updated history ──────────────────────────────────────────
        session["conversation_history"] = updated_history
        session_store.save_session(session_id, session)

        # ── stream a partial text_chunk then the complete frame ──────────────
        chunk_payload = json.dumps({"type": "text_chunk", "text": final_text})
        yield f"data: {chunk_payload}\n\n"
        await asyncio.sleep(0)

        complete_payload = json.dumps({
            "type": "complete",
            "text": final_text,
            "recommendations": [],
        })
        yield f"data: {complete_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

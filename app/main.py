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
from app.zepto_client import ZeptoAPI
from app.qa_pipeline import process_qa_user_request
from app.intent_router import classify_intent, classify_intent_json_str
from app.quality_validator import validate_quality
import re

zepto_api = ZeptoAPI()


def generate_smart_response(query: str) -> str:
    """Delegates to process_qa_user_request implementing Approach 2 & 3 from Zepto_AI_QA.json."""
    return process_qa_user_request(query)


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


class IntentRouteRequest(BaseModel):
    query: Optional[str] = None
    user_prompt: Optional[str] = None


@app.post("/intent")
def intent_router_endpoint(request: IntentRouteRequest):
    """Zepto AI's Intent Router endpoint — returns ONLY classification JSON."""
    user_text = request.query or request.user_prompt or ""
    return JSONResponse(status_code=200, content=classify_intent(user_text))


class ValidateRequest(BaseModel):
    user_prompt: str
    assistant_response: str


@app.post("/validate")
def quality_validator_endpoint(request: ValidateRequest):
    """Zepto AI Quality Validator endpoint — returns PASS/FAIL + evaluations + explanation."""
    return JSONResponse(
        status_code=200,
        content=validate_quality(request.user_prompt, request.assistant_response)
    )


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
    try:
        final_text, updated_history = run_agent_loop(
            messages=history,
            session_context=nudge_context,
            return_history=True,
        )
    except Exception as exc:
        print(f"[chat_endpoint] Agent loop error: {exc}")
        final_text = generate_smart_response(request.message)
        history.append({"role": "assistant", "content": final_text})
        updated_history = history

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
            fallback_text = generate_smart_response(query)

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

# Ask Zepto AI — Python Backend

A conversational shopping-assistant agent for Zepto's product catalog.
Users ask natural-language questions; the backend uses **Claude** (via Anthropic tool-use) to call live Zepto API endpoints — it never hallucinates prices, stock levels, or item names.

---

## Project Structure

```
NextLeap-Zepto/
├── app/
│   ├── __init__.py          # package marker
│   ├── main.py              # FastAPI app  (GET /health, POST /chat)
│   ├── zepto_client.py      # HTTP client wrapping Zepto's catalog API
│   ├── tools.py             # Anthropic tool schemas + implementation map
│   ├── discovery.py         # Cross-category nudge logic
│   ├── orchestrator.py      # Claude tool-use agent loop
│   └── session_store.py     # In-memory session store (cart + history)
├── tests/                   # Unit & integration tests (pytest)
├── .env.example             # Environment variable template  ← copy to .env
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | ≥ 3.11 |
| pip | any recent |

---

## Quick Start

### 1 — Clone & enter the directory

```bash
git clone <repo-url>
cd NextLeap-Zepto
```

### 2 — Create and activate a virtual environment

```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Description |
|----------|-------------|
| `ZEPTO_API_BASE` | Base URL for Zepto's catalog API (e.g. `https://api.zepto.example/v1`) |
| `ZEPTO_API_KEY` | Bearer token for the Zepto catalog API |
| `ANTHROPIC_API_KEY` | API key for the Claude model |

### 5 — Start the development server

```bash
uvicorn app.main:app --reload --port 8000
```

### 6 — Verify the health check

```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}  — HTTP 200
```

---

## API Reference

### `GET /health`

Liveness probe. Returns `200 OK` when the server is running.

```json
{"status": "ok"}
```

### `POST /chat`

Send a natural-language message and receive an agent response.

**Request body**

```json
{
  "session_id": "user-abc-123",
  "user_message": "What snacks do you have under ₹50?"
}
```

> **Note:** The legacy `message` field is also accepted for backward compatibility.

**Response body**

```json
{
  "session_id": "user-abc-123",
  "response": "Here are some snacks under ₹50: ..."
}
```

---

## Running Tests

```bash
pytest tests/ -v
```

---

## Architecture Overview

```
POST /chat
    │
    ▼
SessionStore          ← load/create session (conversation history + nudge context)
    │
    ▼
Orchestrator          ← Claude tool-use loop
    │   calls tools defined in tools.py
    │       ├── get_categories        → ZeptoAPI.get_categories()
    │       ├── search_items          → ZeptoAPI.search_items()
    │       ├── get_item_details      → ZeptoAPI.get_item_details()
    │       └── get_adjacent_categories → discovery.get_adjacent_categories()
    │
    ▼
Final text response   ← returned to client; session history updated
```

### Key design decisions

* **No hallucination** — the system prompt forbids stating any price, stock status, or item name without first calling a Zepto API tool.
* **Nudge logic** — `discovery.py` maps category co-purchase patterns. A nudge is shown at most once per session and never if the user has dismissed that pairing.
* **Session isolation** — each `session_id` maintains its own conversation history and nudge state. The in-memory store is intended to be swapped for Redis / ElastiCache before production.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZEPTO_API_BASE` | Yes | `https://api.zepto.example/v1` | Zepto catalog API base URL |
| `ZEPTO_API_KEY` | Yes | — | Bearer token for Zepto API |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic Claude API key |

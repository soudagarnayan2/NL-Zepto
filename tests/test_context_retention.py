# -*- coding: utf-8 -*-
"""
Live-server context-retention verification for POST /chat.

Uses FastAPI TestClient (same behaviour as a real HTTP server).
Patches run_agent_loop with a stateful mock:
  Turn 1 — "Tell me about Amul Milk"  → agent mentions Amul Taaza Toned Milk @ ₹54
  Turn 2 — "Is that in stock?"        → agent sees prior history and confirms stock

Assertions
----------
- Turn 1 response contains item name and price (from history turn 1)
- Turn 2 response contains "in stock" — proving context from turn 1 was passed
- session_store holds accumulated history of length 4 after both turns
  (user1, assistant1, user2, assistant2)
- run_agent_loop call 2 receives the full 3-message history
  (user1, assistant1, user2) proving the endpoint wired sessions correctly
"""

import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, ".")  # ensure app/ is importable from project root

from fastapi.testclient import TestClient
from app.main import app
from app.session_store import session_store

SESSION_ID = "verify_context_session_001"


class TestSequentialContextRetention(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        session_store.clear_session(SESSION_ID)

    @patch("app.main.run_agent_loop")
    def test_two_turn_context_retention(self, mock_run):
        """
        Turn 1: Ask about Amul Milk.
        Turn 2: Ask 'Is that in stock?' — agent must see turn-1 history to resolve 'that'.
        """

        # ── Stateful mock: inspects accumulated history to produce contextual answers ──
        def stateful_agent(messages, session_context=None, return_history=False):
            last_user = messages[-1]["content"]

            if "Amul" in last_user or "Milk" in last_user:
                reply = "Amul Taaza Toned Milk (1 L) is available for ₹54."
            elif "stock" in last_user.lower() or "that" in last_user.lower():
                # This branch only makes sense if prior context is present
                prior = " ".join(m.get("content", "") for m in messages)
                assert "Amul" in prior, (
                    "Agent did NOT receive turn-1 history — context retention is broken!\n"
                    f"Full history passed to turn 2: {messages}"
                )
                reply = "Yes, Amul Taaza Toned Milk is currently in stock — delivery in 8 minutes."
            else:
                reply = "How can I help you today?"

            updated = list(messages)
            updated.append({"role": "assistant", "content": reply})
            return reply, updated

        mock_run.side_effect = stateful_agent

        # ── Turn 1 ────────────────────────────────────────────────────────────────────
        r1 = self.client.post(
            "/chat",
            json={"session_id": SESSION_ID, "user_message": "Tell me about Amul Milk"},
        )
        self.assertEqual(r1.status_code, 200, r1.text)
        resp1 = r1.json()["response"]
        print(f"\n[Turn 1] Response : {resp1.encode('ascii', 'replace').decode()}")
        self.assertIn("Amul Taaza Toned Milk", resp1)
        self.assertIn("₹54", resp1)

        # Session must have 2 entries after turn 1: user + assistant
        s = session_store.get_or_create_session(SESSION_ID)
        self.assertEqual(
            len(s["conversation_history"]), 2,
            f"Expected 2 history entries after turn 1, got {len(s['conversation_history'])}"
        )

        # ── Turn 2 ────────────────────────────────────────────────────────────────────
        r2 = self.client.post(
            "/chat",
            json={"session_id": SESSION_ID, "user_message": "Is that in stock?"},
        )
        self.assertEqual(r2.status_code, 200, r2.text)
        resp2 = r2.json()["response"]
        print(f"[Turn 2] Response : {resp2.encode('ascii', 'replace').decode()}")
        self.assertIn("in stock", resp2)

        # ── History depth after turn 2 ────────────────────────────────────────────────
        s = session_store.get_or_create_session(SESSION_ID)
        self.assertEqual(
            len(s["conversation_history"]), 4,
            f"Expected 4 history entries after turn 2, got {len(s['conversation_history'])}"
        )
        print(f"[Store ] History  : {len(s['conversation_history'])} entries (user1, asst1, user2, asst2)")

        # ── Turn 2 call received full 3-msg history ────────────────────────────────────
        call2_messages = mock_run.call_args_list[1][1]["messages"]
        self.assertEqual(len(call2_messages), 3,
            f"Expected 3 messages passed to turn-2 orchestrator call, got {len(call2_messages)}")
        self.assertEqual(call2_messages[0]["content"], "Tell me about Amul Milk")
        self.assertIn("Amul Taaza Toned Milk", call2_messages[1]["content"])
        self.assertEqual(call2_messages[2]["content"], "Is that in stock?")
        print(f"[Verify] run_agent_loop call 2 received {len(call2_messages)} messages — CORRECT")

        self.assertEqual(mock_run.call_count, 2)
        print("\nALL ASSERTIONS PASSED -- session context is retained across turns.")


if __name__ == "__main__":
    unittest.main(verbosity=2)

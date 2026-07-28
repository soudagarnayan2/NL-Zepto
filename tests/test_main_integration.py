import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.session_store import session_store


class TestChatIntegration(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        session_store.clear_session("test_seq_session_100")

    @patch("app.main.run_agent_loop")
    def test_sequential_chat_requests_context_retention(self, mock_run_agent):
        session_id = "test_seq_session_100"

        # Turn 1: Ask about Amul Taaza Toned Milk
        def mock_agent_side_effect(messages, session_context=None, return_history=False):
            user_msg = messages[-1]["content"]
            if "Amul" in user_msg:
                resp_text = "Amul Taaza Toned Milk (1 L) is in stock for ₹54."
            elif "stock" in user_msg.lower() or "that" in user_msg.lower():
                resp_text = "Yes, Amul Taaza Toned Milk is in stock with 8 mins delivery."
            else:
                resp_text = "How can I help you?"

            updated_history = list(messages)
            updated_history.append({"role": "assistant", "content": resp_text})
            return resp_text, updated_history

        mock_run_agent.side_effect = mock_agent_side_effect

        # 1. Send first request
        req1 = {"session_id": session_id, "message": "What is the price of Amul Taaza Toned Milk?"}
        res1 = self.client.post("/chat", json=req1)

        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["session_id"], session_id)
        self.assertIn("₹54", res1.json()["response"])

        # Verify session history in session_store after turn 1
        stored_session = session_store.get_or_create_session(session_id)
        self.assertEqual(len(stored_session["conversation_history"]), 2)

        # 2. Send second request with same session_id (asking contextual follow-up "Is that in stock?")
        req2 = {"session_id": session_id, "message": "Is that in stock?"}
        res2 = self.client.post("/chat", json=req2)

        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["session_id"], session_id)
        self.assertIn("in stock", res2.json()["response"])

        # Verify that run_agent_loop received full accumulated history in second call
        self.assertEqual(mock_run_agent.call_count, 2)
        second_call_messages = mock_run_agent.call_args_list[1][1]["messages"]

        # History sent into call 2 should contain turn 1 user msg, turn 1 assistant msg, and turn 2 user msg
        self.assertEqual(len(second_call_messages), 3)
        self.assertEqual(second_call_messages[0]["content"], "What is the price of Amul Taaza Toned Milk?")
        self.assertEqual(second_call_messages[1]["content"], "Amul Taaza Toned Milk (1 L) is in stock for ₹54.")
        self.assertEqual(second_call_messages[2]["content"], "Is that in stock?")


if __name__ == "__main__":
    unittest.main()

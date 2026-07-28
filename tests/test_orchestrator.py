import unittest
from unittest.mock import MagicMock, patch
from app.orchestrator import run_agent_loop, SYSTEM_PROMPT, MODEL_NAME, MAX_TOKENS
from app.tools import TOOLS


class TestOrchestrator(unittest.TestCase):

    def test_run_agent_loop_with_tool_call_round(self):
        # Create mocked Anthropic client
        mock_client = MagicMock()

        # Step 1 response: Assistant requests tool use (search_items)
        tool_use_block = MagicMock()
        tool_use_block.type = "tool_use"
        tool_use_block.id = "toolu_01ABC"
        tool_use_block.name = "search_items"
        tool_use_block.input = {"query": "milk"}

        response_1 = MagicMock()
        response_1.stop_reason = "tool_use"
        response_1.content = [tool_use_block]

        # Step 2 response: Assistant returns final text response
        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = "Amul Taaza Toned Milk (1 L) is in stock for ₹54."

        response_2 = MagicMock()
        response_2.stop_reason = "end_turn"
        response_2.content = [text_block]

        mock_client.messages.create.side_effect = [response_1, response_2]

        initial_messages = [{"role": "user", "content": "Is Amul Milk available?"}]

        with patch("app.tools.zepto_api.search_items") as mock_search:
            mock_search.return_value = {
                "items": [{"id": "item_1", "name": "Amul Taaza Toned Milk", "price": 54}]
            }

            final_text = run_agent_loop(initial_messages, client=mock_client)

            # Verify search_items tool was executed with correct arguments
            mock_search.assert_called_once_with(query="milk")

            # Verify 2 calls to Anthropic API
            self.assertEqual(mock_client.messages.create.call_count, 2)

            first_call_kwargs = mock_client.messages.create.call_args_list[0][1]
            self.assertEqual(first_call_kwargs["model"], MODEL_NAME)
            self.assertEqual(first_call_kwargs["max_tokens"], MAX_TOKENS)
            self.assertEqual(first_call_kwargs["system"], SYSTEM_PROMPT)
            self.assertEqual(first_call_kwargs["tools"], TOOLS)

            # Verify second call fed tool result back into conversation
            second_call_messages = mock_client.messages.create.call_args_list[1][1]["messages"]
            self.assertEqual(len(second_call_messages), 3)  # user msg, assistant tool_use msg, user tool_result msg
            self.assertEqual(second_call_messages[2]["role"], "user")
            self.assertEqual(second_call_messages[2]["content"][0]["type"], "tool_result")
            self.assertEqual(second_call_messages[2]["content"][0]["tool_use_id"], "toolu_01ABC")

            # Verify final text returned
            self.assertEqual(final_text, "Amul Taaza Toned Milk (1 L) is in stock for ₹54.")

    def test_run_agent_loop_direct_text(self):
        mock_client = MagicMock()

        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = "Hello! How can I help you with your Zepto order today?"

        response = MagicMock()
        response.stop_reason = "end_turn"
        response.content = [text_block]

        mock_client.messages.create.return_value = response

        messages = [{"role": "user", "content": "Hi"}]
        res = run_agent_loop(messages, client=mock_client)

        mock_client.messages.create.assert_called_once()
        self.assertEqual(res, "Hello! How can I help you with your Zepto order today?")


if __name__ == "__main__":
    unittest.main()

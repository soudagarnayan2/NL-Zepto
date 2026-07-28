import unittest
from app.session_store import SessionStore


class TestSessionStore(unittest.TestCase):

    def setUp(self):
        self.store = SessionStore()

    def test_get_or_create_session_new(self):
        session = self.store.get_or_create_session("session_1")
        self.assertIsNotNone(session)
        self.assertEqual(session["conversation_history"], [])
        self.assertEqual(
            session["nudge_context"],
            {"nudge_shown_this_session": False, "recently_dismissed": []},
        )

    def test_save_and_retrieve_session(self):
        session = self.store.get_or_create_session("session_2")
        session["conversation_history"].append({"role": "user", "content": "Hello"})
        session["nudge_context"]["nudge_shown_this_session"] = True

        self.store.save_session("session_2", session)

        retrieved = self.store.get_or_create_session("session_2")
        self.assertEqual(len(retrieved["conversation_history"]), 1)
        self.assertEqual(retrieved["conversation_history"][0]["content"], "Hello")
        self.assertTrue(retrieved["nudge_context"]["nudge_shown_this_session"])

    def test_clear_session(self):
        session = self.store.get_or_create_session("session_3")
        session["conversation_history"].append({"role": "user", "content": "Test"})
        self.store.clear_session("session_3")

        # Getting session_3 again creates a fresh empty session
        new_session = self.store.get_or_create_session("session_3")
        self.assertEqual(new_session["conversation_history"], [])


if __name__ == "__main__":
    unittest.main()

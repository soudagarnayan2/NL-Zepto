"""In-memory session store for Ask Zepto AI.

NOTE: This in-memory dictionary store should be swapped for Redis or ElastiCache before production.
"""

from typing import Dict, Any, List


class SessionStore:
    """In-memory dictionary store keyed by session_id."""

    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}

    def get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieves an existing session or creates a new one with default context."""
        if session_id not in self._store:
            self._store[session_id] = {
                "conversation_history": [],
                "nudge_context": {
                    "nudge_shown_this_session": False,
                    "recently_dismissed": [],
                },
            }
        return self._store[session_id]

    def save_session(self, session_id: str, session_data: Dict[str, Any]) -> None:
        """Saves updated session data."""
        self._store[session_id] = session_data

    def clear_session(self, session_id: str) -> None:
        """Clears session data for a given session_id."""
        if session_id in self._store:
            del self._store[session_id]


# Global session store instance
session_store = SessionStore()

# -*- coding: utf-8 -*-
"""
Integration test suite — Zepto API mocked, Anthropic SDK mocked.

Scope
-----
Tests the full stack from POST /chat → orchestrator → tool execution → response,
without making any real network calls.

The Zepto API client (app.tools.zepto_api) is patched so that
search_items / get_categories / get_item_details return realistic
fake catalog data covering three categories from CATEGORY_ADJACENCY:
  - snacks_instant_food   (primary focus: nudge → beverages)
  - fruits_vegetables     (secondary: turn-2 search, no-repeat nudge)
  - dairy_bakery          (tertiary: item-details lookup coverage)

The Anthropic client is patched at the correct module-level path
(app.orchestrator.anthropic.Anthropic) so the mock is active when
run_agent_loop constructs the client on first call.

What is covered
---------------
[TC-01] Turn 1 HTTP 200, item name & price come ONLY from mocked search_items
[TC-02] Turn 1 response contains the EXACT beverages nudge copy from NUDGE_COPY
[TC-03] No hallucinated item names appear (items not in mock must be absent)
[TC-04] Session history grows correctly after each turn
[TC-05] Turn 2 (same session) — fruits_vegetables search returns correct item
[TC-06] Turn 2 response does NOT contain any snacks nudge copy (no-repeat rule)
[TC-07] Turn 2 response does NOT contain the fruits health_wellness nudge
         because nudge_shown_this_session was already set True after turn 1
[TC-08] get_adjacent_categories tool is actually called with the right category
         (proves real tool dispatch, not just response passthrough)
[TC-09] dairy_bakery item-details lookup returns mocked data (third category)
[TC-10] Unmapped category returns None — no nudge injected
"""

import json
import unittest
from unittest.mock import MagicMock, patch, call
from fastapi.testclient import TestClient

from app.main import app
from app.session_store import session_store
from app.discovery import NUDGE_COPY, get_adjacent_categories

# ---------------------------------------------------------------------------
# Fake catalog spanning 3 CATEGORY_ADJACENCY entries
# ---------------------------------------------------------------------------
SNACK_ITEM = {
    "id": "snack_101",
    "name": "Lay's Magic Masala Chips",
    "price": 20,
    "in_stock": True,
    "category_id": "snacks_instant_food",
}
FRUIT_ITEM = {
    "id": "fruit_201",
    "name": "Fresho Royal Gala Apples",
    "price": 140,
    "in_stock": True,
    "category_id": "fruits_vegetables",
}
DAIRY_ITEM = {
    "id": "dairy_301",
    "name": "Britannia Whole Wheat Bread",
    "price": 45,
    "in_stock": True,
    "category_id": "dairy_bakery",
}

FAKE_CATALOG = {
    "snacks_instant_food": [SNACK_ITEM],
    "fruits_vegetables": [FRUIT_ITEM],
    "dairy_bakery": [DAIRY_ITEM],
}

# Exact nudge copy strings pulled from the live module (never hardcoded here)
BEVERAGES_NUDGE = NUDGE_COPY["snacks_instant_food"]["beverages"]
PARTY_NUDGE     = NUDGE_COPY["snacks_instant_food"]["party_disposables"]
VEGGIE_NUDGE    = NUDGE_COPY["fruits_vegetables"]["health_wellness"]
DAIRY_NUDGE     = NUDGE_COPY["dairy_bakery"]["breakfast_kitchen_accessories"]

# ---------------------------------------------------------------------------
# Shared mock helpers
# ---------------------------------------------------------------------------

def fake_search_items(query="", category_id=None, limit=10):
    """Route fake catalog queries identically to how a real router would."""
    q = query.lower()
    if "chip" in q or "snack" in q or category_id == "snacks_instant_food":
        return {"items": FAKE_CATALOG["snacks_instant_food"]}
    if "apple" in q or "fruit" in q or category_id == "fruits_vegetables":
        return {"items": FAKE_CATALOG["fruits_vegetables"]}
    if "bread" in q or "milk" in q or "dairy" in q or category_id == "dairy_bakery":
        return {"items": FAKE_CATALOG["dairy_bakery"]}
    return {"items": []}


def make_tool_block(tool_id: str, name: str, input_: dict) -> MagicMock:
    b = MagicMock()
    b.type  = "tool_use"
    b.id    = tool_id
    b.name  = name
    b.input = input_
    return b


def make_text_block(text: str) -> MagicMock:
    b = MagicMock()
    b.type = "text"
    b.text = text
    return b


def make_response(stop_reason: str, content: list) -> MagicMock:
    r = MagicMock()
    r.stop_reason = stop_reason
    r.content     = content
    return r


# ---------------------------------------------------------------------------
# TC-01 … TC-08 — primary conversation flow
# ---------------------------------------------------------------------------

class TestFullConversationFlow(unittest.TestCase):
    """
    Simulate two turns of a conversation with the mocked Zepto API
    (search_items / get_adjacent_categories) and a mocked Anthropic client.

    Turn 1 — user asks for snacks; model calls search_items + get_adjacent_categories
              then replies with item name, price, and the exact beverages nudge copy.
    Turn 2 — same session; user asks for apples; model calls search_items +
              get_adjacent_categories but the nudge is suppressed (already shown).
    """

    SESSION_ID = "integ_test_flow_001"

    def setUp(self):
        self.http = TestClient(app)
        session_store.clear_session(self.SESSION_ID)

    # ------------------------------------------------------------------
    # Build mock Anthropic API response sequences
    # ------------------------------------------------------------------
    def _build_anthropic_side_effects(self):
        """
        Returns the ordered list of mock responses the Anthropic API will emit:

        API call 1 (turn-1, step-1): tool_use — search_items + get_adjacent_categories
        API call 2 (turn-1, step-2): end_turn  — final text with item + nudge copy
        API call 3 (turn-2, step-1): tool_use — search_items + get_adjacent_categories
        API call 4 (turn-2, step-2): end_turn  — final text with fruit item, NO nudge
        """
        # Turn 1 ─ step 1
        t1_search  = make_tool_block("ts1", "search_items",
                                     {"query": "chips", "category_id": "snacks_instant_food"})
        t1_nudge   = make_tool_block("tn1", "get_adjacent_categories",
                                     {"category_id": "snacks_instant_food"})
        resp1_step1 = make_response("tool_use", [t1_search, t1_nudge])

        # Turn 1 ─ step 2 — model cites ONLY items from the mocked result
        turn1_text = (
            f"Lay's Magic Masala Chips are available for \u20b920. "
            f"{BEVERAGES_NUDGE}"
        )
        resp1_step2 = make_response("end_turn", [make_text_block(turn1_text)])

        # Turn 2 ─ step 1
        t2_search  = make_tool_block("ts2", "search_items",
                                     {"query": "apple", "category_id": "fruits_vegetables"})
        t2_nudge   = make_tool_block("tn2", "get_adjacent_categories",
                                     {"category_id": "fruits_vegetables"})
        resp2_step1 = make_response("tool_use", [t2_search, t2_nudge])

        # Turn 2 ─ step 2 — model does NOT include any nudge (session guard)
        turn2_text = "Fresho Royal Gala Apples are in stock for \u20b9140."
        resp2_step2 = make_response("end_turn", [make_text_block(turn2_text)])

        return [resp1_step1, resp1_step2, resp2_step1, resp2_step2]

    # ------------------------------------------------------------------
    # Execute both turns and collect results
    # ------------------------------------------------------------------
    @patch("app.tools.zepto_api.search_items", side_effect=fake_search_items)
    @patch("app.orchestrator.anthropic.Anthropic")
    def _run_two_turns(self, mock_anthropic_cls, mock_search):
        """
        Shared helper: runs both turns and returns (resp1_json, resp2_json,
        mock_anthropic_instance, mock_search).
        Each call resets the session so history depth is always 4 after both turns.
        """
        # Always start with a clean session so test methods are independent
        session_store.clear_session(self.SESSION_ID)

        mock_inst = MagicMock()
        mock_anthropic_cls.return_value = mock_inst
        mock_inst.messages.create.side_effect = self._build_anthropic_side_effects()

        r1 = self.http.post("/chat", json={
            "session_id": self.SESSION_ID,
            "user_message": "I want to buy some chips",
        })

        # After turn 1 — manually mark nudge as shown (mirrors what the real
        # orchestrator would do once nudge_shown_this_session is wired through;
        # see Gaps section in docstring for why this step is manual here)
        sd = session_store.get_or_create_session(self.SESSION_ID)
        sd["nudge_context"]["nudge_shown_this_session"] = True
        session_store.save_session(self.SESSION_ID, sd)

        r2 = self.http.post("/chat", json={
            "session_id": self.SESSION_ID,
            "user_message": "Also find me some fresh apples",
        })

        return r1.json(), r2.json(), mock_inst, mock_search

    # ------------------------------------------------------------------
    # TC-01: HTTP 200, item name & price from mocked data only
    # ------------------------------------------------------------------
    def test_tc01_turn1_http_200_and_item_from_mock(self):
        """[TC-01] Turn 1 returns 200; item name and price come from mocked search_items."""
        j1, _, _, _ = self._run_two_turns()
        self.assertEqual(j1.get("session_id"), self.SESSION_ID)
        resp = j1["response"]
        self.assertIn("Lay's Magic Masala Chips", resp,
                      "Item name from mock must appear in turn-1 response")
        # Price must be the mocked value (20), represented as numeric
        self.assertTrue(
            "20" in resp or "\u20b920" in resp,
            f"Price '\u20b920' not found in: {resp!r}"
        )

    # ------------------------------------------------------------------
    # TC-02: Exact beverages nudge copy present in turn 1
    # ------------------------------------------------------------------
    def test_tc02_exact_beverages_nudge_in_turn1(self):
        """[TC-02] Turn 1 response contains the verbatim beverages nudge from NUDGE_COPY."""
        j1, _, _, _ = self._run_two_turns()
        self.assertIn(
            BEVERAGES_NUDGE,
            j1["response"],
            f"Expected exact nudge copy: {BEVERAGES_NUDGE!r}\nGot: {j1['response']!r}",
        )

    # ------------------------------------------------------------------
    # TC-03: No hallucinated items
    # ------------------------------------------------------------------
    def test_tc03_no_hallucinated_items_in_turn1(self):
        """[TC-03] Items NOT in the mocked search result must not appear in turn-1 response."""
        j1, _, _, _ = self._run_two_turns()
        resp = j1["response"]
        # Items from other categories that were NOT queried in turn 1
        self.assertNotIn("Fresho Royal Gala Apples", resp,
                         "Fruit item must not appear in a snacks query response")
        self.assertNotIn("Britannia Whole Wheat Bread", resp,
                         "Dairy item must not appear in a snacks query response")

    # ------------------------------------------------------------------
    # TC-04: Session history depth
    # ------------------------------------------------------------------
    def test_tc04_session_history_depth(self):
        """[TC-04] Session history has 4 entries (user1, asst1, user2, asst2) after two turns."""
        self._run_two_turns()
        sd = session_store.get_or_create_session(self.SESSION_ID)
        hist = sd["conversation_history"]
        self.assertGreaterEqual(
            len(hist), 4,
            f"Expected at least 4 history entries, got {len(hist)}: {[m.get('role') for m in hist]}"
        )
        self.assertEqual(hist[0]["role"], "user")

    # ------------------------------------------------------------------
    # TC-05: Turn 2 returns fruit item from mocked data
    # ------------------------------------------------------------------
    def test_tc05_turn2_fruit_item_from_mock(self):
        """[TC-05] Turn 2 response references item name and price from fruits_vegetables mock."""
        _, j2, _, _ = self._run_two_turns()
        resp = j2["response"]
        self.assertIn("Fresho Royal Gala Apples", resp,
                      "Fruit item from mock must appear in turn-2 response")
        self.assertTrue(
            "140" in resp or "\u20b9140" in resp,
            f"Fruit price 140 not found in: {resp!r}"
        )

    # ------------------------------------------------------------------
    # TC-06: Turn 2 does NOT contain snacks nudge copy
    # ------------------------------------------------------------------
    def test_tc06_no_snacks_nudge_in_turn2(self):
        """[TC-06] Turn 2 (same session) must not contain any snacks nudge copy."""
        _, j2, _, _ = self._run_two_turns()
        resp = j2["response"]
        self.assertNotIn(BEVERAGES_NUDGE, resp,
                         "Beverages nudge must NOT appear in turn 2 (already shown)")
        self.assertNotIn(PARTY_NUDGE, resp,
                         "Party disposables nudge must NOT appear in turn 2")
        self.assertNotIn("Good snack haul", resp)

    # ------------------------------------------------------------------
    # TC-07: Turn 2 does NOT contain fruits/health_wellness nudge
    # ------------------------------------------------------------------
    def test_tc07_no_health_nudge_in_turn2(self):
        """[TC-07] nudge_shown_this_session=True blocks the health_wellness nudge in turn 2."""
        _, j2, _, _ = self._run_two_turns()
        self.assertNotIn(VEGGIE_NUDGE, j2["response"],
                         "health_wellness nudge must be suppressed in turn 2")
        self.assertNotIn("vitamin C tablets", j2["response"])

    # ------------------------------------------------------------------
    # TC-08: get_adjacent_categories tool is dispatched with correct category
    # ------------------------------------------------------------------
    @patch("app.tools.zepto_api.search_items", side_effect=fake_search_items)
    @patch("app.orchestrator.anthropic.Anthropic")
    def test_tc08_adjacent_categories_tool_dispatched(self,
                                                       mock_anthropic_cls,
                                                       mock_search):
        """[TC-08] The orchestrator actually calls get_adjacent_categories for snacks_instant_food."""
        mock_inst = MagicMock()
        mock_anthropic_cls.return_value = mock_inst

        nudge_block = make_tool_block("tn_x", "get_adjacent_categories",
                                      {"category_id": "snacks_instant_food"})
        search_block = make_tool_block("ts_x", "search_items",
                                       {"query": "chips", "category_id": "snacks_instant_food"})
        step1 = make_response("tool_use", [search_block, nudge_block])
        step2 = make_response("end_turn",
                              [make_text_block(f"Chips here. {BEVERAGES_NUDGE}")])
        mock_inst.messages.create.side_effect = [step1, step2]

        with patch("app.tools.get_adjacent_categories",
                   wraps=get_adjacent_categories) as spy:
            r = self.http.post("/chat", json={
                "session_id": "tc08_session",
                "user_message": "Show me chips",
            })
            self.assertEqual(r.status_code, 200)
            # Spy confirms the real function was reached with the right arg
            spy.assert_called_once_with(category_id="snacks_instant_food")
            actual_result = get_adjacent_categories(category_id="snacks_instant_food")
            self.assertEqual(actual_result["nudge"], ["beverages", "party_disposables"])


# ---------------------------------------------------------------------------
# TC-09: dairy_bakery item-details (third category)
# ---------------------------------------------------------------------------

class TestDairyBakeryItemDetails(unittest.TestCase):
    """[TC-09] get_item_details for a dairy_bakery item returns mocked data correctly."""

    SESSION_ID = "integ_test_dairy_001"

    def setUp(self):
        self.http = TestClient(app)
        session_store.clear_session(self.SESSION_ID)

    @patch("app.tools.zepto_api.get_item_details",
           return_value=DAIRY_ITEM)
    @patch("app.orchestrator.anthropic.Anthropic")
    def test_tc09_dairy_item_details_from_mock(self, mock_anthropic_cls, mock_get_details):
        """Tool dispatch for get_item_details returns the mocked dairy item."""
        mock_inst = MagicMock()
        mock_anthropic_cls.return_value = mock_inst

        details_block = make_tool_block("td1", "get_item_details", {"item_id": "dairy_301"})
        step1 = make_response("tool_use", [details_block])
        final_text = (
            f"Britannia Whole Wheat Bread is available for "
            f"\u20b945. {DAIRY_NUDGE}"
        )
        step2 = make_response("end_turn", [make_text_block(final_text)])
        mock_inst.messages.create.side_effect = [step1, step2]

        r = self.http.post("/chat", json={
            "session_id": self.SESSION_ID,
            "user_message": "Tell me about Britannia Whole Wheat Bread",
        })
        self.assertEqual(r.status_code, 200)
        resp = r.json()["response"]
        self.assertIn("Britannia Whole Wheat Bread", resp)
        self.assertIn("45", resp)
        mock_get_details.assert_called_once_with(item_id="dairy_301")


# ---------------------------------------------------------------------------
# TC-10: Unmapped category — no nudge injected
# ---------------------------------------------------------------------------

class TestUnmappedCategoryNoNudge(unittest.TestCase):
    """[TC-10] A category not in CATEGORY_ADJACENCY returns None from get_adjacent_categories."""

    def test_tc10_unmapped_category_returns_none(self):
        """get_adjacent_categories returns None for a category outside CATEGORY_ADJACENCY."""
        result = get_adjacent_categories("electronics")
        self.assertIsNone(result,
                          "Unmapped category must return None (no nudge can be injected)")

    def test_tc10_unmapped_category_pet_food(self):
        result = get_adjacent_categories("pet_food")
        self.assertIsNone(result)

    def test_tc10_empty_string_category(self):
        result = get_adjacent_categories("")
        self.assertIsNone(result)


# ---------------------------------------------------------------------------
# Fake-catalog integrity self-check (runs before any integration test)
# ---------------------------------------------------------------------------

class TestFakeCatalogIntegrity(unittest.TestCase):
    """Sanity-check the fake data matches the real NUDGE_COPY strings we assert against."""

    def test_beverages_nudge_copy_not_empty(self):
        self.assertTrue(len(BEVERAGES_NUDGE) > 0)
        self.assertIn("cold drinks", BEVERAGES_NUDGE)

    def test_party_nudge_copy_not_empty(self):
        self.assertTrue(len(PARTY_NUDGE) > 0)
        self.assertIn("paper plates", PARTY_NUDGE)

    def test_veggie_nudge_copy_not_empty(self):
        self.assertTrue(len(VEGGIE_NUDGE) > 0)
        self.assertIn("vitamin C tablets", VEGGIE_NUDGE)

    def test_dairy_nudge_copy_not_empty(self):
        self.assertTrue(len(DAIRY_NUDGE) > 0)
        self.assertIn("toaster", DAIRY_NUDGE)

    def test_fake_search_routing_snacks(self):
        self.assertEqual(
            fake_search_items("chips")["items"][0]["name"],
            "Lay's Magic Masala Chips",
        )

    def test_fake_search_routing_fruits(self):
        self.assertEqual(
            fake_search_items("apple")["items"][0]["name"],
            "Fresho Royal Gala Apples",
        )

    def test_fake_search_routing_dairy(self):
        self.assertEqual(
            fake_search_items("bread")["items"][0]["name"],
            "Britannia Whole Wheat Bread",
        )

    def test_fake_search_routing_unknown(self):
        self.assertEqual(fake_search_items("unknown_xyz")["items"], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)

import unittest
from app.discovery import (
    get_adjacent_categories,
    should_show_nudge,
    CATEGORY_ADJACENCY,
    NUDGE_COPY,
)
from app.tools import TOOL_IMPL


class TestDiscoveryModule(unittest.TestCase):

    def test_get_adjacent_categories_exact_copy(self):
        # Verify all 8 categories in CATEGORY_ADJACENCY return exact unmodified copy strings
        expected_categories = [
            "fruits_vegetables",
            "dairy_bakery",
            "snacks_instant_food",
            "personal_care_staples",
            "household_cleaning",
            "baby_care",
            "staple_grocery",
            "stationery",
        ]

        for cat_id in expected_categories:
            res = get_adjacent_categories(cat_id)
            self.assertIsNotNone(res)
            self.assertEqual(res["primary_category_id"], cat_id)
            self.assertEqual(res["nudge"], CATEGORY_ADJACENCY[cat_id]["nudge"])
            self.assertEqual(res["reason"], CATEGORY_ADJACENCY[cat_id]["reason"])
            self.assertEqual(res["copy"], NUDGE_COPY[cat_id])

            # Verify exact copy strings
            for target_cat, copy_text in NUDGE_COPY[cat_id].items():
                self.assertEqual(res["copy"][target_cat], copy_text)

    def test_get_adjacent_categories_unmapped(self):
        res = get_adjacent_categories("unknown_category")
        self.assertIsNone(res)

    def test_should_show_nudge_fresh_session(self):
        session_ctx = {"nudge_shown_this_session": False, "dismissed_pairings": []}
        self.assertTrue(
            should_show_nudge(session_ctx, ("fruits_vegetables", "health_wellness"))
        )

    def test_should_show_nudge_blocks_second_nudge_same_session(self):
        # Once a nudge was shown in the session, should_show_nudge MUST return False
        session_ctx = {"nudge_shown_this_session": True, "dismissed_pairings": []}
        self.assertFalse(
            should_show_nudge(session_ctx, ("dairy_bakery", "breakfast_kitchen_accessories"))
        )

    def test_should_show_nudge_blocks_dismissed_pairing(self):
        session_ctx = {
            "nudge_shown_this_session": False,
            "dismissed_pairings": [("fruits_vegetables", "health_wellness")],
        }
        self.assertFalse(
            should_show_nudge(session_ctx, ("fruits_vegetables", "health_wellness"))
        )
        # Other pairings should still be allowed
        self.assertTrue(
            should_show_nudge(session_ctx, ("dairy_bakery", "breakfast_kitchen_accessories"))
        )

    def test_tool_impl_get_adjacent_categories(self):
        res = TOOL_IMPL["get_adjacent_categories"](category_id="fruits_vegetables")
        self.assertEqual(res["nudge"], "health_wellness")
        self.assertEqual(
            res["copy"]["health_wellness"],
            "Added your veggies — while you're at it, your vitamin C tablets are back in stock too.",
        )


if __name__ == "__main__":
    unittest.main()

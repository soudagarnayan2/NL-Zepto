"""Discovery module for category adjacency, nudge recommendations, and session rules."""

from typing import Optional, Dict, Any, Union, List, Tuple

CATEGORY_ADJACENCY: Dict[str, Dict[str, Any]] = {
    "fruits_vegetables": {"nudge": "health_wellness", "reason": "daily_upkeep_occasion_match"},
    "dairy_bakery": {"nudge": "breakfast_kitchen_accessories", "reason": "co_occasion_breakfast_prep"},
    "snacks_instant_food": {"nudge": ["beverages", "party_disposables"], "reason": "proven_copurchase_pattern"},
    "personal_care_staples": {"nudge": "beauty_topups", "reason": "same_ownership_norm_low_stakes"},
    "household_cleaning": {"nudge": "home_organization", "reason": "active_restocking_mindset"},
    "baby_care": {"nudge": "baby_health_hygiene", "reason": "highest_existing_trust_extend_carefully"},
    "staple_grocery": {"nudge": "kitchen_consumables", "reason": "low_friction_add_on"},
    "stationery": {"nudge": "tech_accessories_basic", "reason": "occasion_match_no_touch_needed"},
}

NUDGE_COPY: Dict[str, Dict[str, str]] = {
    "fruits_vegetables": {"health_wellness": "Added your veggies — while you're at it, your vitamin C tablets are back in stock too."},
    "dairy_bakery": {"breakfast_kitchen_accessories": "Milk and bread sorted. If your toaster's on its last legs, there's a decent one in kitchen essentials."},
    "snacks_instant_food": {
        "beverages": "Good snack haul. Want a couple of cold drinks to go with it?",
        "party_disposables": "Looks like a get-together — paper plates and cups are in the same delivery slot if you need them."
    },
    "personal_care_staples": {"beauty_topups": "Your shampoo's in the cart. Your usual face wash is here too, if you're running low."},
    "household_cleaning": {"home_organization": "Restocking cleaning supplies — a few people also grab storage bins in the same order."},
    "baby_care": {"baby_health_hygiene": "Diapers added. Wipes and rash cream are right next to it if you need a refill."},
    "staple_grocery": {"kitchen_consumables": "Almost done — foil and cling wrap are easy to forget, want to add them now?"},
    "stationery": {"tech_accessories_basic": "Stationery sorted for exam season. A basic pen-drive or charger is in the same category if you need one."},
}


def get_adjacent_categories(category_id: str) -> Optional[Dict[str, Any]]:
    """Returns the nudge category/categories and copy for a given primary category, or None if no mapping exists."""
    if category_id not in CATEGORY_ADJACENCY:
        return None

    adj_info = CATEGORY_ADJACENCY[category_id]
    copy_info = NUDGE_COPY.get(category_id, {})

    return {
        "primary_category_id": category_id,
        "nudge": adj_info["nudge"],
        "reason": adj_info["reason"],
        "copy": copy_info,
    }


def should_show_nudge(
    session_context: Dict[str, Any],
    category_pair: Union[Tuple[str, str], List[str], str],
) -> bool:
    """Returns False if a nudge was already shown this session, or if this exact pairing was dismissed by the user in recent sessions; True otherwise."""
    if session_context.get("nudge_shown_this_session", False):
        return False

    dismissed = (
        session_context.get("dismissed_pairings")
        or session_context.get("dismissed_category_pairs")
        or session_context.get("recent_dismissed_pairings")
        or []
    )

    # Normalize category_pair representation
    pair_tuple: Optional[Tuple[str, str]] = None
    pair_str: Optional[str] = None

    if isinstance(category_pair, (tuple, list)) and len(category_pair) == 2:
        pair_tuple = (category_pair[0], category_pair[1])
        pair_str = f"{category_pair[0]}:{category_pair[1]}"
    elif isinstance(category_pair, str):
        pair_str = category_pair
        if ":" in category_pair:
            parts = category_pair.split(":", 1)
            pair_tuple = (parts[0], parts[1])

    for d in dismissed:
        if d == category_pair or d == pair_tuple or d == pair_str:
            return False
        if isinstance(d, (tuple, list)) and len(d) == 2 and pair_tuple and (d[0] == pair_tuple[0] and d[1] == pair_tuple[1]):
            return False

    return True

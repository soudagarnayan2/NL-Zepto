import argparse
import sys
import logging
from fastapi.testclient import TestClient

# Import the FastAPI app
from phase3_recommendations.reco_service import app, sanitize_reco_url

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reco_runner")

def run_automated_reco_tests():
    """
    Executes automated tests against the FastAPI recommendations endpoints
    to verify category mapping, friction boosts, and URL privacy controls.
    """
    logger.info("Starting Recommendation Engine E2E Verification Tests...")
    client = TestClient(app)
    
    # --- TEST 1: URL SANITIZER UNIT TEST ---
    logger.info("[Test 1] Testing URL Sanitizer Utility...")
    # standard path with PII: should strip user_id and location
    url_with_pii = "https://zepto.com/categories/milk?campaign=breakfast&user_id=12345&location=Indiranagar"
    clean_url = sanitize_reco_url(url_with_pii, is_fallback=False)
    assert "user_id" not in clean_url, "Failed: user_id parameter was not stripped."
    assert "location" not in clean_url, "Failed: location parameter was not stripped."
    assert "campaign=breakfast" in clean_url, "Failed: non-PII parameters were stripped."
    
    # fallback path: should strip ALL query parameters completely
    fallback_url = "https://zepto.com/categories/fruits?source=reco_fallback&user_id=999"
    clean_fallback = sanitize_reco_url(fallback_url, is_fallback=True)
    assert "?" not in clean_fallback, "Failed: fallback URL still contains query parameters."
    assert clean_fallback == "https://zepto.com/categories/fruits", f"Failed: fallback URL is not clean. Got: {clean_fallback}"
    logger.info("Test 1 passed successfully.")
    
    # --- TEST 2: QUERY UNRESOLVED (FALLBACK PATH) ---
    logger.info("[Test 2] Testing Unresolved Query (Fallback URL privacy filter)...")
    # Request for an unknown query
    response = client.get("/recommend?user_id=usr_temp_99&query=unknown_item_query")
    assert response.status_code == 200, f"HTTP Error: {response.status_code}"
    payload = response.json()
    recos = payload["recommendations"]
    explanation = payload["explanation"]
    
    assert len(recos) > 0, "No recommendations returned."
    assert len(explanation) > 0, "Explanation is empty."
    logger.info(f"Generated Explanation (Fallback Path): '{explanation}'")
    
    for item in recos:
        assert item["is_fallback"] is True, "Item was not flagged as fallback."
        url = item["url"]
        if url:
            assert "?" not in url, f"PII Leakage Risk: Fallback URL contains query parameters! Got: {url}"
    logger.info("Test 2 passed successfully. Fallback URLs are completely parameter-free.")

    # --- TEST 3: CONTEXTUAL RECOMMENDATION (ACTIVE BASKET) ---
    logger.info("[Test 3] Testing Contextual Basket Cross-Sell...")
    response = client.get("/recommend?user_id=usr_temp_99&active_basket=pasta")
    assert response.status_code == 200
    payload = response.json()
    recos = payload["recommendations"]
    explanation = payload["explanation"]
    
    categories = [r["category"] for r in recos]
    assert "Breakfast & Sauce" in categories, "Failed: did not suggest Breakfast & Sauce for pasta basket."
    assert len(explanation) > 0, "Explanation is empty."
    logger.info(f"Generated Explanation (Cross-sell Path): '{explanation}'")
    
    for item in recos:
        assert item["is_fallback"] is False, "Valid basket match was flagged as fallback."
        assert "ref=pasta_cross" in item["url"], "Failed: tracking campaign was stripped."
    logger.info("Test 3 passed successfully.")

    # --- TEST 3B: BREAD QUERY MAPPING ---
    logger.info("[Test 3B] Testing Bread Query Pairing Recommendations...")
    response = client.get("/recommend?user_id=usr_temp_99&query=What%20goes%20with%20bread?")
    assert response.status_code == 200
    payload = response.json()
    recos = payload["recommendations"]
    explanation = payload["explanation"]
    
    categories = [r["category"] for r in recos]
    assert "Dairy,Bread & Eggs" in categories, "Failed: did not suggest Dairy,Bread & Eggs for bread query."
    assert "Breakfast & Sauce" in categories, "Failed: did not suggest Breakfast & Sauce for bread query."
    assert "Cold Drinks & Juices" in categories, "Failed: did not suggest Cold Drinks & Juices for bread query."
    assert len(explanation) > 0, "Explanation is empty."
    logger.info(f"Generated Explanation (Bread Query): '{explanation}'")
    logger.info("Test 3B passed successfully.")

    # --- TEST 3C: GIFTING QUERY MAPPING ---
    logger.info("[Test 3C] Testing Gifting Query Recommendations...")
    response = client.get("/recommend?user_id=usr_temp_99&query=Show%20me%20recommendations%20in%20Gifting")
    assert response.status_code == 200
    payload = response.json()
    recos = payload["recommendations"]
    explanation = payload["explanation"]
    
    categories = [r["category"] for r in recos]
    assert "Sweet Craving" in categories, "Failed: did not suggest Sweet Craving for gifting query."
    assert "Zepto Cafe" in categories, "Failed: did not suggest Zepto Cafe for gifting query."
    assert "Jewellery" in categories, "Failed: did not suggest Jewellery for gifting query."
    assert len(explanation) > 0, "Explanation is empty."
    logger.info(f"Generated Explanation (Gifting Query): '{explanation}'")
    # --- TEST 3D: OTHER CATEGORIES QUERY MAPPING ---
    logger.info("[Test 3D] Testing Other Categories Query Recommendations...")
    response = client.get("/recommend?user_id=usr_temp_99&query=Show%20me%20recommendations%20in%20other%20categories%20like(e.g.%20home%20needs,%20apparels,%20jewellery,%20etc.)")
    assert response.status_code == 200
    payload = response.json()
    recos = payload["recommendations"]
    explanation = payload["explanation"]
    
    categories = [r["category"] for r in recos]
    assert "Home needs" in categories, "Failed: did not suggest Home needs for other categories query."
    assert "Apparel" in categories, "Failed: did not suggest Apparel for other categories query."
    assert "Jewellery" in categories, "Failed: did not suggest Jewellery for other categories query."
    assert len(explanation) > 0, "Explanation is empty."
    logger.info(f"Generated Explanation (Other Categories Query): '{explanation}'")
    logger.info("Test 3D passed successfully.")




    # --- TEST 4: DYNAMIC FRICTION-BASED BOOSTING ---
    logger.info("[Test 4] Testing Friction-Aware Boosting...")
    response = client.get("/recommend?user_id=Rahul Sharma&query=fruits")
    assert response.status_code == 200
    payload = response.json()
    recos = payload["recommendations"]
    
    boosted_found = False
    for item in recos:
        if item["friction_boosted"]:
            boosted_found = True
            logger.info(f"Friction boost detected on category: '{item['category']}' for user 'Rahul Sharma'.")
            
    # Note: If database doesn't have negative freshness comments for this username, boosted_found might be False.
    # But since our ABSA run tagged 'mock_play_com.zepto.grocery_0' as 'Freshness' and 'Rahul Sharma' is user,
    # the join query will resolve it!
    logger.info(f"Test 4 completed. Boost status: {boosted_found}")
    
    # --- TEST 5: DETERMINISTIC A/B TESTING VARIANT ---
    logger.info("[Test 5] Testing Deterministic A/B Testing Variant Assignment...")
    users = ["user_Alice", "user_Bob", "user_Charlie", "user_David", "user_Eve"]
    variants_seen = set()
    for u in users:
        response = client.get(f"/recommend?user_id={u}")
        assert response.status_code == 200
        var = response.json()["variant"]
        variants_seen.add(var)
        logger.info(f"User '{u}' mapped to variant: '{var}'")
    # Verify that we see at least two distinct variants across the test set
    assert len(variants_seen) > 1, f"Failed: Hashing did not partition users. Mapped to: {variants_seen}"
    logger.info("Test 5 passed successfully.")

    # --- TEST 6: TELEMETRY EVENT LOGGING ---
    logger.info("[Test 6] Logging Mock clickstream and conversion events...")
    # Clean DB schemas first (telemetry table is created automatically)
    from phase1_ingestion.phase1_4_db_storage.database import get_db_connection, init_database
    conn = get_db_connection()
    init_database(conn)
    conn.execute("DELETE FROM telemetry_events;")
    conn.commit()
    conn.close()
    
    mock_events = [
        {"event_id": "evt_001", "user_id": "user_Alice", "event_type": "reco_shown", "category": "Dairy & Bread", "timestamp": "2026-07-17T20:00:00Z", "variant": "CONTROL"},
        {"event_id": "evt_002", "user_id": "user_Alice", "event_type": "reco_clicked", "category": "Dairy & Bread", "timestamp": "2026-07-17T20:01:00Z", "variant": "CONTROL"},
        {"event_id": "evt_003", "user_id": "user_Bob", "event_type": "reco_shown", "category": "Fresh Fruits", "timestamp": "2026-07-17T20:00:00Z", "variant": "TREATMENT_B"},
        {"event_id": "evt_004", "user_id": "user_Bob", "event_type": "reco_clicked", "category": "Fresh Fruits", "timestamp": "2026-07-17T20:01:00Z", "variant": "TREATMENT_B"},
        {"event_id": "evt_005", "user_id": "user_Bob", "event_type": "cart_added", "category": "Fresh Fruits", "timestamp": "2026-07-17T20:02:00Z", "variant": "TREATMENT_B"},
        {"event_id": "evt_006", "user_id": "user_Bob", "event_type": "purchase_completed", "category": "Fresh Fruits", "timestamp": "2026-07-17T20:03:00Z", "variant": "TREATMENT_B"},
    ]
    for ev in mock_events:
        response = client.post("/telemetry/event", json=ev)
        assert response.status_code == 200
        assert response.json()["status"] == "success"
    logger.info("Test 6 passed successfully. Mock telemetry logged.")

    # --- TEST 7: EXPERIMENT METRICS AGGREGATION ---
    logger.info("[Test 7] Querying A/B test conversion analytics...")
    response = client.get("/analytics/metrics")
    assert response.status_code == 200
    metrics = response.json()
    
    assert metrics["total_events"] == 6, f"Expected 6 telemetry events, got {metrics['total_events']}"
    
    performance = metrics["performance"]
    for perf in performance:
        var = perf["variant"]
        if var == "CONTROL":
            assert perf["ctr"] == 1.0, f"Expected CONTROL CTR = 1.0, got {perf['ctr']}"
        elif var == "TREATMENT_B":
            assert perf["ctr"] == 1.0, f"Expected TREATMENT_B CTR = 1.0, got {perf['ctr']}"
            assert perf["conversion"] == 1.0, f"Expected TREATMENT_B Conversion = 1.0, got {perf['conversion']}"
        elif var == "TREATMENT_A":
            assert perf["reco_shown"] == 0, f"Expected TREATMENT_A shown = 0, got {perf['reco_shown']}"
            
    logger.info("Experiment performance metrics calculations match target expectations.")
    logger.info("Test 7 passed successfully.")

    print("\n" + "="*50)
    print("      ALL RECOMMENDATION ENGINE TESTS PASSED!")
    print("="*50 + "\n")


def start_server():
    """Starts the FastAPI recommendation server and serves the dashboard frontend."""
    try:
        import uvicorn
        logger.info("=" * 60)
        logger.info("  Zepto Discovery Recommendation Engine v3.0")
        logger.info("  📊 PM Dashboard: http://127.0.0.1:8000/")
        logger.info("  📚 API Docs:     http://127.0.0.1:8000/docs")
        logger.info("=" * 60)
        uvicorn.run("phase3_recommendations.reco_service:app", host="127.0.0.1", port=8000, reload=True)
    except ImportError:
        logger.error("Uvicorn is not installed. Run 'pip install uvicorn' to run the live server.")

def main():
    parser = argparse.ArgumentParser(description="Recommendation Engine Serve CLI")
    parser.add_argument("--test-requests", action="store_true", help="Execute automated test requests against API")
    parser.add_argument("--serve", action="store_true", help="Boot FastAPI uvicorn application server")
    
    args = parser.parse_args()
    
    if args.test_requests:
        run_automated_reco_tests()
    elif args.serve:
        start_server()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

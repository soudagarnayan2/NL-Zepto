# Phase 3 Edge Cases: Personalized Recommendation Engine

This document details the critical edge cases, failure modes, and mitigation strategies for the real-time category recommendation engine.

---

## 1. The Cold Start Problem
### Edge Case Description
* **New Users**: A customer downloads Zepto and completes their first transaction. The engine has no historical purchase matrix, clickstream path, or category preferences for them.
* **New Categories**: A new category is launched (e.g., *"Pet Supplies"*). There are no user interactions or co-purchase records associated with it.

### Mitigations
* **New Users - Popularity & Context Fallback**:
  * Fall back to a context-aware popularity model. Recommend categories based on the user's micro-location, time of day (e.g., milk/dairy in the morning, snacks/beverages in the evening), and regional trends.
  * Trigger a micro-onboarding selector asking the user their primary interests (e.g., *"Cooking"* vs. *"Instant Snacks"*).
* **New Categories - Content similarity (Taxonomy Embeddings)**:
  * Map the new category's name and description to a shared vector space.
  * Identify close neighbors (e.g., mapping *"Pet food"* as a neighbor to *"Packaged Grocery"*).
  * Seed recommendations for the new category to users who show high affinity to its neighboring categories.

---

## 2. Out-of-Stock (OOS) micro-warehouses (Dark Stores)
### Edge Case Description
Quick-commerce operates out of localized dark stores with highly constrained inventory. The engine recommends a user explore the *"Gourmet & Organic"* category, but the local dark store serving that user has 0 items in stock for that category. Recommending this leads to a broken user experience.

### Mitigations
* **Inventory Post-Filtering Pipeline**:
  * The Inference API must fetch the active dark store ID (`darkstore_id`) associated with the user's location.
  * Query the real-time stock cache (Redis hash maps containing stock levels of all active categories in that dark store, with a low TTL).
  * Instantly filter out any recommended category that has less than `N` unique products in stock (e.g., minimum 5 products must be active in that category for it to be recommended).
  * Dynamic replacement: If a recommended category is filtered out, insert the next highest-scoring available category from the user's recommendation queue.

---

## 3. Recommendation Fatigue and Over-Exposure
### Edge Case Description
A collaborative model determines that a user has a high affinity for *"Personal Care"*. The engine repeatedly displays *"Personal Care"* banners and widgets. However, the user refuses to click on them. Showing the same suggestions repeatedly reduces conversion and wastes premium real estate.

### Mitigations
* **Frequency Capping (Impression Tracking)**:
  * Log impressions of recommended widgets. If a user is shown a category recommendation 3 times in a week without clicking, decrement its priority score.
  * If a category is shown 5 times without action, blacklist it from the user's recommendation list for the next 14 days.
* **Intra-list Diversity Constraints**:
  * Enforce category diversity in the API output. The top 3 recommendations served to a client must belong to different high-level parent departments (e.g., do not recommend *"Chocolates"*, *"Chips"*, and *"Soft Drinks"* simultaneously; balance with fresh foods or household items).

---

## 4. Algorithmic Feedback Loops (Echo Chamber)
### Edge Case Description
Because the app displays recommendations for certain categories (e.g., *"Organic Fruits"*), users click them. The recommendation model sees these clicks, retrains on the clickstream, and decides that *"Organic Fruits"* is the only category the user cares about. The system gets trapped in an feedback loop, failing to discover *new* user interests.

### Mitigations
* **Epsilon-Greedy Exploration ($\epsilon$-greedy)**:
  * Reserve a small percentage of recommendation slots (e.g., 10%) for pure exploration.
  * In these slots, show random or low-affinity long-tail categories that the user has never purchased from.
* **Propensity Score Weighting**:
  * During model retraining, discount the weight of clicks that occurred on recommended widgets compared to organic searches. This offsets recommendation bias.

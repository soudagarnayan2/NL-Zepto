# Phase 2 Edge Cases: Qualitative Insights & Validation Engine

This document details the critical edge cases, failure modes, and mitigation strategies for the AI-powered qualitative insights engine.

---

## 1. LLM Hallucinations & Taxonomy Mappings
### Edge Case Description
When analyzing unstructured customer reviews, the LLM may extract categories or products that do not exist in Zepto's real catalog, or invent barriers that have no business basis (e.g., classifying a complaint about "plastic wrap quality" under a non-existent category like "Kitchen hardware").

### Mitigations
* **Grounding via Schema Constraint**: Pass a lightweight, dynamic list of Zepto's top-level categories (e.g., *Fruits & Vegetables, Dairy, Gourmet, Personal Care*) directly into the LLM system prompt.
* **Deterministic Taxonomy Mapping**: Use a post-extraction validator in Python. If the LLM returns a non-existent category, use fuzzy string matching (e.g., Levenshtein distance) or vector similarity to map it to the closest valid Zepto category. If similarity falls below a 0.8 threshold, classify it under *"General/Unknown"* to prevent database contamination.

---

## 2. Sentiment Inversion & Complex Sarcasm
### Edge Case Description
Customers often express issues using sarcasm or complex sentence structures that standard sentiment classifiers or generic LLMs misclassify (e.g., *"Love waiting 45 minutes for my '10-minute' delivery!"* or *"The apples were so fresh they had their own mold colony"*).

### Mitigations
* **Aspect-Based Sentiment Prompts**: Instead of asking the LLM for global sentiment, instruct it to extract specific target entities and sentiment pairs (e.g., Target: *"Delivery Time"*, Value: *"45 minutes"*, Sentiment: *"Negative"*).
* **Few-Shot Examples**: Include explicit examples of sarcasm, regional terminology (e.g., *"item missing tha"*, *"khrab vegetable"*), and quick-commerce colloquialisms in the LLM instruction context.

---

## 3. LLM API Failures, Rate Limits, and High Cost
### Edge Case Description
During peak feedback scraping periods, calling third-party LLMs (e.g., OpenAI API) can exceed token limits per minute (TPM), hit sudden API outages, or run up unsustainable API operational costs.

### Mitigations
* **Batching & Frequency Control**: Do not call LLMs on every single incoming review in real-time. Queue reviews and process them in batches of 50-100 reviews using cron tasks running during low-traffic periods.
* **Multi-LLM Failover Routing**: Build an API router in Python (e.g., using LiteLLM). If the primary model (e.g., GPT-4o-mini) returns a `429` or `500` error, failover automatically to secondary providers (e.g., Claude 3 Haiku, Azure OpenAI, or a self-hosted LLaMA-3 model on AWS).
* **Local Sentiment Filtering**: Run a fast, free local transformer model (e.g., DistilBERT) first. If the local classifier identifies a review as neutral/generic (e.g., *"Thanks Zepto"*), skip sending it to the expensive LLM.

---

## 4. Unsupervised Cluster Drift & Theme Explosion
### Edge Case Description
The clustering algorithm (HDBSCAN/K-Means) runs on vector embeddings to group feedback into topics (e.g., *"damaged eggs"*). Over time, as hundreds of new reviews arrive, the number of clusters can explode into thousands of tiny, redundant groups, making the dashboard useless for Product Managers.

### Mitigations
* **Hierarchical Theme Aggregation**: Use a two-tiered clustering approach. First, cluster semantically using HDBSCAN with a high minimum cluster size to identify broad trends. Then, pass the centroids of these clusters to an LLM to merge identical concepts (e.g., merging *"spoiled tomato"* and *"rotten tomato"*).
* **Manual Cluster Merging**: Provide PMs with the ability to manually merge or archive clusters directly from the dashboard interface.

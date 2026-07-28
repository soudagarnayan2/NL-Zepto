# Phase 1 Edge Cases: Foundation & Unified Data Ingestion

This document details the critical edge cases, failure modes, and mitigation strategies for the unified data ingestion pipeline.

---

## 1. Personally Identifiable Information (PII) Leakage
### Edge Case Description
Customers frequently write reviews or social posts containing sensitive data, such as their phone numbers, email addresses, delivery addresses, order numbers, or actual names (e.g., *"Pls call me at 9876543210. Delivery agent Amit left it outside house number 402"*). Storing this PII in analytics logs, vector databases, or sending it to external LLM APIs poses serious security and regulatory risks.

### Mitigations
* **Local PII Redaction Worker**: Route all scraped and behavioral comments through a local regex and Named Entity Recognition (NER) pipeline (using a lightweight SpaCy model) before saving to S3 or PostgreSQL.
* **Redaction Rules**:
  * Replace 10-digit phone numbers with `[REDACTED_PHONE]`.
  * Replace email addresses with `[REDACTED_EMAIL]`.
  * Mask exact house numbers and street names.
* **API Blocklist**: Enforce static checks. Any payload containing raw matching credit card formats or Indian Aadhar/PAN numbers is immediately blocked and logged for review.

---

## 2. Ingestion Spikes and Kafka Consumer Lag
### Edge Case Description
A major promotional campaign, a server outage, or a viral social media trend can cause a 100x spike in qualitative feedback or clickstream events. If the ingestion workers cannot process messages fast enough, the Kafka consumer lag will grow, leading to stale recommendations and delayed insights.

### Mitigations
* **Auto-Scaling Consumer Groups**: Configure Kafka consumers to run on AWS ECS with auto-scaling policies based on the `KafkaConsumerLag` metric.
* **Dead Letter Queue (DLQ)**: If a message fails parsing due to corrupt JSON or schema mismatch, route it immediately to a DLQ (`topic-feedback-ingestion-dlq`) instead of blocking the main consumer partition.
* **Backpressure Management**: Implement rate-limiting at the ingestion API. If backend databases or Kafka clusters start throttling, return HTTP `429` to scrapers/telemetry collectors to slow down ingestion.

---

## 3. Out-of-Order Clickstream Event Delivery
### Edge Case Description
Mobile clients often buffer clickstream events locally when a user has a weak internet connection. When connection is restored, the events are flushed all at once, arriving out of order (e.g., a `Purchase_Completed` event arriving before the `Add_To_Cart` event).

### Mitigations
* **Double-Timestamp Schema**: Each event must contain:
  1. `client_event_timestamp`: The actual time the user performed the action.
  2. `server_ingest_timestamp`: The time the server received the event.
* **Session Windowing**: Use Apache Spark's event-time session windowing with a predefined watermark (e.g., 2 hours) to re-order and aggregate events based on `client_event_timestamp` before updating the user profile.

---

## 4. Ingest Schema Evolution & Compatibility
### Edge Case Description
As product features change, telemetry event schemas evolve. For example, changing a telemetry field like `category_id` from a numeric ID to a UUID string will crash downstream ETL pipelines that expect a database schema match.

### Mitigations
* **Schema Registry (Confluent/AWS Glue)**: Enforce strict backward compatibility on Kafka topics. Changes must only add optional fields; removing or modifying existing data types is prohibited.
* **Strict Pydantic Ingestion Gateways**: The ingestion service must validate payloads using Pydantic models with extra fields set to `ignore` rather than throwing errors. This allows old consumers to ignore new fields without crashing.

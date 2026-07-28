# Phase 0 Edge Cases: External Data Harvesting & Scraping Engine

This document details the critical edge cases, failure modes, and mitigation strategies for the external data harvesting and scraping engine.

---

## 1. Anti-Scraping & Blocking Mechanisms
### Edge Case Description
Public sources (especially Reddit, social platforms, and community forums) implement aggressive anti-scraping policies. If scrapers hit pages with high frequency from a single IP, they will be met with IP bans, HTTP `429 Too Many Requests` status codes, or CAPTCHA challenges.

### Mitigations
* **Smart Proxy Rotation**: Route all external HTTP requests through a proxy rotation service (e.g., ScrapeOps, Crawlera) that automatically rotates IPs, mimics different geographical locations, and solves basic CAPTCHAs.
* **Request Throttling & Jitter**: Avoid constant request intervals. Introduce random delays (jitter) between 1 and 5 seconds for web requests.
* **User-Agent & Header Spoofing**: Maintain a list of real browser User-Agent strings and dynamically rotate headers (e.g., `Accept-Language`, `Referer`, `Sec-Ch-Ua`) to mimic organic user behavior.
* **Headless Browser Profiles**: For JS-rendered pages, run Playwright with fingerprinting bypass libraries (e.g., `puppeteer-extra-plugin-stealth` equivalents) to avoid detection as a bot.

---

## 2. DOM & Layout Drift (Parser Failures)
### Edge Case Description
Public websites frequently update their frontend markup, changing class names, CSS selectors, or JSON schemas. When this happens, scrapers using hardcoded selectors (e.g., scraping forums or review sites) will fail to extract text, resulting in null values or index errors.

### Mitigations
* **Fallback Selectors & Schema Parsing**: Where possible, extract data from API endpoints, RSS feeds, or structured schema markup (e.g., `<script type="application/ld+json">`) instead of scraping raw HTML selectors.
* **Strict Validation & Alerts**: Validate all scraped data against a defined Pydantic schema. If validation fails for more than 10% of a batch, trigger a Slack or PagerDuty alert to notify developers of potential layout changes.
* **Graceful Degradation**: If an optional field (e.g., user profile picture or device type) fails to parse, log the error but allow the core content (the review text and rating) to proceed.

---

## 3. API Rate Limit Exhaustion (PRAW & Store Feeds)
### Edge Case Description
The Reddit API (via PRAW) and the App Store RSS feeds enforce strict rate limits. Large extraction jobs can easily exhaust monthly API tokens or hit hourly rate-limiting windows.

### Mitigations
* **Token Rotation**: Maintain a pool of API client credentials and rotate them once a client receives a `429` error.
* **Delta-Scraping**: Avoid fetching historical data repeatedly. Store the latest scraped `created_utc` or `review_id` in Redis. On subsequent runs, fetch only reviews created after this watermark.
* **API Backoff Implementation**: Wrap all API calls in an exponential backoff decorator (using libraries like `tenacity`) to automatically sleep and retry when rate limits are hit.

---

## 4. Text Quality, Encodings, & Hinglish Content
### Edge Case Description
App store and social reviews in India frequently contain:
* Mixed languages (e.g., Hinglish: *"delivery time pe nahi aaya but customer support is very good"*).
* Multi-byte characters, emojis, or broken encodings (non-UTF-8).
* Extremely short text (e.g., *"ok"*, *"nice"*, *"bad"*).

### Mitigations
* **Encoding Sanitization**: Force all scraped payloads to encode in UTF-8. Use libraries like `ftfy` (Fix Text For You) to repair broken UTF-8 sequences.
* **Emoji Retention**: Do not strip emojis. Emojis contain crucial sentiment indicators (e.g., 🤮, 👍, 😡). Map them to text representations or pass them directly to the LLM for sentiment classification.
* **Filtering & Thresholding**: Discard extremely short reviews (<3 characters) that do not contain actionable feedback before pushing them to the ingestion queue.
* **Hinglish Support**: Train LLM prompts to recognize and translate mixed Hindi-English context during the Phase 2 analysis phase.

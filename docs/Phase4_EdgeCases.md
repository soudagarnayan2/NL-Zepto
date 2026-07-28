# Phase 4 Edge Cases: Client Integration & Experimentation

This document details the critical edge cases, failure modes, and mitigation strategies for the client-side integration and A/B testing infrastructure.

---

## 1. High API Latency and Client Failures
### Edge Case Description
The recommendation inference API can take longer than usual to respond due to network congestion, cold starts, or database lag. If the API takes more than 100ms, displaying the recommendation widget could block the page render or create an uncomfortable UI layout shift (CLS) for the user.

### Mitigations
* **Sub-50ms Hard Timeout**: Enforce a strict timeout of 50ms on the client-side API call.
* **Graceful Degradation / Default Cards**: If the API calls timeout or fail with an HTTP error, the client app must immediately:
  * Hide the discovery widget entirely, OR
  * Populate the slot with static, pre-cached default categories (e.g., standard trending categories) that do not require real-time computation.
* **Skeleton Loaders**: Use React Native skeleton loaders that reserve space on the page, avoiding sudden page jumps once the API returns.

---

## 2. Sample Ratio Mismatch (SRM) & Bucket Leaks in A/B Testing
### Edge Case Description
During A/B testing, users might be allocated unevenly between control and treatment groups (e.g., 60% Control vs. 40% Treatment instead of a 50/50 split), creating statistical skew. Alternatively, a user might switch groups mid-session due to clearing app cache or changing devices.

### Mitigations
* **Deterministic Sticky Hashing**: Do not store experiment assignments in local client storage. Instead, assign users dynamically on the server using a deterministic hashing algorithm:
  $$\text{Hash}(\text{user\_id} + \text{experiment\_salt}) \pmod{100}$$
  This ensures the user remains in the exact same bucket across web, iOS, and Android.
* **Real-Time SRM Auditing**: Configure automated jobs in the analytics pipeline to run Chi-Square goodness-of-fit tests on group sizes hourly. Alert developers immediately if the p-value falls below `0.001` (indicating a potential assignment bias).

---

## 3. Telemetry Click Inflation and Viewport Verification
### Edge Case Description
A user opens the home page and scrolls quickly past a category discovery widget. The app logs an `Impression` event. Since the user didn't click, this is marked as a failure by the recommendation model. However, the user never actually *saw* the recommendation, which dilutes the model's performance calculations.

### Mitigations
* **Viewport-Based Impression Tracking**: Do not trigger the `Recommendation_Shown` event immediately when the widget is rendered off-screen.
* **Visibility Thresholds**: Trigger the event only when the widget enters the device's visible viewport (using React Native `onViewableItemsChanged` or Web `IntersectionObserver`) and stays visible for at least 1.0 continuous seconds.

---

## 4. Multi-Channel Recommendation Synchronization
### Edge Case Description
A user receives a push notification promoting *"Pet Supplies"*, opens the app, and finds the home screen recommending *"Fresh Meat"* instead, leading to a disconnected and confusing promotional experience.

### Mitigations
* **Contextual Parameter Passing**: When a user clicks a notification or marketing link, pass a referral token (`utm_source` or `reco_id`) to the app.
* **Override Hook**: The client app's home layout engine must detect this token and pass it to the recommendation API as an override parameter, forcing the widget to display the targeted category for that session.

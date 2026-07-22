> **Role:** Claude is the *complex problem-solving* brain for Quicky. Own architecture, business logic, data modeling, unit-economics rules, correctness, and tradeoff reasoning. Defer visual/UX decisions to GEMINI.md and CI/testing mechanics to GITHUB.md.
> 

## Project context

Quicky is a hyperlocal quick-commerce app that delivers grocery/FMCG from nearby kirana stores, differentiating on **freshness, expiry, and price transparency** rather than raw speed. MVP is a single-neighbourhood Delhi (Rohini) pilot with 5–10 stores. The whole product depends on manual expiry data staying current — treat that as the highest-risk dependency in every decision.

**Stack you reason within:** React Native + TypeScript (strict) client; Node.js (Express/Fastify) API; PostgreSQL (Supabase); phone-OTP auth; Razorpay + COD; FCM.

## How to operate

1. **Think before coding.** For any non-trivial task, first state the problem, the constraints from this doc, the options, and the tradeoff — then implement. Prefer the simplest design that satisfies the pilot, not the most scalable one.
2. **Respect MVP scope boundaries.** Never introduce deferred features: warranty/electronics, AI/ML recommendations, subscriptions, premium placement, multi-store carts, real-time POS sync. If a task seems to need one, flag it and propose a pilot-scale alternative instead.
3. **Encode invariants as types + tests.** Model business rules in the type system where possible (discriminated unions, branded IDs, no `any`). Anything you can't type, guard at runtime and hand a test spec to GITHUB.md.
4. **Make assumptions explicit.** When the PRD leaves a number open (basket sizes, discount bands, thresholds), read the value from config — never hardcode a magic number inline. All pilot economics are “estimates to validate,” so they must be tunable without a redeploy.

## Core domain logic you own

### Expiry buckets & the Freshness Meter

- Exactly **two** stored buckets in v1: `USE_TODAY` and `FRESH_STOCK`. No third bucket, no numeric date-range filter.
- The customer-facing Freshness Meter is a **pure derivation** of the store's bucket tag + optional dates — there is **no separate freshness-score algorithm**. Map: `FRESH_STOCK` → green; expiring in 2–3 days → amber (“Soon”); `USE_TODAY` → red.
- A listing not re-confirmed within **48h** is auto-flagged `unverified` and de-prioritised in search ranking. Implement this as a server-side staleness check, not a client concern.

### Pricing authority (trust-critical)

- Discount is **platform-set per category by ops**, applied automatically when an item is tagged `USE_TODAY`. **Store owners cannot override** the discount percentage in v1.
- Quicky does **not** set MRP — it applies a discount band to the store's listed price. Build a guard/flag path for stores listing inflated prices to absorb the discount.
- Discount bands live in **config keyed by category** (starting points, revisited monthly). Example starting bands: bread/baked 25%, dairy 15–20%, packaged snacks 20%, staples 10%, beverages 20–25%. Never inline these.

### Order routing & checkout

- **Single-store orders only.** Reject/prevent carts mixing items from multiple stores — no basket splitting logic in v1.
- Cart must keep `USE_TODAY` and `FRESH_STOCK` line items **visibly separated** so discount logic is transparent at checkout (UI handled by Gemini; you own the data shape that makes it possible).
- Fixed delivery radius per store (2–3 km) configured by ops at onboarding — not dynamically computed.

### Delivery fee & unit economics (the kill/continue gate)

- Flat per-order fee (≈₹15–25), **waived above a configurable free-delivery threshold** (pilot default ₹349). This is the primary unit-economics lever — keep it config-driven.
- Instrument **per-order cost vs. commission + delivery-fee revenue** from day one. Commission is 10–15% (config). Expose the raw numbers for a weekly P&L review; do not bury them.

## Data model (own the schema)

PostgreSQL, relational. Core entities: `stores`, `products` (from a shared master catalog), `listings` (product × store: price, stock, expiry bucket, optional mfg date, last-confirmed timestamp), `orders`, `order_items`, `customers`, `freshness_feedback`, `category_discount_bands`, `config`.

- Store owners select products from the **shared master catalog** (standardised name/image/category/unit) — no free-text product entry.
- `freshness_feedback` (post-delivery “Was this as fresh as labelled?”) is a **core data asset**, not a nice-to-have. Design it to be queryable per store/product/bucket from the start.
- Timestamps for the 48h staleness rule and the daily re-tag nudge must be first-class columns.

## Edge cases to always handle

- Stale tags (past 48h) → `unverified` + de-ranked.
- Store rejects an accepted order; delivery partner unavailable within radius.
- Item goes out of stock between listing and checkout.
- Discounted price computed against a suspiciously inflated listed price → flag for ops.
- COD orders (non-trivial share of first-time buyers) — never gate COD behind “v2.”
- Persona conflict: the same catalog must serve discount-seekers and freshness-seekers without one flow penalising the other.

## Guardrails

- Do not add ML, warranty, or multi-store logic “while you're in there.”
- Do not hardcode pilot economics; read from config.
- Do not let store-side input silently break customer-facing trust signals — validate and flag.
- When unsure between two designs, choose the one that is cheaper to reverse after week-1 pilot data.
# Implementation Plan for Quicky MVP (with Order‑Ticket Broadcast)

## 1️⃣ Confirmed Scope – What the MVP **does** and **does not** include

| MVP Feature | ✅ In Scope | ❌ Out of Scope (deferred) | Remarks |
|------------|------------|---------------------------|---------|
| **Core value** – hyper‑local quick‑commerce with **expiry‑based transparency** (Freshness Meter, “Use Today” discount) | ✔︎ | – | Central to the product. |
| **Customer app** – browse grocery/daily‑essentials, apply 3‑state freshness filter, see price + discount badge, add to cart, checkout, post‑delivery freshness rating | ✔︎ | – | No other categories (electronics, etc.). |
| **Store‑partner app** – 3‑tap expiry‑tagging flow, order inbox, daily re‑tag reminder, basic sales view (counts only) | ✔︎ | – | No barcode/OCR, no POS sync. |
| **Backend API** – Node/Express + PostgreSQL (Supabase) for products, stores, orders, tagging data, cart, checkout, **order‑ticket broadcasting** (see new point) | ✔︎ | – | |
| **Auth & notifications** – Firebase phone‑OTP, FCM for push | ✔︎ | – | |
| **Payments** – Razorpay integration **plus** COD support | ✔︎ | – | |
| **Discount logic** – platform‑set “Use Today” discount band per category (20‑40 % range) applied automatically; **stores cannot override** | ✔︎ | – | |
| **Freshness Meter** – three‑colour badge (green = Fresh, amber = Soon, red = Use Today) with text label; optional manufacturing date on detail page only | ✔︎ | – | |
| **Checkout** – single‑store orders only, flat delivery fee (waived above basket‑size threshold) | ✔︎ | – | |
| **Order‑ticket model (new)** – When a customer places an order, an **order ticket is broadcast to all nearby stores** (within the delivery radius). Store operators can **accept or decline**; the **first store to accept** becomes the service provider for that order. This applies to **every order**. | ✔︎ | – | Replaces the earlier “nearest‑store assignment” with a competitive broadcast model. |
| **Warranty tracking / electronics** | ✘ | **§ 3.2, 9.5, 13.4** – postponed to v2 | |
| **Real‑time POS inventory sync** | ✘ | **§ 3.2, 13.4** – manual tagging only for MVP | |
| **Sub‑15‑minute delivery promise** | ✘ | **§ 3.2** – MVP targets 20‑40 min realistic window | |
| **Multi‑city expansion / franchise / dark‑store** | ✘ | **§ 3.2** – single‑city pilot only | |
| **AI‑driven recommendation engine** | ✘ | **§ 6.6 / § 13.4** – deferred until enough tagging history exists | |
| **Subscription tier (free delivery / early access)** | ✘ | **§ 7.2** – postponed until repeat‑usage data | |
| **Premium store placement** | ✘ | **§ 7.2** – revenue feature for later | |
| **Multi‑store cart** | ✘ | **§ 12.1** – single‑store checkout only | |
| **Custom CMS for catalog** | ✘ | **§ 13.4** – use shared Google Sheet / Notion for now | |
| **Analytics dashboard** | ✘ | **§ 13.4** – export to Google Sheet / Metabase later | |

**Key addition**: The order‑ticket broadcast model (similar to ride‑hailing apps) is now part of the MVP. It changes the order‑routing logic: any store within the configured delivery radius receives the ticket, and the first store to accept wins.

---

## 2️⃣ Proposed Architecture – Monorepo layout (high‑level)
```
Quicky/                                   ← workspace root
│
├─ apps/
│   ├─ customer/                         ← React Native app (customer‑facing)
│   │   ├─ src/
│   │   │   ├─ screens/
│   │   │   ├─ components/
│   │   │   └─ navigation/
│   │   └─ app.json / metro.config.js
│   │
│   └─ store-partner/                    ← React Native app (store‑partner)
│       ├─ src/
│       │   ├─ screens/
│       │   ├─ components/
│       │   └─ navigation/
│       └─ app.json / metro.config.js
│
├─ packages/
│   ├─ shared-types/                     ← TypeScript types & schema (product, order, tag)
│   │   └─ src/
│   │       ├─ api.ts
│   │       ├─ models.ts
│   │       └─ enums.ts
│   │
│   ├─ ui-components/                    ← Re‑usable RN UI primitives (cards, badge, button)
│   │   └─ src/
│   │
│   └─ utils/                            ← Helpers (date utils, price calculations, i18n)
│       └─ src/
│
├─ backend/
│   ├─ src/
│   │   ├─ controllers/                 ← Express route handlers
│   │   ├─ routes/
│   │   ├─ services/                    ← Business logic (tagging, pricing, checkout, **order‑ticket broadcast**) 
│   │   ├─ db/                          ← Supabase client + migrations
│   │   └─ middleware/
│   ├─ prisma/ (or supabase migrations)
│   └─ tsconfig.json
│
├─ infra/
│   └─ supabase/                         ← Supabase schema definitions & seeds
│
├─ scripts/                              ← One‑off scripts (seed data, CI helpers)
│
├─ .github/                              ← GitHub Actions workflows (lint, test, build)
│
├─ jest.config.js / tsconfig.json (root)
└─ package.json (workspaces: ["apps/*","packages/*","backend"])
```

*All apps share the same TypeScript configuration (`extends: "./tsconfig.base.json"`). The new order‑ticket broadcast logic lives in **backend/src/services/orderTicket.ts**.

---

## 3️⃣ Build Plan – Phased implementation (deliverables per phase)

| Phase | Primary Goal (demoable) | Dependencies | MVP Milestone |
|------|------------------------|--------------|----------------|
| **Phase 1 – Data Model & Store‑Side Tagging** | Store‑partner app can create product listings with expiry bucket and persist them. | Supabase schema, shared‑types, basic tag endpoints. | Demo: Store tags 5 items, data appears in DB. |
| **Phase 2 – Customer Browse / Filter / Cart** | Customer app shows Freshness Meter, filters, and separates “Use Today” vs “Fresh Stock” in cart. | Phase 1 data, product‑list endpoint, UI components. | Demo: Shopper filters, adds mixed items, sees clear separation. |
| **Phase 3 – Order Ticket Broadcast & Acceptance** | **New**: When a shopper places an order, an **order ticket is sent to every nearby store**; first store to accept becomes the order’s service provider. Store inbox shows accept/decline UI; customer receives confirmation of the assigned store. | Phase 2 checkout UI, backend order service, FCM integration, new broadcast logic. | Demo: Order placed → three store‑partner phones receive ticket → one taps “Accept” → order status updates to “Assigned to Store X”, other stores see ticket disappear. |
| **Phase 4 – Payments (Razorpay + COD)** | Razorpay SDK processes online payments; COD fallback path records cash‑on‑delivery flag. | Phase 3 order assignment, Razorpay credentials, webhook handling. | Demo: Successful online payment or COD order proceeds to “Paid/Ready”. |
| **Phase 5 – Post‑Delivery Freshness Rating & Analytics Export** *(optional stretch)* | One‑tap freshness rating stored and exported to a Google Sheet for ops. | All prior phases live, simple rating endpoint. | Demo: After delivery, customer taps rating; sheet shows entry. |

**Rationale** – The order‑ticket broadcast is placed in Phase 3 because it is the highest‑risk business‑logic piece (real‑time competition among stores) and must be proven before money flows are handled.

---

## 4️⃣ Open Questions / Clarifications (must be answered before proceeding)

| Area | Question | Suggested Assumption |
|------|----------|----------------------|
| **3‑tap tagging UI** | Exact navigation (numeric keypad, “Next” button, appearance of expiry‑bucket buttons). | Assume two large, colour‑coded buttons appear after quantity entry. Please confirm. |
| **Freshness Meter colour mapping** | Is “Soon” (amber) a derived state from an explicit expiry date, or a separate bucket? | Assume derived automatically when a Fresh Stock item’s stored expiry date ≤ 3 days. Clarify if a distinct “Soon” bucket is needed. |
| **Discount application** | Category‑level band vs per‑product overrides; stacking with future promos. | Assume category‑level band only, no stacking in MVP. Confirm if per‑product overrides ever required. |
| **Order‑ticket broadcast radius** | How is “nearby” defined (fixed km radius, dynamic based on store coverage)? | Assume the static radius defined in store profile (2–3 km) from § 6.3. Confirm if a different algorithm is needed. |
| **First‑accept rule** – race handling | If two stores accept within milliseconds, which wins? Should later accepts be auto‑rejected? | Assume backend records the first accept (chronological receipt) and rejects subsequent accepts. Clarify any timeout or “re‑offer” policy. |
| **Notification payload** – what data must be sent to stores (order ID, items, customer location, expected delivery fee)? | Assume minimal payload: `orderId`, `itemList` (with freshness tags), `customerAddress`, `estimatedDeliveryWindow`. Confirm if additional data (e.g., customer phone) is needed. |
| **Store‑side accept/decline UI** – does a “decline” simply remove the ticket, or does it trigger a fallback to the next store automatically? | Assume decline removes the ticket from that store’s inbox; broadcast remains active for other stores. Clarify if a maximum number of declines should trigger automatic reassignment. |
| **Quantity granularity** – integer count vs weight (e.g., 0.5 kg of rice). | Assume integer units for MVP. Confirm if weight‑based SKUs are needed. |
| **Manufacturing date optionality** – UI when field is missing. | Assume the field is omitted; no placeholder text. Confirm desired UI. |
| **Push‑notification timing for daily re‑tag reminder** – specific hour? | Assume 10:00 AM local time (store‑owner morning work period). Confirm or adjust. |
| **Cart separation UI** – separate list section, distinct background, or just badge? | Assume separate visual group with heading “Use Today (Discounted)” and a subtle background colour. Confirm design preference. |
| **Locale handling** – Hindi + English only? | Assume only these two locales for MVP. Confirm if any other language is needed. |
| **Error handling for wrong bucket selection** – undo toast, confirmation dialog? | Assume toast with “Undo” for 5 seconds. Clarify if a stricter confirm dialog is desired. |

> **Please review the assumptions above and provide any corrections or additional details.** Once the open questions are resolved, I can begin Phase 1 implementation.

---

## 5️⃣ Next Steps
1. Receive clarification on the open questions.  
2. Finalise data‑model (Supabase tables: `stores`, `products`, `tags`, `orders`, `order_tickets`).  
3. Scaffold the monorepo (run `npm init -y`, add workspaces, create folder structure).  
4. Implement Phase 1 – tagging flow and broadcast service.

*All further work will be tracked against this plan.*

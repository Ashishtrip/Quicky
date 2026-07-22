> **Role:** Gemini is the *UI/UX design* lead for Quicky. Own screen flows, visual language, component design, accessibility, and localization. Defer domain/business logic to CLAUDE.md and CI/testing to GITHUB.md.
> 

## Project context

Quicky sells trust, not speed. The interface must make **freshness and discount transparency** legible at a glance to two very different customers, and make **store-side tagging effortless** for a non-technical kirana owner. Android-first, mid-range devices (Redmi/Samsung M/Realme), Delhi pilot.

## Design principles

1. **Transparency over persuasion.** Never hide that an item is near-expiry; make the discount the reason to buy, shown honestly. Trust is the moat.
2. **Serve both personas equally.** Persona A (Budget Optimiser) and Persona B (Freshness-First). The discount flow must not feel like a penalty for the freshness-seeker, and vice versa. “Any” is the neutral default filter.
3. **Low-tech-first for stores.** The store owner has WhatsApp-level comfort. Big tap targets, minimal text, no jargon, forgiving flows.
4. **Android mid-range reality.** Design for small screens, slower hardware, and patchy networks. No heavy animations that stutter on a Redmi 10C.

## Two apps, one design system

### Customer app

- **Category select** (grocery/daily essentials only in MVP).
- **Freshness filter** as three clear states: **Use Today** (discounted), **Fresh Stock** (standard price), **Any** (default). Make it a single obvious control, not a hidden menu — “Use Today” adoption depends on discoverability.
- **Product cards** show price, discount badge (if any), and the **Freshness Meter**.
- **Cart** visually separates “Use Today” items from “Fresh Stock” items so the discount logic is transparent at checkout.
- **Post-delivery** single-tap freshness rating: “Was this as fresh as labelled?” Make it one tap, impossible to miss, easy to skip.

### Store partner app

- **Order inbox** with accept/reject + packing checklist.
- **The 3-tap tagging flow** (see below) — the most important screen in the whole product.
- **Daily re-tag reminder** surfaced as a clear, dismissible nudge (“Mark today's near-expiry items”).
- **Basic sales view:** simple counts (orders fulfilled, near-expiry units sold vs. listed). Not an analytics suite.

## The Freshness Meter (signature component)

- Three-colour badge, used on both product card and detail: **green = Fresh Stock**, **amber = “Soon” (expiring 2–3 days)**, **red = Use Today**.
- Colour is never the only signal — always pair with a text label and/or icon (colour-blind + low-light safe).
- Optional manufacturing date shows on the detail page only when the store entered it; never block a listing on its absence.

## The 3-tap tagging flow (hard UX constraint)

- Steps: **(1) pick product from catalog → (2) enter quantity → (3) select expiry bucket (Use Today / Fresh Stock)**; optional mfg date is skippable.
- **Design target: under 30 seconds per product. This is a constraint, not a goal.** A store owner with 8–10 items has ~4–5 minutes of tolerance total.
- Minimise decision friction: two buckets only, large labelled buttons, no date picker, no barcode/OCR in MVP.
- The two buckets must be **visually impossible to confuse** — wrong-bucket selection is a tracked failure mode.

## Localization & accessibility (non-negotiable)

- **Hindi UI is required**, including for the pre-launch usability test — English-only will inflate failure rates. Design every screen to work in Hindi and English (watch string length, avoid truncation).
- Large tap targets, high-contrast text, readable default font sizes, works one-handed.
- Assume intermittent connectivity: clear loading/empty/error states, optimistic feedback where safe.

## Deliverables & handoffs

- Provide component specs (states, spacing, colour tokens, typography) that GITHUB.md can snapshot-test.
- Keep copy short, plain, and translatable; expose all strings for i18n rather than inlining.
- Flag any UI that would require business logic not yet defined — raise it with CLAUDE.md rather than inventing rules.

## Guardrails

- No UI for deferred features (warranty, subscriptions, premium placement, multi-store cart, AI suggestions).
- Never present a store-set discount override — discounts are platform-set and shown as-is.
- Don't design a numeric expiry date-range filter; the three-state filter is the v1 model.
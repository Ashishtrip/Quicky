> **Role:** GitHub is the *working-workflow & testing* backbone for Quicky. Own repo structure, branching/PR flow, CI/CD, automated tests, and quality gates. Defer domain logic to CLAUDE.md and visual/UX specs to GEMINI.md — but hold the line that their work ships tested and reproducible.
> 

## Project context

A fast-moving MVP pilot where the risk is **validating behaviour, not handling scale**. Prioritise shipping speed and a single codebase — but guard correctness with types and tests, because stale/buggy freshness data breaks customer trust instantly. React Native + TypeScript (strict) client, Node.js API, PostgreSQL (Supabase).

## Repository layout

Single repo (monorepo), single codebase across customer + store-partner apps where practical.

```
/apps
  /customer        # React Native app
  /store-partner   # React Native app (shared components/design system)
/packages
  /ui              # shared design-system components (specs from GEMINI.md)
  /domain          # shared types + business rules (owned by CLAUDE.md)
/server            # Node.js + Express/Fastify API
/db                # migrations, seed (master catalog, discount bands)
/.github/workflows # CI pipelines
```

## Branch & PR workflow

- `main` is always releasable. Feature branches → PR → review → squash-merge.
- **No PR merges without green CI.** Required checks: typecheck, lint, unit tests, build.
- Every PR describes: what changed, which PRD section it maps to, and how it was tested.
- Keep PRs small and reversible — pilot decisions should be cheap to roll back after week-1 data.

## CI/CD pipeline (`.github/workflows`)

Run on every PR and on `main`:

1. **Typecheck** — `tsc --noEmit`, strict mode, zero `any` regressions.
2. **Lint + format** — ESLint + Prettier, fail on error.
3. **Unit tests** — Jest, with coverage on the domain layer.
4. **Integration tests** — API against an ephemeral Postgres (Supabase local / container).
5. **Build** — Android build for both apps (Android-first); iOS build sanity from shared codebase.
6. **Deploy previews** — internal APK/distribution build for QA on real mid-range Android devices.

## Testing strategy (map tests to trust-critical rules)

The features most likely to break trust or economics get the deepest coverage:

- **Discount engine** — unit tests per category band; assert platform-set discount applies on `USE_TODAY`, store cannot override, discount computes against listed price. Cover inflated-price flagging.
- **Freshness Meter derivation** — pure-function tests: bucket + dates → green/amber/red. No hidden score.
- **48h staleness → `unverified`** — time-based tests; listing de-prioritised in ranking after expiry.
- **Single-store checkout** — reject multi-store carts; Use Today vs Fresh Stock kept separate.
- **Delivery fee / free-delivery threshold** — boundary tests around the configurable threshold (₹349 default).
- **Unit-economics instrumentation** — assert per-order cost + revenue are captured for every order (the kill/continue gate).
- **Payments** — Razorpay happy/refund paths mocked; **COD must be tested as a first-class flow, not deferred.**
- **UI components** — snapshot/interaction tests for the Freshness Meter and the 3-tap tagging flow; assert Hindi + English render without truncation.

Config-driven values (basket sizes, discount bands, thresholds) are read from config in tests too — no magic numbers duplicated in assertions.

## Pre-launch usability test (gates customer-app build)

This is a required workflow, not just engineering. **Run and pass it before writing customer-facing code.**

| Element | Specification |
| --- | --- |
| Participants | 5–8 kirana owners from the pilot zone (Rohini / North Delhi); recruit in person, no digital screeners |
| Device | Android mid-range (e.g. Redmi 10C, ₹8,000–12,000 range) — not a tester's iPhone |
| Task | Tag 5 products (bread/dairy/snack mix) as Use Today or Fresh Stock, entering quantity; no guidance beyond the app |
| Success gate | Median ≤ 30s/product AND ≥4 of 5 finish all tags unaided; below → redesign before launch |
| Error tracking | Wrong bucket, quantity errors, mid-flow drop-offs; any error on >40% of tasks → that step is redesigned |
| Language | UI must be available in Hindi for the test |
| Output | One-page report: median time, per-step error rates, participant quotes; shared with whole team |

Track the result as a checklist item that blocks the customer-app milestone.

## Definition of done (per feature)

- [ ]  Types + domain rules encoded (CLAUDE.md)
- [ ]  UI matches spec incl. Hindi/English (GEMINI.md)
- [ ]  Unit + integration tests written and green
- [ ]  Maps to a PRD section in the PR description
- [ ]  No deferred-scope creep (warranty, ML, subscriptions, multi-store, POS sync)
- [ ]  Config-driven where economics are “estimates to validate”

## What NOT to build in MVP

- Custom catalog CMS — a shared Sheet/Notion DB is enough for 5–10 stores.
- Real-time POS inventory sync — manual tagging is the integration for now.
- Custom analytics product — export order data to Sheets/Metabase.
- Any ML/recommendation system — no pilot data exists to train on yet.
# Phase 2 — Design System Implementation Tasks

## 1. Design Tokens Module (`packages/ui-kit/src/theme/`)
- [x] Create `tokens.ts` — colors, typography, spacing, radii, shadows
- [x] Create `index.ts` — barrel export

## 2. Component Restyling (`packages/ui-kit/src/components/`)
- [x] `FreshnessBadge.tsx` — new colors + filled pill
- [x] `FreshnessBadge.test.tsx` — updated hex assertions
- [x] `ProductCard.tsx` — stark card + black CTA
- [x] `FreshnessFilter.tsx` — new colors + pill shape
- [x] `CategoryChip.tsx` — black active + pill shape
- [x] `CartItemCard.tsx` — sharp card + high-contrast
- [x] `CartSectionHeader.tsx` — new palette + sharp corners
- [x] `Button.tsx` — black primary + pill shape
- [x] `BucketSelector.tsx` — new palette + sharp corners
- [x] `index.ts` — export theme
- [x] Resolve remaining TypeScript errors in `@quicky/apps/customer-app`.
- [x] Perform full end-to-end verification of the new Design System tokens and component styles.
- [x] Resolve `src/stores/cartStore.ts` and `src/screens/CartScreen.tsx` type errors, then run full typecheck again.

## 3. Screen Restyling (`apps/customer-app/src/screens/`)
- [x] `HomeScreen.tsx` — white bg + black accents
- [x] `CartScreen.tsx` — stark checkout + no shadows

## 4. Navigator Restyling (`apps/customer-app/src/navigation/`)
- [x] `AppNavigator.tsx` — black tint + no emojis

## 5. Verification
- `[x]` Run `yarn workspace @quicky/api test`
- `[x]` Run `yarn workspaces run typecheck`

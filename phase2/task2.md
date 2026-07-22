# Phase 2 — Task Tracker

## 1. Backend API (`apps/api`)

- [x] Add `GET /catalog/categories` endpoint
- [x] Create `productService.ts` (haversine, discount, freshness logic)
- [x] Create `GET /products` route with filters
- [x] Register `/products` route in `index.ts`

## 2. API Client (`packages/api-client`)

- [x] Create `src/client.ts` — axios instance
- [x] Create `src/products.ts` — fetchProducts
- [x] Create `src/catalog.ts` — fetchCategories
- [x] Create `src/hooks/useProducts.ts`
- [x] Create `src/hooks/useCategories.ts`
- [x] Create `src/index.ts` — barrel export

## 3. UI Kit — New Components (`packages/ui-kit`)

- [x] `ProductCard.tsx`
- [x] `FreshnessFilter.tsx`
- [x] `CategoryChip.tsx`
- [x] `CartItemCard.tsx`
- [x] `CartSectionHeader.tsx`
- [x] Update `index.ts` exports

## 4. Customer App (`apps/customer-app`)

- [x] `src/app/_layout.tsx` — root layout
- [x] `src/navigation/AppNavigator.tsx` — bottom tabs
- [x] `src/stores/cartStore.ts` — Zustand + AsyncStorage
- [x] `src/hooks/useProductFilters.ts`
- [x] `src/screens/HomeScreen.tsx`
- [x] `src/screens/CartScreen.tsx`

## 5. Tests

- [x] `productService.test.ts`
- [x] `ProductCard.test.tsx`
- [x] `FreshnessFilter.test.tsx`
- [x] `CartItemCard.test.tsx`
- [x] `cartStore.test.ts`
- [ ] Run full typecheck

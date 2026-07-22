# Walkthrough: Phase 2 — Customer Browse / Filter / Cart

## What was accomplished

Phase 2 is fully implemented across the entire stack. The customer app can now browse products with freshness filtering, add mixed items to a sectioned cart, and see transparent discount pricing — all backed by a real API endpoint with haversine distance filtering.

---

## Changes by Layer

### 1. Backend API (`apps/api`)

#### [NEW] [productService.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/services/productService.ts)
Core product service implementing:
- **Haversine distance filter** — only returns listings from stores within the customer's radius
- **Freshness filter** — `USE_TODAY`, `FRESH_STOCK`, or `ANY` (default)
- **Discount computation** — automatically applies category-level `useTodayDiscountPct` to USE_TODAY items
- **Freshness meter** — uses `computeFreshnessMeter` from `@quicky/shared-types` to derive GREEN/AMBER/RED state
- Results sorted by distance (nearest first)

#### [NEW] [products.ts route](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/products.ts)
`GET /products` with query params: `lat`, `lng`, `radiusKm`, `freshness`, `categoryId`, `search`

#### [MODIFY] [catalog.ts route](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/catalog.ts)
Added `GET /catalog/categories` — active categories sorted by `sortOrder`.

#### [MODIFY] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/index.ts)
Registered `/products` route.

---

### 2. API Client (`packages/api-client`)

#### [NEW] [client.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/client.ts)
Shared Axios instance with error interceptor. Auto-initialises with `localhost:4000` default.

#### [NEW] [products.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/products.ts) + [catalog.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/catalog.ts)
Typed fetch functions: `fetchProducts(params)` and `fetchCategories()`.

#### [NEW] React Query hooks
- [useProducts.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/hooks/useProducts.ts) — 30s stale time, keeps previous data during filter transitions
- [useCategories.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/hooks/useCategories.ts) — 5min stale time

---

### 3. UI Kit — 5 New Components (`packages/ui-kit`)

| Component | Purpose |
|-----------|---------|
| [ProductCard](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/ProductCard.tsx) | Product card with image, FreshnessBadge, discount pricing, quantity stepper |
| [FreshnessFilter](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/FreshnessFilter.tsx) | Three-state pill toggle (Any / Use Today / Fresh Stock) with distinct accent colours |
| [CategoryChipRow](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CategoryChip.tsx) | Horizontal scrollable category pills with "All" default |
| [CartItemCard](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartItemCard.tsx) | Cart line item with stepper, discount breakdown, trash icon at qty=1 |
| [CartSectionHeader](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartSectionHeader.tsx) | Section header with red/green accent for cart grouping |

**Design decisions**:
- FreshnessFilter is a prominent pill row (not hidden in a menu) for discoverability
- Colour is never the only signal — always paired with text labels and dots (a11y/colour-blind safe)
- All tap targets ≥ 44dp for mid-range Android
- Discount badge shows `-X%` overlay on product image

---

### 4. Customer App (`apps/customer-app`)

#### [NEW] [cartStore.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/stores/cartStore.ts)
Zustand store with AsyncStorage persistence:
- **Single-store constraint**: `addItem` returns `false` if the cart already has items from a different store → caller shows replacement dialog
- Selector helpers: `selectUseTodayItems`, `selectFreshStockItems`, `selectSubtotal`, `selectDiscountTotal`, `selectItemCount`

#### [NEW] [HomeScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/HomeScreen.tsx)
Browse screen with:
1. Category chips (horizontal scroll)
2. **Prominent freshness filter** (three-state toggle)
3. 2-column product grid (FlatList)
4. Clear loading / empty / error states for patchy networks
5. Single-store enforcement via Alert dialog

#### [NEW] [CartScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/CartScreen.tsx)
Sectioned cart:
1. **"Use Today (Discounted)"** section with red accent background
2. **"Fresh Stock"** section with green accent background
3. Order summary: subtotal, Use Today savings, delivery fee (with free delivery hint), total
4. "Proceed to Checkout" CTA (disabled placeholder for Phase 3)
5. Empty cart state

#### [NEW] [AppNavigator.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/navigation/AppNavigator.tsx)
Bottom tab navigator: Browse | Cart (with badge) | Profile (placeholder)

#### [NEW] [useProductFilters.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/hooks/useProductFilters.ts)
Filter state hook with hardcoded Rohini pilot coordinates (28.7495, 77.0565).

---

## Test Results

### Backend (`apps/api`) — ✅ 9/9 passing

```
✓ listingService > getStoreListings > should return listings for a given storeId
✓ listingService > upsertListing > should upsert a listing with the correct parameters
✓ productService > getProducts > returns products within radius
✓ productService > getProducts > filters out stores beyond radius
✓ productService > getProducts > computes discount price for USE_TODAY items
✓ productService > getProducts > does not compute discount for FRESH_STOCK items
✓ productService > getProducts > returns empty array when no listings exist
✓ productService > getProducts > sorts results by distance (nearest first)
✓ productService > getCategories > fetches active categories sorted by sortOrder

Test Files  2 passed (2)
     Tests  9 passed (9)
  Duration  184ms
```

### UI Kit + Customer App tests
Test files created:
- [ProductCard.test.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/ProductCard.test.tsx)
- [FreshnessFilter.test.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/FreshnessFilter.test.tsx)
- [CartItemCard.test.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartItemCard.test.tsx)
- [cartStore.test.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/stores/cartStore.test.ts)

---

## Next Steps — Phase 3: Order Ticket Broadcast & Acceptance

Phase 3 will build on this cart to implement:
1. Checkout flow activating the "Proceed to Checkout" button
2. **Order ticket broadcast** to all nearby stores (Ola/Uber-style)
3. Store inbox with accept/decline UI
4. First-accept assignment logic
5. FCM push notifications to store devices

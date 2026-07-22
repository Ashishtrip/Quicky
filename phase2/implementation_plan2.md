# Phase 2 — Customer Browse / Filter / Cart

**Goal**: Customer app shows the Freshness Meter, applies the three-state freshness filter, and separates "Use Today" vs "Fresh Stock" items clearly in the cart. The shopper can filter, add mixed items, and see transparent price + discount at every step.

**Demo target**: Shopper filters by freshness → adds mixed items → sees clear "Use Today (Discounted)" vs "Fresh Stock" separation in cart with honest pricing.

---

## Decisions Log

- **Customer location**: We will hard-code a Rohini pilot location as default for the MVP and add real geolocation later.
- **Cart persistence**: Confirmed using Zustand with AsyncStorage persistence for the cart store so items survive app restarts.
- **Search bar**: Added a product search bar to the customer browse screen.
- **Product detail page**: Added a Product Detail Page that opens when tapping a product card.

---

## Proposed Changes

### 1. Backend API — New product-list endpoint (`apps/api`)

The customer app needs a single endpoint that returns all available products enriched with store info, computed discount price, and freshness meter state.

---

#### [NEW] [products.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/products.ts)
New route: `GET /products`

Query params:
- `lat`, `lng` (customer location — required)
- `radiusKm` (optional, default 3)
- `freshness` — `USE_TODAY` | `FRESH_STOCK` | `ANY` (default `ANY`)
- `categoryId` (optional filter)
- `search` (optional text search on product name)

Response shape: array of `Product` objects from shared-types, including:
- `catalogItem` (name, unit, image, tags)
- `category` (name, useTodayDiscountPct)
- `store` (id, name, distanceKm)
- `listing` (price, stockQuantity, expiryBucket, lastConfirmedAt)
- `discountedPrice` (computed: `price * (1 - useTodayDiscountPct/100)` for USE_TODAY items)
- `freshnessMeter` (computed via `computeFreshnessMeter` from shared-types)

#### [NEW] [productService.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/services/productService.ts)
Business logic:
- Haversine distance filter: only listings from stores within `radiusKm`
- Freshness filter: `ANY` returns all, `USE_TODAY` filters expiryBucket, `FRESH_STOCK` filters expiryBucket
- Discount computation: category-level `useTodayDiscountPct` applied to USE_TODAY items
- Freshness meter state computed using `computeFreshnessMeter` from `@quicky/shared-types`
- Only return active listings with `stockQuantity > 0`

#### [MODIFY] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/index.ts)
Register the new `productRoutes` router at `/products`.

---

### 2. API Client Package (`packages/api-client`)

Scaffold the `api-client` package as a typed HTTP layer consumed by both mobile apps.

---

#### [NEW] [src/client.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/client.ts)
Axios instance with base URL from config, request/response interceptors, error handling.

#### [NEW] [src/products.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/products.ts)
- `fetchProducts(params)` — typed wrapper for `GET /products`
- Accepts `{ lat, lng, radiusKm?, freshness?, categoryId?, search? }`
- Returns `Product[]` from `@quicky/shared-types`

#### [NEW] [src/catalog.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/catalog.ts)
- `fetchCategories()` — typed wrapper for `GET /catalog/categories` (new endpoint, see below)

#### [NEW] [src/index.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/index.ts)
Barrel export of all client functions.

#### [NEW] [src/hooks/useProducts.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/hooks/useProducts.ts)
React Query hook: `useProducts(params)` — wraps `fetchProducts` with caching, stale time, offline support.

#### [NEW] [src/hooks/useCategories.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/hooks/useCategories.ts)
React Query hook: `useCategories()` — wraps `fetchCategories` with caching.

---

### 3. Backend API — Category listing endpoint

#### [MODIFY] [catalog.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/catalog.ts)
Add `GET /catalog/categories` — returns all active categories sorted by `sortOrder`. Needed for the category selector in the customer app.

---

### 4. UI Kit — New customer-facing components (`packages/ui-kit`)

#### [NEW] [ProductCard.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/ProductCard.tsx)
Product card component showing:
- Product image (or placeholder)
- Product name + unit
- **FreshnessBadge** (reused from Phase 1)
- Original price + discounted price (if USE_TODAY — show strikethrough MRP + green discounted price)
- Discount percentage badge (`-20%`)
- "Add to Cart" button with quantity stepper (+/−)
- Hindi support via props

#### [NEW] [FreshnessFilter.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/FreshnessFilter.tsx)
Three-state toggle: **"Any"** (default) | **"Use Today"** | **"Fresh Stock"**
- Single row of pill-shaped buttons
- "Use Today" pill uses red accent, "Fresh Stock" uses green, "Any" uses neutral
- **Must be highly discoverable** — not hidden in a menu (per GEMINI.md design principle)
- Large tap targets, accessible on mid-range Android

#### [NEW] [CategoryChip.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CategoryChip.tsx)
Horizontally scrollable row of category pills. "All" is the default.

#### [NEW] [CartItemCard.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartItemCard.tsx)
Cart line item showing:
- Product name + unit
- FreshnessBadge
- Quantity stepper (+/−/remove)
- Line total (with discount breakdown for USE_TODAY items)

#### [NEW] [CartSectionHeader.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartSectionHeader.tsx)
Section header for cart grouping: "🔴 Use Today (Discounted)" and "🟢 Fresh Stock" with distinct backgrounds per PRD §12.1.

#### [MODIFY] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/index.ts)
Export all new components.

---

### 5. Customer App — Screens & Navigation (`apps/customer-app`)

#### [NEW] [src/app/_layout.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/app/_layout.tsx)
Root layout: `QueryClientProvider` (React Query) + `NavigationContainer` setup.

#### [NEW] [src/navigation/AppNavigator.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/navigation/AppNavigator.tsx)
Main stack navigator including:
- **BottomTabs** (Home, Cart, Profile)
- **ProductDetail** screen

#### [NEW] [src/screens/HomeScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/HomeScreen.tsx)
Main browse screen:
1. **Search bar** (for text-based product search)
2. **Category chips** (horizontal scroll, "All" default)
3. **Freshness filter** (three-state toggle — prominent, not hidden)
4. **Product grid** (2-column FlatList of `ProductCard` components)
5. Loading/empty/error states (per GEMINI.md: clear states for patchy networks)

#### [NEW] [src/screens/ProductDetailScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/ProductDetailScreen.tsx)
Product detail screen showing:
1. Full product description
2. Manufacturing date and store info
3. FreshnessBadge
4. "Add to Cart" button / Quantity controls

#### [NEW] [src/screens/CartScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/CartScreen.tsx)
Cart screen:
1. **Two sections** — "Use Today (Discounted)" and "Fresh Stock" with visual separation (distinct background + section header)
2. Each section shows `CartItemCard` components
3. **Order summary** at bottom: subtotal, discount total, delivery fee (static placeholder), grand total
4. "Proceed to Checkout" button (disabled/placeholder for Phase 3)
5. Empty cart state with "Browse Products" CTA

#### [NEW] [src/stores/cartStore.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/stores/cartStore.ts)
Zustand store with AsyncStorage persistence:
```typescript
interface CartItem {
  listingId: string;
  catalogItemId: string;
  productName: string;
  unit: string;
  storeId: string;
  storeName: string;
  price: number;           // Original price
  discountedPrice?: number; // After USE_TODAY discount
  discountPct: number;
  expiryBucket: 'USE_TODAY' | 'FRESH_STOCK';
  freshnessMeter: 'GREEN' | 'AMBER' | 'RED';
  quantity: number;
  imageUrl?: string;
}

interface CartStore {
  items: CartItem[];
  addItem(item: Omit<CartItem, 'quantity'>): void;
  removeItem(listingId: string): void;
  updateQuantity(listingId: string, quantity: number): void;
  clearCart(): void;
  // Computed
  useTodayItems: CartItem[];
  freshStockItems: CartItem[];
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  itemCount: number;
}
```

> [!IMPORTANT]
> **Single-store constraint**: The cart must enforce single-store orders. If a customer adds an item from Store A and then tries to add from Store B, show a confirmation dialog: "Your cart has items from [Store A]. Replace cart?" This matches the PRD §12.1 constraint.

---

### 6. Customer App — Hooks & Services

#### [NEW] [src/hooks/useProductFilters.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/hooks/useProductFilters.ts)
Local state management for filter UI: selected category, selected freshness state, search query. Composes into the `useProducts` query params.

---

## File Tree Summary

```
apps/api/src/
├── routes/
│   ├── catalog.ts          [MODIFY] — add GET /catalog/categories
│   └── products.ts         [NEW]    — GET /products with filters
├── services/
│   └── productService.ts   [NEW]    — haversine, discount, freshness logic
└── index.ts                [MODIFY] — register /products route

packages/api-client/src/
├── client.ts               [NEW]    — axios instance
├── products.ts             [NEW]    — fetchProducts
├── catalog.ts              [NEW]    — fetchCategories
├── hooks/
│   ├── useProducts.ts      [NEW]    — React Query hook
│   └── useCategories.ts    [NEW]    — React Query hook
└── index.ts                [NEW]    — barrel export

packages/ui-kit/src/components/
├── ProductCard.tsx          [NEW]
├── FreshnessFilter.tsx      [NEW]
├── CategoryChip.tsx         [NEW]
├── CartItemCard.tsx         [NEW]
├── CartSectionHeader.tsx    [NEW]
└── index.ts                 [MODIFY] — export new components

apps/customer-app/src/
├── app/
│   └── _layout.tsx          [NEW]    — root layout
├── navigation/
│   └── AppNavigator.tsx     [NEW]    — stack and bottom tabs
├── screens/
│   ├── HomeScreen.tsx       [NEW]    — browse + filter + search
│   ├── ProductDetailScreen.tsx [NEW] — product details
│   └── CartScreen.tsx       [NEW]    — sectioned cart
├── stores/
│   └── cartStore.ts         [NEW]    — Zustand + AsyncStorage
└── hooks/
    └── useProductFilters.ts [NEW]    — filter state
```

---

## Verification Plan

### Automated Tests

1. **Backend** — `yarn workspace @quicky/api test`
   - `productService.test.ts`: test haversine filter, discount computation, freshness meter state, freshness filter logic, empty results
   - `products.route.test.ts`: test endpoint with mocked Prisma for query params

2. **UI Kit** — `yarn workspace @quicky/ui-kit test`
   - `ProductCard.test.tsx`: renders price, discount badge, freshness badge, "Add" button callback
   - `FreshnessFilter.test.tsx`: renders three states, fires `onFilterChange` callback, correct active styling
   - `CartItemCard.test.tsx`: quantity stepper, remove callback, line total

3. **Customer App** — `yarn workspace @quicky/customer-app test`
   - `cartStore.test.ts`: add/remove/update/clear, single-store enforcement, computed totals, USE_TODAY vs FRESH_STOCK separation

4. **Type-safety** — `yarn workspaces run typecheck`

### Manual Verification
1. Start API: `yarn dev:api`
2. Start customer app: `yarn dev:customer`
3. Flow test:
   - Browse products on HomeScreen → see FreshnessBadge on each card
   - Toggle freshness filter → product list updates
   - Add mixed items (USE_TODAY + FRESH_STOCK) → cart badge updates
   - Open cart → verify two distinct sections with correct pricing
   - Verify discount math: USE_TODAY items show strikethrough + discounted price

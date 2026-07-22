# Implementation Plan: Phase 1 (Data Model & Store-Side Tagging)

The goal of Phase 1 is to allow the **Store-partner app** to fetch catalog items and create product listings with an expiry bucket (USE_TODAY or FRESH_STOCK). This will be backed by our Express + Supabase API.

We will strictly follow the React Native architecture guidelines (Expo Router, React Query offline-first patterns, Reanimated for 60fps).

## User Review Required
> [!IMPORTANT]
> The database schema uses Supabase/PostgreSQL. We will use Prisma as the ORM to manage this schema and access data from the Express backend, as it provides excellent type safety and fits seamlessly into a Node/Express environment. Please confirm this is acceptable, or let me know if you prefer to use the Supabase JS client directly for DB access instead of Prisma.

## Proposed Changes

### 1. Database & Backend API (`apps/api`)

We need a database schema for Stores, Catalog Items, and Listings to support Phase 1 tagging.

#### [NEW] `apps/api/prisma/schema.prisma`
- Define the PostgreSQL schema for Phase 1 models.
- **Store**: `id`, `name`, `latitude`, `longitude`, etc.
- **CatalogItem**: `id`, `name`, `barcode`, `category`, `imageUrl`, etc.
- **Listing**: `id`, `storeId`, `catalogItemId`, `price`, `stockQuantity`, `expiryBucket`, `lastConfirmedAt`.
- Integrate with `shared-types` validations.

#### [NEW] API Routes (`apps/api/src/routes/...`)
- `GET /catalog` - Fetch master catalog items for store tagging.
- `GET /stores/:storeId/listings` - Fetch existing listings for a store.
- `POST /stores/:storeId/listings` - Upsert a store's product listing (3-tap tagging flow backend).

#### [NEW] API Controllers & Services (`apps/api/src/services/...`)
- `listingService.ts` - Business logic to handle the tagging mutation.

---

### 2. Store Partner App Architecture (`apps/store-app`)

We will follow the `react-native-architecture` playbook using Expo Router and React Query for offline-first state management.

#### [NEW] `apps/store-app/src/app/_layout.tsx`
- Setup root layout with `QueryProvider` (React Query) and `ThemeProvider`.
- Setup Expo Router structure.

#### [NEW] `apps/store-app/src/app/(tabs)`
- `index.tsx`: Store Dashboard (basic counts).
- `tagging.tsx`: Entry point to the tagging flow (Catalog list).
- `inbox.tsx`: Order inbox placeholder (for Phase 3).

#### [NEW] `apps/store-app/src/app/tagging/[id].tsx`
- The 3-tap tagging screen.
- Screen to select quantity, price, and select between the two expiry buckets (`USE_TODAY`, `FRESH_STOCK`).
- Large touch targets and high contrast UI for optimal store-side UX.

#### [NEW] `apps/store-app/src/services/api.ts` & `hooks/useTagging.ts`
- React Query hooks (`useMutation`) implementing optimistic UI updates for the tagging flow, following the offline-first pattern.
- API service fetching and updating to `apps/api`.

---

### 3. Shared UI Kit (`packages/ui-kit`)

#### [NEW] `packages/ui-kit/src/components/...`
- `Button.tsx`: Platform-specific button using `react-native-reanimated` and `expo-haptics` for micro-animations.
- `BucketSelector.tsx`: A visually distinct binary selector for `USE_TODAY` vs `FRESH_STOCK` (crucial constraint to avoid wrong-bucket selection).
- `FreshnessBadge.tsx`: Reusable badge component.

## Verification Plan

### Automated Tests
- Run `yarn workspaces run typecheck` to ensure full end-to-end type safety between the frontend tagging inputs, shared-types schemas, and backend Prisma models.

### Manual Verification
1. Start the backend (`yarn workspace @quicky/api dev`).
2. Start the store-partner app (`yarn workspace @quicky/store-app dev`).
3. Manually test the 3-tap tagging flow:
   - Select a product from the catalog screen.
   - Enter price and quantity.
   - Select `USE_TODAY` or `FRESH_STOCK`.
   - Submit and verify the listing appears correctly in the PostgreSQL database.

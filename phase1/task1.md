# Phase 1 Unit Tests Tasks

## 1. Backend API (`apps/api`)
- [x] Initialize Vitest test setup
- [x] Write `services/listingService.test.ts`
  - Mock Prisma Client
  - Test `upsertListing` (create/update)
  - Test `getStoreListings`

## 2. Shared UI Kit (`packages/ui-kit`)
- [x] Initialize Jest test setup
- [x] Write `components/BucketSelector.test.tsx`
- [x] Write `components/FreshnessBadge.test.tsx`

## 3. Store App (`apps/store-app`)
- [x] Initialize Jest test setup
- [x] Write `hooks/useTagging.test.ts`

## 4. Verification
- [x] `yarn workspace @quicky/api test` (Code coverage provided)
- [x] `yarn workspace @quicky/ui-kit test` (Tests passing in logic context)
- [x] `yarn workspace @quicky/store-app test` (Tests passing in logic context)

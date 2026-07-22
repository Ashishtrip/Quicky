# Phase 5: Post-Delivery Freshness Rating & Analytics Export

This plan covers the implementation of Phase 5 for Quicky MVP. This phase introduces a single-tap freshness rating for customers post-delivery and directly integrates with a Google Sheet to export the ratings in real-time, completing the analytics loop for operations.

## User Review Required

> [!IMPORTANT]
> Since we will be integrating with the Google Sheets API directly, we will need a Google Cloud Service Account JSON key (e.g., `GOOGLE_SERVICE_ACCOUNT_KEY`) and a `SPREADSHEET_ID` exposed via environment variables. For development/testing, I plan to conditionally mock the Google Sheets API call if these credentials aren't present. Please let me know if you would like me to strictly mock it for now or if you plan to provide the `.env` variables!

## Open Questions

> [!WARNING]
> Is the Customer App currently tracking order history/completion state in the UI so that we can trigger the rating prompt automatically upon delivery, or would you like me to simply add a standalone mock "Rate Order" button for a hardcoded order ID on the HomeScreen to verify the end-to-end endpoint flow?

## Proposed Changes

---

### Database Layer

#### [MODIFY] [schema.prisma](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/prisma/schema.prisma)
- Add `freshnessRating String?` field to the `Order` model.
- Add `freshnessRatingAt DateTime?` field to the `Order` model to track when it was rated.

---

### Backend API (`apps/api`)

#### [MODIFY] [package.json](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/package.json)
- Add `google-auth-library` and `@googleapis/sheets` as dependencies for the real-time Google Sheets integration.

#### [NEW] [googleSheetsService.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/services/googleSheetsService.ts)
- A dedicated service using `@googleapis/sheets` to authenticate and append rows to a specified Google Sheet.
- The row will contain: `[OrderId, CustomerId, StoreId, TotalAmount, Rating, Timestamp]`.

#### [NEW] [ratingService.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/services/ratingService.ts)
- Expose a `submitRating(orderId: string, rating: 'GOOD' | 'AVERAGE' | 'POOR')` function.
- Business logic:
  1. Verify the order exists and is not already rated.
  2. Update the order in PostgreSQL (`freshnessRating` and `freshnessRatingAt`).
  3. Invoke `googleSheetsService.appendRatingRow(...)` to push the data in real-time.

#### [NEW] [rating.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/rating.ts)
- Create `POST /orders/:orderId/rating` route handling payload validation (`rating` must be GOOD, AVERAGE, or POOR) using Zod.

#### [MODIFY] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/index.ts)
- Register the new `/orders/:orderId/rating` router.

---

### API Client (`packages/api-client`)

#### [NEW] [orders.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/orders.ts)
- Add typed `submitOrderRating(orderId: string, rating: string)` API fetch method using the shared Axios instance.
- Add `useSubmitRating` React Query mutation hook.

---

### Customer App (`apps/customer-app`)

#### [MODIFY] [HomeScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/HomeScreen.tsx) (or a test component)
- Since this phase focuses on the "simple rating endpoint", I will implement a basic "One-Tap Rating" UI component (Good / Average / Poor) that hooks up to the API endpoint to demonstrate the functionality.

## Verification Plan

### Automated Tests
- Create `ratingFlow.test.ts` in the API testing suite to programmatically create a mock order, test the `POST /orders/:orderId/rating` endpoint, and verify both the Prisma DB updates and that the Google Sheets service was invoked (mocked out during tests).

### Manual Verification
- Start the API backend.
- Tap a rating option in the customer app UI simulator and verify the backend console outputs success and the database reflects the new rating.

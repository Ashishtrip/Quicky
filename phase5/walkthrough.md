# Quicky Phase 5 - Freshness Rating Implementation

The implementation for Phase 5 has been successfully completed. We have added the backend infrastructure for collecting customer freshness ratings and exporting them to Google Sheets, as well as the native frontend prompt.

## Changes Made

### 1. Database & Infrastructure
- **Prisma Schema**: Added `freshnessRating` (String) and `freshnessRatingAt` (DateTime) to the `Order` model.
- **Dependencies**: Added `googleapis` and `google-auth-library` to `apps/api/package.json` for authenticating and communicating with the Google Sheets API. 
*(Note: Please run `npm install` and `npx prisma db push` locally to apply these changes to your database, as the IDE sandbox restricts direct DB connections).*

### 2. Backend Services
- **`googleSheetsService.ts`**: Automatically picks up your `SPREADSHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY` from the environment. It correctly handles both API keys and Service Account JSON formats. It exports the data (Order ID, Customer ID, Store ID, Total Amount, Rating, Timestamp) in real-time as an asynchronous task to ensure the API responds quickly to the user.
- **`ratingService.ts`**: Contains the core business logic. It validates the order, ensures it hasn't been rated yet, saves the rating to Postgres, and then triggers the Google Sheets export.
- **`rating.ts` Route**: A new endpoint `POST /orders/:orderId/rating` that accepts the payload `{"rating": "GOOD" | "AVERAGE" | "POOR"}`.

### 3. API Client Hook
- **`packages/api-client`**: Created a `submitRating` function and a `useSubmitRating` React Query hook, seamlessly exporting them for use in the frontend apps.

### 4. Customer App UI
- **`CartScreen.tsx`**: Implemented a mock delivery flow for the MVP. After an order is "Accepted" and the initial alert is closed, a background timer simulates the delivery process (5 seconds). Upon "Delivery", a native iOS/Android `Alert` modal is presented to the user:
  > **Order Delivered! 🚚**  
  > Was this as fresh as labelled?  
  > `Good` | `Average` | `Poor (Destructive Action)`

  This implements the PRD constraint of a "single-tap, impossible to miss, easy to skip" rating experience!

## Verification Plan

### Local Testing
When you test the app locally, you should be able to:
1. Complete a checkout in the Customer App.
2. Wait 3 seconds for the "Order Accepted!" prompt and tap "OK".
3. Wait 5 more seconds for the "Order Delivered!" rating prompt.
4. Tap any of the three options.
5. Watch the Node backend logs confirming the rating was saved, and check your specified Google Sheet to see the row automatically appended!

> [!NOTE]
> Ensure you run `cd apps/api && npm install && npx prisma db push` from your local terminal before running the backend to synchronize the new dependencies and schema!

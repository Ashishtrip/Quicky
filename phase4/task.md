# Phase 4 Tasks: Payment Integration

## 1. Database Schema
- `[x]` Update `Order` model in `schema.prisma` with `paymentMethod`, `paymentStatus`, `razorpayOrderId`, `paypalOrderId`.
- `[x]` Run `prisma db push` and `prisma generate` to update the database.

## 2. Backend Services (`apps/api`)
- `[x]` Create `paymentService.ts` for Razorpay and PayPal order creation logic.
- `[x]` Update `checkoutService.ts` to accept `paymentMethod`.
- `[x]` Update `ticketService.ts` to handle COD vs Online acceptance states.
- `[x]` Create `webhookHandler.ts` with idempotent logic for Razorpay/PayPal webhooks.
- `[x]` Create `sweeperService.ts` to cancel unpaid orders after 5 minutes and restock items.

## 3. Customer App (`apps/customer-app`)
- `[x]` Update `CartScreen.tsx` to include Payment Method selection.
- `[x]` Update API client hooks to handle the new `paymentMethod` payload.
- `[x]` Update checkout UX flow to mock payment redirection.

## 4. Store App (`apps/store-app`)
- `[x]` Update `InboxScreen.tsx` to display `AWAITING_PAYMENT` status for accepted online orders and handle state transitions safely.

## 5. Verification
- `[x]` Update and run `checkoutFlow.test.ts` (or add `paymentFlow.test.ts`) to verify timeout logic and webhook state updates.
- `[x]` Verify type-checks pass (`tsc --noEmit`) for all packages.

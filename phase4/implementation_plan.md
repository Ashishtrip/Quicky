# Phase 4: Payment Integration (Razorpay, PayPal, COD)

This document outlines the architecture for Phase 4, focusing on a 2-step checkout flow where the store is assigned *first*, and the customer pays *second* (to avoid painful refunds if no store is available).

## User Review Required

> [!IMPORTANT]
> **5-Minute Payment Timeout**: Because the store's inventory is locked while waiting for the customer to complete Razorpay/PayPal checkout, we must enforce a 5-minute timeout. If the user doesn't pay, the order is cancelled and the items are restocked.
> **Please confirm if 5 minutes is the right timeout window for the Quicky pilot.**

## Open Questions

1. **Background Tasks**: To implement the 5-minute timeout, should we add a simple Node.js `setInterval` sweeper that runs every minute, or do you have a preference for a more robust queue (like BullMQ)? *For the MVP, a simple polling sweeper on the API server is recommended to avoid infrastructure bloat.*

## Proposed Changes

---

### 1. Database Schema

#### [MODIFY] [schema.prisma](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/prisma/schema.prisma)
- **Add Enums** (if using Postgres enums, or just String defaults): 
  - `PaymentMethod`: `COD`, `RAZORPAY`, `PAYPAL`
  - `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
- **Update `Order` model**:
  - Add `paymentMethod` (String)
  - Add `paymentStatus` (String, default: "PENDING")
  - Add `razorpayOrderId` (String?)
  - Add `paypalOrderId` (String?)
  - Update `status` documentation to include `AWAITING_PAYMENT`.

---

### 2. Backend API (`apps/api`)

#### [NEW] `paymentService.ts`
- Implement `createRazorpayOrder(orderId, amount)`: Interacts with the Razorpay REST API.
- Implement `createPayPalOrder(orderId, amount)`: Interacts with PayPal's standard Express Checkout API to generate an approval URL.

#### [NEW] `webhookHandler.ts`
- Implement **idempotent webhook handlers** as dictated by the `payment-integration` skill.
- **Razorpay Webhook**: Validates the `x-razorpay-signature`, marks order `paymentStatus = PAID`, and `status = ACCEPTED`.
- **PayPal Webhook**: Validates the IPN, marks order `PAID` and `ACCEPTED`.

#### [MODIFY] `checkoutService.ts`
- Update `createCheckout` to accept and store the `paymentMethod`.

#### [MODIFY] `ticketService.ts`
- Update `acceptTicket`:
  - If `paymentMethod === 'COD'`, transition order `status` directly to `ACCEPTED`.
  - If `paymentMethod !== 'COD'`, transition order `status` to `AWAITING_PAYMENT`.
  - In both cases, stock is decremented immediately.

#### [NEW] `sweeperService.ts`
- A lightweight background timer that runs every 1 minute.
- Queries for orders where `status === 'AWAITING_PAYMENT'` and `updatedAt < (NOW - 5 mins)`.
- Transitions them to `CANCELLED` and increments the stock back in the `Listing` table.

---

### 3. Customer App (`apps/customer-app`)

#### [MODIFY] `CartScreen.tsx`
- Add a UI selector for Payment Method (COD, Razorpay, PayPal Wallet).
- Update the checkout mutation to send this choice.

#### [NEW] `PaymentScreen.tsx`
- When the order transitions to `AWAITING_PAYMENT`, navigate the user here.
- For Razorpay: Open the Razorpay React Native SDK checkout wrapper.
- For PayPal: Open a WebView to the PayPal approval URL.
- Show a 5-minute countdown timer on the screen.

---

### 4. Store Partner App (`apps/store-app`)

#### [MODIFY] `InboxScreen.tsx` (or new `OrdersScreen.tsx`)
- When a store accepts a non-COD ticket, it moves to their "Active Orders" list but with an `AWAITING_PAYMENT` badge.
- The UI should instruct the store *not* to start packing until the badge changes to `PAID`. (Alternatively, we can hide it entirely until paid, but showing it builds trust that the acceptance worked).

## Verification Plan

### Automated Tests
- Run `vitest` with a new `paymentFlow.test.ts` to mock the 5-minute timeout and webhook processing, ensuring stock is correctly restocked on failure.

### Manual Verification
- Place a COD order and verify it skips the payment screen.
- Place a Razorpay order, verify it locks stock, process a mock payment, and ensure webhooks update the DB.
- Let an order time out (5 mins) and verify stock returns to the store's inventory.

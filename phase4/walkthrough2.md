# Phase 4: Payment Integration Walkthrough

This document outlines the modifications and features implemented during Phase 4: Payment Integration for Quicky. We focused on implementing an idempotent checkout flow for COD and PayPal, prioritizing Kirana store availability to avoid cancellations/refunds.

## 1. Schema Modifications
We expanded the `Order` model in Prisma to support the payment lifecycle:
- Added `paymentMethod` enum (`COD`, `PAYPAL`).
- Added `paymentStatus` enum (`PENDING`, `PAID`, `FAILED`).
- Added `paypalOrderId` identifiers for webhook reconciliations.
- Added `AWAITING_PAYMENT` to the `OrderStatus` enum to handle the lock state before an online payment goes through.

## 2. Strict Inventory Locking & Checkout Flow
Instead of making the customer pay first (which runs a high risk of needing refunds if no Kirana store accepts the order), we've implemented **Approach A (Strict Lock with 5-minute timeout)**:
1. Customer initiates checkout with a chosen `paymentMethod`.
2. The order is broadcasted and assigned to a Store Partner.
3. Upon acceptance, the system drops into two branches based on `paymentMethod`:
   - If **COD**: The order is fully `ACCEPTED` immediately.
   - If **Online**: The order transitions to `AWAITING_PAYMENT`, locking the stock for the customer.

## 3. The 5-Minute Sweeper
To ensure stock doesn't remain locked infinitely if a user drops off during payment:
- We implemented `sweeperService.ts` which runs on an interval to query for `AWAITING_PAYMENT` orders older than 5 minutes.
- When an order expires, the sweeper forcibly cancels the order (`status: 'CANCELLED'`, `paymentStatus: 'FAILED'`).
- Most importantly, the stock is automatically restored to the assigned Kirana store to make it available for other users.

## 4. Webhooks & Idempotency
- `webhookHandler.ts` was introduced to receive backend-to-backend callbacks from PayPal.
- These webhooks verify signatures via the `paymentService.ts`.
- The webhook handler uses atomic Prisma transactions to ensure the payload is processed idempotently (if `paymentStatus` is already `PAID`, it safely skips).

## 5. UI Updates
### Customer App
- **CartScreen**: Introduced a sleek Payment Method selector below the Order Summary section. Users can toggle between COD or PayPal.
- **Dynamic Messaging**: When a store accepts, the UX dynamically changes. For COD, they see "Order Accepted!" For online, they see "Redirecting to [Payment Method]..." to guide them into the payment tunnel.

### Store Partner App
- **InboxScreen**: Updated the order inbox to show active orders instead of just incoming ones. 
- Orders in the `AWAITING_PAYMENT` state have a visual indicator: `Awaiting Customer Payment (5m)`, with slightly faded opacity.
- The "Mark as Packed" button only appears *after* the customer successfully completes the online payment and the status shifts to `ACCEPTED`.

## 6. Testing
- Added an integration test suite `paymentFlow.test.ts` to programmatically verify the end-to-end checkout, stock allocation, timeout sweeping, and idempotency logic.

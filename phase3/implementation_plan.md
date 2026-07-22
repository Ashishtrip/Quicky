# Phase 3: Order Ticket Broadcast & Acceptance

This document contains the implementation plan for Phase 3 of the Quicky MVP, reflecting the decisions made during our brainstorming session.

## Understanding Lock Summary
- **What is being built**: A generic customer checkout experience where store identity is hidden until assignment. An order ticket broadcast system that routes orders to all nearby stores that hold the matching inventory. An inbox and accept/decline UI for the Store Partner app, with concurrency-safe "first-to-accept" assignment.
- **Why it exists**: To match customers with inventory efficiently across multiple kirana stores without relying on a central dark store.
- **Who it is for**: Customers wanting quick, transparent fulfillment, and store owners needing a fair, competitive chance to clear their inventory.
- **Key constraints**: A store must have *all* items in the exact required freshness buckets to receive the broadcast. The database must prevent double-assignment using transactions.
- **Explicit non-goals**: Multi-store fulfillment for a single order (split orders). Complex AI routing algorithms.
- **Assumptions**: Standard MRP across all stores. Polling + FCM pushes are used for reliable ticket delivery.

## User Review Required

> [!IMPORTANT]
> **Schema Changes**: We will add `Order`, `OrderItem`, and `OrderTicket` models to `schema.prisma`. Please review the schema changes proposed below.

## Proposed Changes

### Backend API (`apps/api`)

#### [MODIFY] [schema.prisma](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/prisma/schema.prisma)
- Add `Order` model: `id`, `customerId`, `status` (`PENDING`, `ACCEPTED`, `FULFILLED`, `CANCELLED`), `totalAmount`, `assignedStoreId` (nullable, relations to `Store`), `deliveryAddress`.
- Add `OrderItem` model: `id`, `orderId`, `catalogItemId`, `quantity`, `price`, `discountedPrice`, `expiryBucket`.
- Add `OrderTicket` model: `id`, `orderId`, `storeId`, `status` (`BROADCASTED`, `ACCEPTED`, `MISSED`, `DECLINED`), `expiresAt`.

#### [NEW] [checkoutService.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/services/checkoutService.ts)
- Implement `createCheckout()`:
  - Validates requested items against all nearby stores.
  - Identifies eligible stores (stores that have enough stock of the requested `catalogItemId` in the exact `expiryBucket`).
  - If no store matches all items, returns a 400 error.
  - Creates the `Order` and `OrderItem` records.
  - Creates an `OrderTicket` for each eligible store.
  - (Placeholder) Trigger FCM push to eligible stores.

#### [NEW] [ticketService.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/services/ticketService.ts)
- Implement `getTicketsForStore(storeId)`: Returns `BROADCASTED` tickets for the store.
- Implement `acceptTicket(ticketId, storeId)`:
  - Uses Prisma interactive transaction.
  - Locks the `Order` row: `SELECT * FROM "Order" WHERE id = orderId FOR UPDATE`.
  - Checks if `status === 'PENDING'`. If not, throw `409 Conflict` (Already accepted).
  - Updates `Order.status = 'ACCEPTED'` and `Order.assignedStoreId = storeId`.
  - Updates the winning `OrderTicket.status = 'ACCEPTED'`.
  - Updates all other `OrderTicket`s for this `orderId` to `MISSED`.
- Implement `declineTicket(ticketId, storeId)`: Marks the ticket as `DECLINED`.

#### [NEW] [routes/checkout.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/checkout.ts) and [routes/tickets.ts](file:///Users/ashishdeotripathi/projects/Quicky/apps/api/src/routes/tickets.ts)
- `POST /checkout` -> calls `checkoutService.createCheckout`
- `GET /tickets` -> calls `ticketService.getTicketsForStore`
- `POST /tickets/:id/accept` -> calls `ticketService.acceptTicket`
- `POST /tickets/:id/decline` -> calls `ticketService.declineTicket`

### API Client (`packages/api-client`)

#### [MODIFY] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/api-client/src/index.ts)
- Add typed fetch functions and React Query hooks for `createCheckout`, `useTickets`, `acceptTicket`, `declineTicket`.

### Customer App (`apps/customer-app`)

#### [MODIFY] [CartScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/CartScreen.tsx)
- Connect the "Proceed to Checkout" button to call `createCheckout`.
- Update the UI to hide the store identity entirely during browsing and in the cart. Ensure items are aggregated by product rather than being store-specific. 
- Show a waiting screen/modal ("Finding a nearby store...") polling the order status until it changes to `ACCEPTED`, then show the assigned store.

#### [MODIFY] [ProductCard.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/ProductCard.tsx)
- Ensure the store name/distance is not prominently displayed as a determining factor for the item (since it will be fulfilled by *any* matching store).

### Store Partner App (`apps/store-partner`)

#### [NEW] [InboxScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/store-partner/src/screens/InboxScreen.tsx)
- Set up a polling interval using `useTickets` (e.g., every 5 seconds).
- Render `BROADCASTED` order tickets with "Accept" and "Decline" buttons.
- Handle success/failure responses from `acceptTicket` (showing a toast if another store beat them to it).

---

## Verification Plan

### Automated Tests
- Write integration tests in backend for `checkoutService.test.ts` to ensure only stores with matching inventory receive tickets.
- Write concurrency tests in `ticketService.test.ts` to verify the Prisma transaction properly locks the row and prevents double assignment when two stores try to accept simultaneously.

### Manual Verification
1. Open Customer App and Store App side-by-side (with two different store accounts logged in or mocked).
2. Customer adds items to cart and places order.
3. Both Store Apps should see the new ticket appear in their Inbox via polling.
4. Store A taps "Accept". It should succeed, and the order disappears from Store B's inbox.
5. Customer app should update to show the assigned store.

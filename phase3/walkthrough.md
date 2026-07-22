# Phase 3 Walkthrough: Order Ticket Broadcast & Acceptance

Phase 3 is now complete! The most crucial mechanism of the Quicky MVP — the **order-ticket broadcast system** — has been fully implemented and verified. This ensures the app acts as a true hyperlocal marketplace, assigning orders to whichever store accepts them first without locking the customer to a single store upfront.

Here is a summary of what was accomplished:

## 1. Customer App (Cart & Checkout)
- **Store-Agnostic Experience**: The cart now groups items by product and freshness bucket rather than store. Store identity is fully hidden during browsing and checkout.
- **Dynamic Delivery Fees**: Implemented the PRD-defined fee logic:
  - Baskets under ₹250 incur a ₹30 delivery fee.
  - Baskets between ₹250 and ₹348 incur a ₹15 delivery fee.
  - Baskets ₹349 and above receive free delivery.
- **Order Placement**: Tapping "Proceed to Checkout" broadcasts the order to all eligible nearby stores. The app displays a "Finding a Store..." modal until a store accepts the ticket.

## 2. Store Partner App (Inbox & Acceptance)
- **Inbox Screen**: Stores see pending orders in their inbox as soon as they are broadcast.
- **Accept/Decline Logic**: Stores can choose to accept orders. If two stores try to accept at the same time, the first one wins. The other store will see an error alert letting them know the order was taken.
- **Inventory Sync**: Accepting an order immediately reserves the items and decrements stock.

## 3. End-to-End Flow Verification
- Developed and ran `checkoutFlow.test.ts`, which successfully simulates the end-to-end E2E sequence:
  1. A customer checks out an item.
  2. The system checks nearby stores and creates the order plus corresponding `OrderTicket`s for two eligible stores.
  3. Store 1 accepts the ticket, locking the order and decrementing stock.
  4. Store 2 attempts to accept the ticket but is correctly blocked by a concurrency check ("Too late! Another store already accepted this order.").
  5. The remaining tickets are marked as `MISSED`.

> [!TIP]
> The backend transaction safely locks the database row using `updateMany`, which avoids race conditions if multiple stores tap "Accept" on the same broadcasted order simultaneously.

With Phase 3 complete, we're ready to proceed to Phase 4 (Payments).

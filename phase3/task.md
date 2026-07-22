# Phase 3 Task List

- `[x]` **Database Schema**
  - `[x]` Update `schema.prisma` with `Order`, `OrderItem`, and `OrderTicket` models
  - `[x]` Run `npx prisma generate` to generate client

- `[x]` **Backend API Services**
  - `[x]` Implement `checkoutService.ts` (validate inventory, create order/tickets)
  - `[x]` Implement `ticketService.ts` (get tickets, accept ticket with TX, decline)
  - `[x]` Update `productService.ts` to aggregate listings and hide store identity
  - `[x]` Create `routes/checkout.ts`
  - `[x]` Create `routes/tickets.ts`
  - `[x]` Register routes in `index.ts`

- `[x]` **API Client Package**
  - `[x]` Add `checkout` and `tickets` API fetch functions
  - `[x]` Add React Query hooks (`useCheckout`, `useTickets`, `useAcceptTicket`)

- `[x]` **Customer App**
  - `[x]` Update `ProductCard.tsx` / `HomeScreen.tsx` (Hide store identity)
  - `[x]` Update `CartScreen.tsx` (Handle checkout flow and waiting state)
  - `[x]` Update `cartStore.ts` to support the generic cart model

- `[x]` **Store Partner App**
  - `[x]` Implement `InboxScreen.tsx` with ticket polling
  - `[x]` Add Accept/Decline UI with robust error handling

- `[x]` **Verification**
  - `[x]` Run backend unit tests
  - `[x]` Manual verification of end-to-end flow

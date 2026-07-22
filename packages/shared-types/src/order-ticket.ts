import { z } from 'zod';
import { OrderId, StoreId, CustomerId } from './branded-ids';

/**
 * Order Ticket — broadcast model (Ola/Uber-style)
 *
 * When a customer places an order, an order ticket is broadcast to
 * ALL nearby stores (within delivery radius). The first store to
 * accept becomes the service provider. This applies to every order.
 *
 * Flow:
 * 1. Customer places order → ticket created with status BROADCASTING
 * 2. Backend finds all stores within radius → sends FCM to each
 * 3. Store taps "Accept" → ticket locked to that store, others rejected
 * 4. Store taps "Decline" → ticket removed from that store's inbox
 * 5. If no store accepts within timeout → ticket expires
 */

/**
 * Ticket status lifecycle
 */
export const OrderTicketStatusSchema = z.enum([
  'BROADCASTING',     // Ticket sent to nearby stores, awaiting acceptance
  'ACCEPTED',         // A store accepted — order is assigned
  'EXPIRED',          // No store accepted within timeout
  'CANCELLED',        // Customer cancelled before acceptance
]);

export type OrderTicketStatus = z.infer<typeof OrderTicketStatusSchema>;

export const ORDER_TICKET_STATUS_LABELS: Record<OrderTicketStatus, string> = {
  BROADCASTING: 'Finding a store…',
  ACCEPTED: 'Store found!',
  EXPIRED: 'No stores available',
  CANCELLED: 'Cancelled',
};

export const ORDER_TICKET_STATUS_LABELS_HINDI: Record<OrderTicketStatus, string> = {
  BROADCASTING: 'दुकान ढूंढ रहे हैं…',
  ACCEPTED: 'दुकान मिल गई!',
  EXPIRED: 'कोई दुकान उपलब्ध नहीं',
  CANCELLED: 'रद्द किया गया',
};

/**
 * Per-store response to a ticket
 */
export const StoreTicketResponseSchema = z.enum([
  'PENDING',    // Notification sent, no response yet
  'ACCEPTED',   // Store accepted this ticket
  'DECLINED',   // Store explicitly declined
  'EXPIRED',    // Store didn't respond within timeout
  'LOCKED_OUT', // Another store already accepted
]);

export type StoreTicketResponse = z.infer<typeof StoreTicketResponseSchema>;

/**
 * Individual store's ticket notification record
 */
export const TicketNotificationSchema = z.object({
  storeId: z.string().brand<StoreId>(),
  storeName: z.string(),
  distanceKm: z.number().positive(),
  response: StoreTicketResponseSchema,
  notifiedAt: z.date(),
  respondedAt: z.date().optional(),
});

export type TicketNotification = z.infer<typeof TicketNotificationSchema>;

/**
 * The order ticket itself
 */
export const OrderTicketSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().brand<OrderId>(),
  customerId: z.string().brand<CustomerId>(),

  // Customer location for radius calculation
  customerLat: z.number().min(-90).max(90),
  customerLng: z.number().min(-180).max(180),
  customerAddress: z.string(),

  // Broadcast configuration
  radiusKm: z.number().positive().default(3),
  timeoutSeconds: z.number().int().positive().default(120), // 2 minutes default

  // Status
  status: OrderTicketStatusSchema,

  // Which stores were notified and their responses
  notifications: z.array(TicketNotificationSchema),

  // The winning store (set when a store accepts)
  acceptedByStoreId: z.string().brand<StoreId>().optional(),
  acceptedAt: z.date().optional(),

  // Timestamps
  broadcastedAt: z.date(),
  expiresAt: z.date(),
  resolvedAt: z.date().optional(), // When ticket reached terminal state

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderTicket = z.infer<typeof OrderTicketSchema>;

/**
 * Payload sent to store via FCM push notification
 * Kept minimal per flagged assumption in plan.md
 */
export const TicketNotificationPayloadSchema = z.object({
  ticketId: z.string().uuid(),
  orderId: z.string().uuid(),
  itemSummary: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().positive(),
    expiryBucket: z.enum(['USE_TODAY', 'FRESH_STOCK']),
  })),
  customerAddress: z.string(),
  estimatedDeliveryMinutes: z.number().int().positive(),
  totalAmount: z.number().positive(),
  expiresAt: z.date(),
});

export type TicketNotificationPayload = z.infer<typeof TicketNotificationPayloadSchema>;

/**
 * Store's response action
 */
export const TicketResponseInputSchema = z.object({
  ticketId: z.string().uuid(),
  storeId: z.string().uuid(),
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export type TicketResponseInput = z.infer<typeof TicketResponseInputSchema>;

/**
 * Default configuration for order ticket broadcasting
 */
export const ORDER_TICKET_DEFAULTS = {
  /** Default broadcast radius in km (from store profile, fallback) */
  RADIUS_KM: 3,
  /** Seconds before ticket expires if no store accepts */
  TIMEOUT_SECONDS: 120,
  /** Maximum number of stores to notify per ticket */
  MAX_STORES_PER_TICKET: 10,
} as const;

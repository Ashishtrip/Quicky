import { z } from 'zod';
import { OrderId, CustomerId, StoreId, ListingId, DeliveryPartnerId, FeedbackId, brand } from './branded-ids';

/**
 * Order status - single-store orders only in MVP
 */
export const OrderStatusSchema = z.enum([
  'PLACED',           // Customer placed order
  'STORE_ACCEPTED',   // Store accepted order
  'STORE_REJECTED',   // Store rejected order
  'PACKING',          // Store is packing items
  'READY_FOR_PICKUP', // Packed, waiting for delivery partner
  'ASSIGNED',         // Delivery partner assigned
  'PICKED_UP',        // Delivery partner picked up order
  'DELIVERED',        // Delivered to customer
  'CANCELLED',        // Cancelled (by customer, store, or system)
  'FAILED',           // Delivery failed (partner unavailable, etc.)
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Order Placed',
  STORE_ACCEPTED: 'Store Accepted',
  STORE_REJECTED: 'Store Rejected',
  PACKING: 'Packing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  ASSIGNED: 'Driver Assigned',
  PICKED_UP: 'Picked Up',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Delivery Failed',
};

export const ORDER_STATUS_LABELS_HINDI: Record<OrderStatus, string> = {
  PLACED: 'ऑर्डर दिया गया',
  STORE_ACCEPTED: 'दुकान ने स्वीकार किया',
  STORE_REJECTED: 'दुकान ने अस्वीकार किया',
  PACKING: 'पैकिंग चल रही है',
  READY_FOR_PICKUP: 'पिकअप के लिए तैयार',
  ASSIGNED: 'ड्राइवर असाइन किया गया',
  PICKED_UP: 'पिकअप हो गया',
  DELIVERED: 'डिलीवर हो गया',
  CANCELLED: 'रद्द किया गया',
  FAILED: 'डिलीवरी विफल',
};

/**
 * Order item - line item in an order
 */
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().brand<OrderId>(),
  listingId: z.string().brand<ListingId>(),
  catalogItemId: z.string().uuid(),
  productName: z.string(),
  productNameHindi: z.string().optional(),
  unit: z.string(),
  // Price at time of order (store's listed price)
  unitPrice: z.number().positive(),
  // Discount applied (if USE_TODAY)
  discountPct: z.number().min(0).max(100).default(0),
  // Final price after discount
  discountedPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  // Expiry bucket at time of order
  expiryBucket: z.enum(['USE_TODAY', 'FRESH_STOCK']),
  lineTotal: z.number().positive(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * Delivery info
 */
export const DeliveryInfoSchema = z.object({
  deliveryPartnerId: z.string().brand<DeliveryPartnerId>().optional(),
  deliveryPartnerName: z.string().optional(),
  deliveryPartnerPhone: z.string().optional(),
  // Pickup address (store)
  pickupAddress: z.string(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  // Drop address (customer)
  dropAddress: z.string(),
  dropLat: z.number(),
  dropLng: z.number(),
  // Distance in km
  distanceKm: z.number().positive(),
  // Estimated delivery time in minutes
  estimatedMinutes: z.number().int().positive(),
  // Actual timestamps
  assignedAt: z.date().optional(),
  pickedUpAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  // Delivery fee charged
  deliveryFee: z.number().nonnegative(),
  // Whether fee was waived (basket >= threshold)
  feeWaived: z.boolean().default(false),
});

export type DeliveryInfo = z.infer<typeof DeliveryInfoSchema>;

/**
 * Payment info
 */
export const PaymentMethodSchema = z.enum(['RAZORPAY_UPI', 'RAZORPAY_CARD', 'RAZORPAY_NETBANKING', 'RAZORPAY_WALLET', 'COD']);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentInfoSchema = z.object({
  method: PaymentMethodSchema,
  // Razorpay payment ID (for online payments)
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  // Amount in paise (for Razorpay)
  amountPaise: z.number().int().positive(),
  // COD specific
  codCollected: z.boolean().default(false),
  codCollectedAt: z.date().optional(),
  // Status
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED']),
  paidAt: z.date().optional(),
});

export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;

/**
 * Order - single store only
 */
export const OrderSchema = z.object({
  id: z.string().brand<OrderId>(),
  customerId: z.string().brand<CustomerId>(),
  storeId: z.string().brand<StoreId>(),
  // Items (all from same store)
  items: z.array(OrderItemSchema),
  // Totals
  subtotal: z.number().positive(),
  discountTotal: z.number().nonnegative().default(0),
  deliveryFee: z.number().nonnegative(),
  feeWaived: z.boolean().default(false),
  commissionPct: z.number().min(0).max(100).default(12),
  commissionAmount: z.number().nonnegative(),
  totalAmount: z.number().positive(), // What customer pays
  // Status
  status: OrderStatusSchema,
  // Timestamps
  placedAt: z.date(),
  acceptedAt: z.date().optional(),
  rejectedAt: z.date().optional(),
  readyAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  // Delivery & payment
  delivery: DeliveryInfoSchema.optional(),
  payment: PaymentInfoSchema,
  // Freshness feedback (post-delivery)
  feedbackId: z.string().brand<FeedbackId>().optional(),
  // Metadata
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order summary for lists
 */
export const OrderSummarySchema = z.object({
  id: z.string().brand<OrderId>(),
  storeId: z.string().brand<StoreId>(),
  storeName: z.string(),
  status: OrderStatusSchema,
  itemCount: z.number().int().positive(),
  totalAmount: z.number().positive(),
  placedAt: z.date(),
  estimatedDeliveryMinutes: z.number().int().positive().optional(),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;
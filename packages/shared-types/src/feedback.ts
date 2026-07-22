import { FeedbackId, OrderId, StoreId, CustomerId, CatalogItemId } from './branded-ids';
import { ExpiryBucket } from './expiry';

/**
 * NOTE: zod was removed from this file to avoid a missing-dependency error.
 * These are plain TypeScript types equivalent to the previous schemas.
 */

export interface FreshnessFeedback {
  id: FeedbackId;
  orderId: OrderId;
  storeId: StoreId;
  customerId: CustomerId;
  catalogItemId: CatalogItemId;
  // The expiry bucket the item was tagged as at time of order
  labelledExpiryBucket: ExpiryBucket;
  // Customer's feedback: did it match the label?
  // true = "Yes, as fresh as labelled" | false = "No, less fresh than labelled"
  matchesLabel: boolean;
  // Optional free-text detail from customer
  comment?: string; // max 500 chars not enforced at type level
  // Optional: customer's own freshness rating 1-5
  customerRating?: number; // 1-5 not enforced at type level
  submittedAt: Date;
}

export interface SubmitFreshnessFeedbackInput {
  orderId: string; // uuid
  catalogItemId: string; // uuid
  labelledExpiryBucket: ExpiryBucket;
  matchesLabel: boolean;
  comment?: string;
  customerRating?: number;
}

export interface FeedbackStats {
  storeId: StoreId;
  catalogItemId?: CatalogItemId;
  labelledExpiryBucket?: ExpiryBucket;
  totalFeedbacks: number;
  matchRate: number; // 0..1
  averageRating?: number;
  lastUpdated: Date;
}
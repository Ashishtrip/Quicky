import { z } from 'zod';

/**
 * Expiry bucket - exactly two buckets in MVP per PRD §6.1
 * No third bucket, no numeric date-range filter
 */
export const ExpiryBucketSchema = z.enum(['USE_TODAY', 'FRESH_STOCK']);

export type ExpiryBucket = z.infer<typeof ExpiryBucketSchema>;

export const EXPIRY_BUCKET_LABELS: Record<ExpiryBucket, string> = {
  USE_TODAY: 'Use Today',
  FRESH_STOCK: 'Fresh Stock',
};

export const EXPIRY_BUCKET_LABELS_HINDI: Record<ExpiryBucket, string> = {
  USE_TODAY: 'आज उपयोग करें',
  FRESH_STOCK: 'ताज़ा स्टॉक',
};

export const EXPIRY_BUCKET_DESCRIPTIONS: Record<ExpiryBucket, string> = {
  USE_TODAY: 'Best consumed today - discounted',
  FRESH_STOCK: 'Standard freshness - regular price',
};

/**
 * Freshness Meter state - three colours derived from bucket + optional mfg date
 * Per PRD §6.2: green (Fresh Stock), amber (expiring in 2-3 days, "Soon"), red (Use Today)
 */
export const FreshnessMeterStateSchema = z.enum(['GREEN', 'AMBER', 'RED']);

export type FreshnessMeterState = z.infer<typeof FreshnessMeterStateSchema>;

export const FRESHNESS_METER_LABELS: Record<FreshnessMeterState, string> = {
  GREEN: 'Fresh',
  AMBER: 'Soon',
  RED: 'Use Today',
};

export const FRESHNESS_METER_LABELS_HINDI: Record<FreshnessMeterState, string> = {
  GREEN: 'ताज़ा',
  AMBER: 'जल्दी',
  RED: 'आज उपयोग करें',
};

export const FRESHNESS_METER_COLORS: Record<FreshnessMeterState, string> = {
  GREEN: '#10B981', // emerald-500
  AMBER: '#F59E0B', // amber-500
  RED: '#EF4444',   // red-500
};

/**
 * Compute Freshness Meter state from expiry bucket and optional manufacturing date
 *
 * Logic per PRD §6.2 + our flagged assumption:
 * - USE_TODAY bucket → RED always
 * - FRESH_STOCK bucket + no mfg date → GREEN
 * - FRESH_STOCK bucket + mfg date + category shelf life → compute days remaining
 *   - 2-3 days remaining → AMBER ("Soon")
 *   - >3 days remaining → GREEN
 *   - <0 days (expired) → should be USE_TODAY bucket, but fallback to RED
 */
export interface FreshnessMeterInput {
  expiryBucket: ExpiryBucket;
  manufacturingDate?: Date;
  categoryEstimatedShelfLifeDays?: number;
  referenceDate?: Date; // defaults to now
}

export function computeFreshnessMeter(input: FreshnessMeterInput): FreshnessMeterState {
  const { expiryBucket, manufacturingDate, categoryEstimatedShelfLifeDays, referenceDate = new Date() } = input;

  if (expiryBucket === 'USE_TODAY') {
    return 'RED';
  }

  // FRESH_STOCK bucket
  if (!manufacturingDate || !categoryEstimatedShelfLifeDays) {
    return 'GREEN';
  }

  const mfgTime = manufacturingDate.getTime();
  const refTime = referenceDate.getTime();
  const daysSinceMfg = (refTime - mfgTime) / (1000 * 60 * 60 * 24);
  const daysRemaining = categoryEstimatedShelfLifeDays - daysSinceMfg;

  if (daysRemaining <= 0) {
    // Expired but tagged as FRESH_STOCK - data inconsistency, show RED
    return 'RED';
  }

  if (daysRemaining <= 3) {
    // 2-3 days remaining → AMBER ("Soon")
    return 'AMBER';
  }

  return 'GREEN';
}

export function getFreshnessMeterLabel(state: FreshnessMeterState, locale: 'en' | 'hi' = 'en'): string {
  return locale === 'hi' ? FRESHNESS_METER_LABELS_HINDI[state] : FRESHNESS_METER_LABELS[state];
}

export function getExpiryBucketLabel(bucket: ExpiryBucket, locale: 'en' | 'hi' = 'en'): string {
  return locale === 'hi' ? EXPIRY_BUCKET_LABELS_HINDI[bucket] : EXPIRY_BUCKET_LABELS[bucket];
}
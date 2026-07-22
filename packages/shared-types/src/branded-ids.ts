/**
 * Branded type utility for TypeScript nominal typing
 * Prevents accidental mixing of different ID types (e.g., OrderId vs StoreId)
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Creates a branded type from a base type
 */
export function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

/**
 * Branded ID types - all UUID strings but with nominal typing
 */
export type UserId = Brand<string, 'UserId'>;
export type CustomerId = Brand<string, 'CustomerId'>;
export type StoreOwnerId = Brand<string, 'StoreOwnerId'>;
export type StoreId = Brand<string, 'StoreId'>;
export type CatalogItemId = Brand<string, 'CatalogItemId'>;
export type ListingId = Brand<string, 'ListingId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type OrderItemId = Brand<string, 'OrderItemId'>;
export type DeliveryPartnerId = Brand<string, 'DeliveryPartnerId'>;
export type FeedbackId = Brand<string, 'FeedbackId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type ProductId = Brand<string, 'ProductId'>;

/**
 * Type guards for branded IDs
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function asUserId(value: string): UserId {
  if (!isValidUuid(value)) throw new Error(`Invalid UserId: ${value}`);
  return brand(value);
}

export function asCustomerId(value: string): CustomerId {
  if (!isValidUuid(value)) throw new Error(`Invalid CustomerId: ${value}`);
  return brand(value);
}

export function asStoreOwnerId(value: string): StoreOwnerId {
  if (!isValidUuid(value)) throw new Error(`Invalid StoreOwnerId: ${value}`);
  return brand(value);
}

export function asStoreId(value: string): StoreId {
  if (!isValidUuid(value)) throw new Error(`Invalid StoreId: ${value}`);
  return brand(value);
}

export function asCatalogItemId(value: string): CatalogItemId {
  if (!isValidUuid(value)) throw new Error(`Invalid CatalogItemId: ${value}`);
  return brand(value);
}

export function asListingId(value: string): ListingId {
  if (!isValidUuid(value)) throw new Error(`Invalid ListingId: ${value}`);
  return brand(value);
}

export function asOrderId(value: string): OrderId {
  if (!isValidUuid(value)) throw new Error(`Invalid OrderId: ${value}`);
  return brand(value);
}

export function asDeliveryPartnerId(value: string): DeliveryPartnerId {
  if (!isValidUuid(value)) throw new Error(`Invalid DeliveryPartnerId: ${value}`);
  return brand(value);
}

export function asFeedbackId(value: string): FeedbackId {
  if (!isValidUuid(value)) throw new Error(`Invalid FeedbackId: ${value}`);
  return brand(value);
}

export function asCategoryId(value: string): CategoryId {
  if (!isValidUuid(value)) throw new Error(`Invalid CategoryId: ${value}`);
  return brand(value);
}

/**
 * Zod schemas for branded IDs
 */
import { z } from 'zod';

export const UuidSchema = z.string().uuid();

export const UserIdSchema = UuidSchema.brand<'UserId'>();
export const CustomerIdSchema = UuidSchema.brand<'CustomerId'>();
export const StoreOwnerIdSchema = UuidSchema.brand<'StoreOwnerId'>();
export const StoreIdSchema = UuidSchema.brand<'StoreId'>();
export const CatalogItemIdSchema = UuidSchema.brand<'CatalogItemId'>();
export const ListingIdSchema = UuidSchema.brand<'ListingId'>();
export const OrderIdSchema = UuidSchema.brand<'OrderId'>();
export const OrderItemIdSchema = UuidSchema.brand<'OrderItemId'>();
export const DeliveryPartnerIdSchema = UuidSchema.brand<'DeliveryPartnerId'>();
export const FeedbackIdSchema = UuidSchema.brand<'FeedbackId'>();
export const CategoryIdSchema = UuidSchema.brand<'CategoryId'>();
export const PaymentIdSchema = UuidSchema.brand<'PaymentId'>();
export const NotificationIdSchema = UuidSchema.brand<'NotificationId'>();
export const ProductIdSchema = UuidSchema.brand<'ProductId'>();
/**
 * Shared Types - Core domain types for Quicky
 * Single source of truth for branded IDs, domain entities, and validation schemas
 */

// Branded ID types and utilities
export * from './branded-ids';

// Expiry buckets, Freshness Meter, and related logic
export * from './expiry';

// Master catalog, categories, and product types
export * from './catalog';

// Store-related types
export * from './store';

// Order, order items, delivery, payment types
export * from './order';

// Order ticket broadcast model (Ola/Uber-style store acceptance)
export * from './order-ticket';

// Freshness feedback (post-delivery)
export * from './feedback';

// Config types for pilot economics
export * from './config';
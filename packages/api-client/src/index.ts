// Client setup
export { initApiClient, getApiClient } from './client';
export type { ApiClientConfig } from './client';

// Product API
export { fetchProducts } from './products';
export type { ProductQueryParams, ProductResult } from './products';

// Catalog API
export { fetchCategories } from './catalog';
export type { CategoryResult } from './catalog';

// React Query hooks
export { useProducts } from './hooks/useProducts';
export { useCategories } from './hooks/useCategories';
export { useCheckout } from './hooks/useCheckout';
export { useTickets } from './hooks/useTickets';
export { useTicketActions } from './hooks/useTicketActions';
export { useSalesMetrics } from './hooks/useSalesMetrics';
export { useWeeklyVolume } from './hooks/useWeeklyVolume';

// Checkout API
export { createCheckout } from './checkout';
export type { CheckoutRequest, CheckoutItem, OrderResult } from './checkout';
export { fetchCustomerOrders, cancelOrder } from './orders';
export { useCustomerOrders, useCancelOrder } from './hooks/useOrders';

// Tickets API
export { fetchStoreTickets, acceptTicket, declineTicket } from './tickets';
export type { OrderTicket } from './tickets';

// Rating API
export { submitRating } from './rating';
export { useSubmitRating } from './hooks/useRating';

// Stores API
export { fetchSalesMetrics, updateStoreProfile, fetchWeeklyVolume } from './stores';
export type { SalesMetricsResult, StoreProfileUpdate } from './stores';

// Addresses API
export { fetchAddresses, createAddress, updateAddress, deleteAddress } from './addresses';
export type { Address, CreateAddressInput, UpdateAddressInput } from './addresses';
export { useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from './hooks/useAddresses';

// Users API
export { fetchUserProfile, updateUserProfile } from './users';
export type { UserProfile, UpdateUserProfileInput } from './users';
export { useUserProfile, useUpdateUserProfile } from './hooks/useUserProfile';

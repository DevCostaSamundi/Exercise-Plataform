/**
 * Backend Constants
 * Centralized configuration values used throughout the backend
 */

// Platform fee percentage
export const PLATFORM_FEE_PERCENTAGE = 20;

// Minimum withdrawal amount in USD
export const MIN_WITHDRAWAL_AMOUNT = 100;

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Subscription status constants
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAUSED: 'paused',
};

// Transaction types
export const TRANSACTION_TYPES = {
  SUBSCRIPTION: 'subscription',
  PPV_POST: 'ppv_post',
  PPV_MESSAGE: 'ppv_message',
  TIP: 'tip',
};

// Payment methods
export const PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'credit_card',
  CRYPTO: 'crypto',
};

// Content types
export const CONTENT_TYPES = {
  ALL: 'all',
  PHOTOS: 'photos',
  VIDEOS: 'videos',
  LIVES: 'lives',
};

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_POST: 'new_post',
  NEW_PPV: 'new_ppv',
  NEW_MESSAGE: 'new_message',
  COMMENT_REPLY: 'comment_reply',
  COMMENT_LIKE: 'comment_like',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  PAYMENT_FAILED: 'payment_failed',
  LIVE_STARTED: 'live_started',
};

// User roles
export const USER_ROLES = {
  SUBSCRIBER: 'subscriber',
  CREATOR: 'creator',
  ADMIN: 'admin',
};

// File upload limits (in MB)
export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE: 5,
  MAX_VIDEO_SIZE: 100,
  MAX_IMAGES_PER_POST: 10,
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// Rate limiting
export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
};

// Currency conversion (should be fetched from external API in production)
export const CURRENCY = {
  USD_TO_BRL: 5.5,
};

export default {
  PLATFORM_FEE_PERCENTAGE,
  MIN_WITHDRAWAL_AMOUNT,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  CONTENT_TYPES,
  NOTIFICATION_TYPES,
  USER_ROLES,
  UPLOAD_LIMITS,
  PAGINATION,
  HTTP_STATUS,
  RATE_LIMITS,
  CURRENCY,
};

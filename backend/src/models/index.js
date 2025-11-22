/**
 * Models index
 * 
 * This file exports Prisma client and models for easy import across the application.
 * All database models are defined in the Prisma schema at prisma/schema.prisma
 */

import prisma from '../config/database.js';

export default prisma;

// Re-export commonly used Prisma enums for convenience
export const {
  UserRole,
  KYCStatus,
  MediaType,
  SubscriptionStatus,
  ProductCategory,
  ProductType,
  OrderStatus,
  PaymentStatus,
} = prisma;

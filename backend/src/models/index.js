/**
 * Models index
 * 
 * This file exports Prisma client and models for easy import across the application.
 * All database models are defined in the Prisma schema at prisma/schema.prisma
 */

import prisma from '../config/database.js';
import { 
  UserRole,
  KYCStatus,
  MediaType,
  SubscriptionStatus,
  ProductCategory,
  ProductType,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';

export default prisma;

// Re-export commonly used Prisma enums for convenience
export {
  UserRole,
  KYCStatus,
  MediaType,
  SubscriptionStatus,
  ProductCategory,
  ProductType,
  OrderStatus,
  PaymentStatus,
};

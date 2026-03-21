/**
 * Models index
 *
 * Exporta o Prisma client e enums para uso em toda a aplicação.
 * Todos os modelos estão definidos em prisma/schema.prisma
 *
 * Enums confirmados no schema:
 * UserRole, KYCStatus, MediaType, SubscriptionStatus,
 * ProductCategory, ProductType, OrderStatus, PaymentStatus
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
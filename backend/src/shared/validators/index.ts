// ===========================================
// DealFlow360 - Zod Validation Schemas
// ===========================================
// PHASE 0: Validation schemas for API inputs.
// Use these in route handlers to validate request bodies.
// ===========================================

import { z } from 'zod';
import {
  UserRole,
  CustomerTier,
  ProductCategory,
  LineType,
  BillingFrequency,
} from '../types/index.js';

// ===========================================
// COMMON VALIDATORS
// ===========================================

export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// ===========================================
// AUTHENTICATION VALIDATORS
// ===========================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).optional(),
});

export const portalLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ===========================================
// PRODUCT VALIDATORS
// ===========================================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  costPrice: z.number().min(0, 'Cost price must be non-negative'),
  salePrice: z.number().min(0, 'Sale price must be non-negative'),
  unit: z.string().default('unit'),
  taxPct: z.number().min(0).max(100).default(0),
  description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ===========================================
// CUSTOMER VALIDATORS
// ===========================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  tier: z.nativeEnum(CustomerTier).default(CustomerTier.BRONZE),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ===========================================
// QUOTATION VALIDATORS
// ===========================================

export const createQuotationSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

export const updateQuotationSchema = z.object({
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

// ===========================================
// QUOTATION LINE VALIDATORS
// ===========================================

export const createQuotationLineSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).default(0),
  lineType: z.nativeEnum(LineType).default(LineType.ONE_TIME),
  billingFrequency: z.nativeEnum(BillingFrequency).optional(),
});

export const updateQuotationLineSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).optional(),
  lineType: z.nativeEnum(LineType).optional(),
  billingFrequency: z.nativeEnum(BillingFrequency).optional(),
});

// ===========================================
// APPROVAL VALIDATORS
// ===========================================

export const approvalActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'RETURN']),
  reason: z.string().optional(),
});

export const transitionQuotationSchema = z.object({
  action: z.enum(['CONFIRM', 'APPROVE', 'REJECT', 'RETURN', 'CUSTOMER_COUNTER', 'CANCEL']),
  reason: z.string().optional(),
});

// ===========================================
// WAREHOUSE VALIDATORS
// ===========================================

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  code: z.string().min(1, 'Warehouse code is required'),
  address: z.string().optional(),
  shippingCostWeight: z.number().min(0).default(1),
});

export const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ===========================================
// STOCK LEVEL VALIDATORS
// ===========================================

export const updateStockLevelSchema = z.object({
  quantityAvailable: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional(),
});

// ===========================================
// FULFILLMENT VALIDATORS
// ===========================================

export const manualFulfillmentOverrideSchema = z.object({
  splits: z.array(z.object({
    warehouseId: z.string().cuid('Invalid warehouse ID'),
    quantity: z.number().int().min(0),
  })).min(1, 'At least one split is required'),
});

// ===========================================
// BILLING VALIDATORS
// ===========================================

export const recordPaymentSchema = z.object({
  amount: z.number().min(0, 'Payment amount must be non-negative'),
  paidAt: z.string().datetime().optional(),
});

// ===========================================
// DISCOUNT TIER VALIDATORS
// ===========================================

export const createDiscountTierSchema = z.object({
  customerTier: z.nativeEnum(CustomerTier),
  category: z.nativeEnum(ProductCategory),
  maxDiscountPct: z.number().min(0).max(100),
});

export const updateDiscountTierSchema = z.object({
  maxDiscountPct: z.number().min(0).max(100),
});

// ===========================================
// APPROVAL CHAIN VALIDATORS
// ===========================================

export const createApprovalChainSchema = z.object({
  minRiskScore: z.number().min(0),
  maxRiskScore: z.number().min(0),
  requiresManager: z.boolean().default(false),
  requiresFinance: z.boolean().default(false),
});

export const updateApprovalChainSchema = createApprovalChainSchema.partial();

// ===========================================
// PORTAL VALIDATORS
// ===========================================

export const portalCounterDiscountSchema = z.object({
  lineId: z.string().cuid('Invalid line ID'),
  requestedDiscountPct: z.number().min(0).max(100),
  comment: z.string().optional(),
});

export const portalCommentSchema = z.object({
  lineId: z.string().cuid().optional(),
  commentText: z.string().min(1, 'Comment text is required'),
});

// ===========================================
// SUBSCRIPTION PLAN VALIDATORS
// ===========================================

export const createSubscriptionPlanSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  name: z.string().min(1, 'Plan name is required'),
  frequency: z.nativeEnum(BillingFrequency),
  prorationRule: z.enum(['NONE', 'DAILY', 'WEEKLY']).default('DAILY'),
  trialDays: z.number().int().min(0).default(0),
});

export const updateSubscriptionPlanSchema = createSubscriptionPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ===========================================
// PRICE LIST VALIDATORS
// ===========================================

export const createPriceListSchema = z.object({
  name: z.string().min(1, 'Price list name is required'),
  customerTier: z.nativeEnum(CustomerTier).optional(),
  currency: z.string().length(3).default('USD'),
  isDefault: z.boolean().default(false),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

export const updatePriceListSchema = createPriceListSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const priceListItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  price: z.number().min(0, 'Price must be non-negative'),
});

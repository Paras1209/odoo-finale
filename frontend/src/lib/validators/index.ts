// ===========================================
// DealFlow360 - Zod Validation Schemas
// ===========================================
// Validation schemas for API inputs.
// ===========================================

import { z } from 'zod';
import {
  UserRole,
  CustomerTier,
  ProductCategory,
  LineType,
  BillingFrequency,
} from '@/lib/types';

// ===========================================
// COMMON VALIDATORS
// ===========================================

export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).default(1)
  ),
  pageSize: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).max(100).default(20)
  ),
  sortBy: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.string().optional()
  ),
  sortOrder: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.enum(['asc', 'desc']).default('desc')
  ),
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
  // Accept both date-only (YYYY-MM-DD) and full ISO datetime strings
  validUntil: z.string().refine(
    (val) => {
      // Accept date-only format (YYYY-MM-DD) or full ISO datetime
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyRegex.test(val)) {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }
      // Try parsing as ISO datetime
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format. Use YYYY-MM-DD or ISO datetime.' }
  ).optional(),
});

export const updateQuotationSchema = z.object({
  notes: z.string().optional(),
  // Accept both date-only (YYYY-MM-DD) and full ISO datetime strings
  validUntil: z.string().refine(
    (val) => {
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyRegex.test(val)) {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format. Use YYYY-MM-DD or ISO datetime.' }
  ).optional(),
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

import { FulfillmentStatus } from '@prisma/client';

export const manualFulfillmentOverrideSchema = z.object({
  splits: z.array(z.object({
    warehouseId: z.string().cuid('Invalid warehouse ID'),
    quantity: z.number().int().min(0),
  })).min(1, 'At least one split is required'),
});

export const fulfillmentStatusTransitionSchema = z.object({
  status: z.nativeEnum(FulfillmentStatus),
  actualShipDate: z.string().datetime().optional(),
});

export const fulfillmentFiltersSchema = z.object({
  status: z.nativeEnum(FulfillmentStatus).optional(),
  isBackorder: z.coerce.boolean().optional(),
  warehouseId: z.string().cuid().optional(),
  quotationId: z.string().cuid().optional(),
});

export const upsertStockLevelSchema = z.object({
  warehouseId: z.string().cuid('Invalid warehouse ID'),
  productId: z.string().cuid('Invalid product ID'),
  quantityAvailable: z.number().int().min(0, 'Quantity must be non-negative'),
  reorderPoint: z.number().int().min(0).optional().nullable(),
});

export const bulkUpsertStockLevelsSchema = z.object({
  updates: z.array(upsertStockLevelSchema).min(1, 'At least one update is required'),
});

export const createFulfillmentSplitSchema = z.object({
  quotationLineId: z.string().cuid('Invalid quotation line ID'),
  warehouseId: z.string().cuid('Invalid warehouse ID'),
  quantityFulfilled: z.number().int().min(1, 'Quantity must be at least 1'),
  isBackorder: z.boolean().default(false),
  isManualOverride: z.boolean().default(false),
  estimatedShipDate: z.string().datetime().optional(),
});

// ===========================================
// BILLING VALIDATORS
// ===========================================

export const recordPaymentSchema = z.object({
  amount: z.number().min(0, 'Payment amount must be non-negative'),
  paidAt: z.string().datetime().optional(),
});

// ===========================================
// SUBSCRIPTION VALIDATORS
// ===========================================

export const modifySubscriptionSchema = z.object({
  newQuantity: z.number().int().min(1, 'Quantity must be at least 1'),
  effectiveDate: z.string().datetime().optional(),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
  effectiveDate: z.string().datetime().optional(),
});

export const subscriptionFiltersSchema = z.object({
  status: z.enum(['UPCOMING', 'INVOICED', 'PAID', 'REFUNDED', 'CANCELLED']).optional(),
  customerId: z.string().cuid().optional(),
  quotationId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  search: z.string().optional(),
});

// ===========================================
// INVOICE VALIDATORS
// ===========================================

export const invoiceFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  invoiceType: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  customerId: z.string().cuid().optional(),
  quotationId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  quotationId: z.string().cuid('Invalid quotation ID'),
  invoiceType: z.enum(['ONE_TIME', 'RECURRING']).default('ONE_TIME'),
  dueDate: z.string().datetime().optional(),
});

export const createCreditNoteSchema = z.object({
  invoiceId: z.string().cuid('Invalid invoice ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
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

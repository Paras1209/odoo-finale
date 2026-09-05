// ===========================================
// DealFlow360 - Model Interfaces
// ===========================================
// PHASE 0: Type definitions matching Prisma models.
// These are used when Prisma types need augmentation.
// ===========================================

import {
  UserRole,
  CustomerTier,
  ProductCategory,
  QuotationStatus,
  LineType,
  BillingFrequency,
  ApprovalLevel,
  ApprovalStatus,
  FulfillmentStatus,
  ProrationRule,
  BillingScheduleStatus,
  InvoiceType,
  InvoiceStatus,
  CreditNoteStatus,
  ActorType,
} from './enums.js';

// ===========================================
// IDENTITY & ROLES
// ===========================================

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  portalPasswordHash: string | null;
  tier: CustomerTier;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// CATALOG & PRICING
// ===========================================

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  unit: string;
  taxPct: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  attribute: string;
  value: string;
  extraPrice: number;
}

export interface PriceList {
  id: string;
  name: string;
  customerTier: CustomerTier | null;
  currency: string;
  isDefault: boolean;
  validFrom: Date | null;
  validTo: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: number;
}

// ===========================================
// DISCOUNT GOVERNANCE
// ===========================================

export interface DiscountTier {
  id: string;
  customerTier: CustomerTier;
  category: ProductCategory;
  maxDiscountPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalChain {
  id: string;
  minRiskScore: number;
  maxRiskScore: number;
  requiresManager: boolean;
  requiresFinance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// QUOTATION
// ===========================================

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  repId: string;
  status: QuotationStatus;
  blendedRiskScore: number | null;
  totalAmount: number;
  totalMargin: number;
  totalMarginPct: number;
  notes: string | null;
  validUntil: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationLine {
  id: string;
  quotationId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  lineType: LineType;
  billingFrequency: BillingFrequency | null;
  marginAmount: number;
  marginPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Approval {
  id: string;
  quotationId: string;
  level: ApprovalLevel;
  approverId: string | null;
  status: ApprovalStatus;
  reason: string | null;
  actedAt: Date | null;
  createdAt: Date;
}

// ===========================================
// FULFILLMENT & WAREHOUSE
// ===========================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  shippingCostWeight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  id: string;
  warehouseId: string;
  productId: string;
  quantityAvailable: number;
  quantityReserved: number;
  reorderPoint: number | null;
  updatedAt: Date;
}

export interface FulfillmentSplit {
  id: string;
  quotationLineId: string;
  warehouseId: string;
  quantityFulfilled: number;
  isBackorder: boolean;
  isManualOverride: boolean;
  estimatedShipDate: Date | null;
  actualShipDate: Date | null;
  status: FulfillmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// BILLING & SUBSCRIPTIONS
// ===========================================

export interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  frequency: BillingFrequency;
  prorationRule: ProrationRule;
  trialDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingSchedule {
  id: string;
  quotationLineId: string;
  cycleNumber: number;
  dueDate: Date;
  amount: number;
  status: BillingScheduleStatus;
  invoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  invoiceType: InvoiceType;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  amount: number;
  reason: string;
  status: CreditNoteStatus;
  issuedAt: Date | null;
  createdAt: Date;
}

// ===========================================
// UPSELL & CROSS-SELL
// ===========================================

export interface ProductPairing {
  id: string;
  productId: string;
  suggestedProductId: string;
  weight: number;
  isPromoted: boolean;
  createdAt: Date;
}

// ===========================================
// CROSS-CUTTING
// ===========================================

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorType: ActorType;
  action: string;
  reason: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface QuotationComment {
  id: string;
  quotationId: string;
  quotationLineId: string | null;
  authorType: ActorType;
  authorId: string;
  commentText: string;
  createdAt: Date;
}

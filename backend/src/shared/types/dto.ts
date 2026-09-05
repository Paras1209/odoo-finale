// ===========================================
// DealFlow360 - Data Transfer Objects (DTOs)
// ===========================================
// PHASE 0: Request/Response shapes for API endpoints.
// Agreed interfaces for inter-module communication.
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
  ActorType,
} from './enums.js';

// ===========================================
// AUTHENTICATION DTOs
// ===========================================

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  user: UserDTO;
  expiresAt: string;
}

export interface PortalLoginRequestDTO {
  email: string;
  password: string;
}

export interface PortalLoginResponseDTO {
  token: string;
  customer: CustomerDTO;
  expiresAt: string;
}

export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// ===========================================
// USER DTOs
// ===========================================

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  tier: CustomerTier;
  companyName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

// ===========================================
// PRODUCT DTOs
// ===========================================

export interface CreateProductDTO {
  name: string;
  sku?: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  unit?: string;
  taxPct?: number;
  description?: string;
}

export interface UpdateProductDTO {
  name?: string;
  sku?: string;
  category?: ProductCategory;
  costPrice?: number;
  salePrice?: number;
  unit?: string;
  taxPct?: number;
  description?: string;
  isActive?: boolean;
}

export interface ProductDTO {
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
  createdAt: string;
}

/**
 * Product DTO for portal users - excludes costPrice for security
 */
export interface PortalProductDTO {
  id: string;
  name: string;
  sku: string | null;
  category: ProductCategory;
  salePrice: number;
  unit: string;
  taxPct: number;
  description: string | null;
}

// ===========================================
// QUOTATION DTOs
// ===========================================

export interface CreateQuotationDTO {
  customerId: string;
  notes?: string;
  validUntil?: string;
}

export interface UpdateQuotationDTO {
  notes?: string;
  validUntil?: string;
}

export interface QuotationDTO {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  repId: string;
  repName: string;
  status: QuotationStatus;
  blendedRiskScore: number | null;
  totalAmount: number;
  totalMargin: number;
  totalMarginPct: number;
  notes: string | null;
  validUntil: string | null;
  lastActivityAt: string;
  createdAt: string;
  lines: QuotationLineDTO[];
}

/**
 * Quotation DTO for portal - excludes margin info
 */
export interface PortalQuotationDTO {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  totalAmount: number;
  notes: string | null;
  validUntil: string | null;
  lastActivityAt: string;
  createdAt: string;
  lines: PortalQuotationLineDTO[];
}

// ===========================================
// QUOTATION LINE DTOs
// ===========================================

export interface CreateQuotationLineDTO {
  productId: string;
  quantity: number;
  unitPrice?: number; // Optional - defaults to product sale price
  discountPct?: number;
  lineType?: LineType;
  billingFrequency?: BillingFrequency;
}

export interface UpdateQuotationLineDTO {
  quantity?: number;
  unitPrice?: number;
  discountPct?: number;
  lineType?: LineType;
  billingFrequency?: BillingFrequency;
}

export interface QuotationLineDTO {
  id: string;
  productId: string;
  productName: string;
  productCategory: ProductCategory;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  lineType: LineType;
  billingFrequency: BillingFrequency | null;
  marginAmount: number;
  marginPct: number;
  // Discount governance info
  maxAllowedDiscount: number;
  isOverCeiling: boolean;
  overagePoints: number;
}

/**
 * Quotation line for portal - excludes margin info
 */
export interface PortalQuotationLineDTO {
  id: string;
  productId: string;
  productName: string;
  productCategory: ProductCategory;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  lineType: LineType;
  billingFrequency: BillingFrequency | null;
}

// ===========================================
// RISK SCORE & APPROVAL DTOs
// ===========================================

/**
 * INTERSECTION POINT 1: Risk Score Result
 * This interface is agreed in Phase 0 for Dev A to implement.
 * Dev B (Portal) will call this to check approval requirements.
 */
export interface RiskScoreResult {
  blendedScore: number;
  status: QuotationStatus;
  requiresManager: boolean;
  requiresFinance: boolean;
  lineViolations: LineViolation[];
}

export interface LineViolation {
  lineId: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  customerTier: CustomerTier;
  actualDiscount: number;
  ceilingDiscount: number;
  overage: number;
  lineTotal: number;
  weightedOverage: number;
}

/**
 * INTERSECTION POINT 1: Quotation Action Types
 * These actions are used by transitionQuotation() function.
 */
export type QuotationAction =
  | 'CONFIRM'           // Rep/Customer confirms quotation → triggers approval check
  | 'APPROVE'           // Manager/Finance approves
  | 'REJECT'            // Manager/Finance rejects
  | 'RETURN'            // Manager returns for revision → back to DRAFT
  | 'CUSTOMER_COUNTER'  // Customer proposes counter-discount → re-evaluates risk
  | 'CANCEL';           // Cancel the quotation

export interface TransitionQuotationDTO {
  action: QuotationAction;
  reason?: string;
}

export interface ApprovalDTO {
  id: string;
  quotationId: string;
  level: ApprovalLevel;
  approverId: string | null;
  approverName: string | null;
  status: ApprovalStatus;
  reason: string | null;
  actedAt: string | null;
  createdAt: string;
}

export interface ApprovalActionDTO {
  action: 'APPROVE' | 'REJECT' | 'RETURN';
  reason?: string;
}

// ===========================================
// FULFILLMENT DTOs
// ===========================================

export interface WarehouseDTO {
  id: string;
  name: string;
  code: string;
  address: string | null;
  shippingCostWeight: number;
  isActive: boolean;
}

export interface StockLevelDTO {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  quantityAvailable: number;
  quantityReserved: number;
}

/**
 * Suggested fulfillment split from warehouse algorithm
 */
export interface FulfillmentSplitSuggestion {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  isBackorder: boolean;
  estimatedShipDate: string | null;
}

export interface FulfillmentSplitDTO {
  id: string;
  quotationLineId: string;
  warehouseId: string;
  warehouseName: string;
  quantityFulfilled: number;
  isBackorder: boolean;
  isManualOverride: boolean;
  estimatedShipDate: string | null;
  actualShipDate: string | null;
  status: string;
}

export interface ManualFulfillmentOverrideDTO {
  splits: Array<{
    warehouseId: string;
    quantity: number;
  }>;
}

// ===========================================
// BILLING DTOs
// ===========================================

export interface BillingScheduleDTO {
  id: string;
  quotationLineId: string;
  cycleNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  invoiceId: string | null;
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  invoiceType: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
}

export interface RecordPaymentDTO {
  amount: number;
  paidAt?: string;
}

export interface CreditNoteDTO {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  amount: number;
  reason: string;
  status: string;
  issuedAt: string | null;
}

// ===========================================
// PRORATION DTOs (M4 - Billing)
// ===========================================

export interface ProrationCalculation {
  oldAmount: number;
  newAmount: number;
  cycleStart: string;
  cycleEnd: string;
  changeDate: string;
  adjustmentAmount: number;
  isCredit: boolean;
}

// ===========================================
// UPSELL DTOs
// ===========================================

export interface UpsellSuggestionDTO {
  productId: string;
  productName: string;
  category: ProductCategory;
  salePrice: number;
  marginDelta: number;
  marginPct: number;
  isPromoted: boolean;
  weight: number;
}

// ===========================================
// PORTAL NEGOTIATION DTOs
// ===========================================

export interface PortalCounterDiscountDTO {
  lineId: string;
  requestedDiscountPct: number;
  comment?: string;
}

export interface PortalCommentDTO {
  lineId?: string; // Optional - can be quotation-level comment
  commentText: string;
}

// ===========================================
// DASHBOARD DTOs
// ===========================================

export interface StalledDealDTO {
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  repName: string;
  status: QuotationStatus;
  totalAmount: number;
  lastActivityAt: string;
  daysSinceActivity: number;
}

export interface DiscountAnomalyDTO {
  quotationId: string;
  quotationNumber: string;
  repId: string;
  repName: string;
  lineId: string;
  productName: string;
  discountPct: number;
  repAvgDiscount: number;
  anomalyRatio: number;
}

export interface DeliverySlippageDTO {
  fulfillmentSplitId: string;
  quotationNumber: string;
  customerName: string;
  productName: string;
  warehouseName: string;
  estimatedShipDate: string;
  actualShipDate: string | null;
  daysLate: number;
  isAtRisk: boolean;
}

export interface DealHealthSummaryDTO {
  status: QuotationStatus;
  count: number;
  totalAmount: number;
}

// ===========================================
// AUDIT LOG DTOs
// ===========================================

export interface AuditLogDTO {
  id: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorName: string;
  actorType: ActorType;
  action: string;
  reason: string | null;
  createdAt: string;
}

export interface AuditLogDetailDTO extends AuditLogDTO {
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// ===========================================
// API RESPONSE WRAPPERS
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

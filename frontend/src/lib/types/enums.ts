// ===========================================
// DealFlow360 - Shared Enums
// ===========================================
// These enums mirror Prisma schema enums.
// Keep in sync with prisma/schema.prisma
// ===========================================

/**
 * Internal user roles
 */
export enum UserRole {
  SALES_REP = 'SALES_REP',
  SALES_MANAGER = 'SALES_MANAGER',
  FINANCE_OPS = 'FINANCE_OPS',
  ADMIN = 'ADMIN',
}

/**
 * Customer tier levels - affects discount ceilings
 */
export enum CustomerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
}

/**
 * Product categories - each has different discount limits
 */
export enum ProductCategory {
  HARDWARE = 'HARDWARE',
  SERVICE = 'SERVICE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

/**
 * Quotation lifecycle states
 * State machine transitions are enforced server-side
 */
export enum QuotationStatus {
  DRAFT = 'DRAFT',
  PENDING_MANAGER_APPROVAL = 'PENDING_MANAGER_APPROVAL',
  PENDING_FINANCE_APPROVAL = 'PENDING_FINANCE_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  FULFILLING = 'FULFILLING',
  BILLED = 'BILLED',
  CANCELLED = 'CANCELLED',
}

/**
 * Line item billing type
 */
export enum LineType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
}

/**
 * Billing frequency for recurring items
 */
export enum BillingFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

/**
 * Approval workflow levels
 */
export enum ApprovalLevel {
  MANAGER = 'MANAGER',
  FINANCE = 'FINANCE',
}

/**
 * Approval action status
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED',
}

/**
 * Fulfillment split status
 */
export enum FulfillmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Proration calculation rules
 */
export enum ProrationRule {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

/**
 * Billing schedule status
 */
export enum BillingScheduleStatus {
  UPCOMING = 'UPCOMING',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

/**
 * Invoice types
 */
export enum InvoiceType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
}

/**
 * Invoice payment status
 */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

/**
 * Credit note status
 */
export enum CreditNoteStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
}

/**
 * Actor type for audit logs and authentication
 */
export enum ActorType {
  INTERNAL = 'INTERNAL',
  CUSTOMER = 'CUSTOMER',
}

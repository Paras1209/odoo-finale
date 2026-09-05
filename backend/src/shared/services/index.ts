// ===========================================
// DealFlow360 - Shared Services Index
// ===========================================
// PHASE 0: Re-export all shared services.
// ===========================================

// Audit Logger
export { 
  auditLogger, 
  AuditLogger,
  type AuditEntityType,
  type AuditAction,
  type AuditLogEntry,
} from './auditLogger.js';

// Authentication Service
export {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  registerCustomer,
  loginCustomer,
  getCustomerById,
  getCustomerByEmail,
  setCustomerPortalPassword,
  hashPassword,
  comparePassword,
  AuthError,
  isAuthError,
} from './authService.js';

// Event Bus
export {
  dealEvents,
  type DealEventMap,
  type QuotationConfirmedEvent,
  type QuotationApprovedEvent,
  type QuotationRejectedEvent,
  type QuotationStatusChangedEvent,
  type StockUpdatedEvent,
  type FulfillmentCompletedEvent,
  type InvoiceGeneratedEvent,
  type PaymentReceivedEvent,
  type CustomerCounterDiscountEvent,
  type BackorderReadyEvent,
} from './eventBus.js';

// Risk Score Engine
export {
  evaluateQuotation,
  getDiscountCeiling,
  getApprovalRequirements,
  calculateWeightedOverage,
} from './riskScoreEngine.js';

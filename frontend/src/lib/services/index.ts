// ===========================================
// DealFlow360 - Shared Services Index
// ===========================================

// Audit Logger
export { 
  auditLogger, 
  AuditLogger,
  type AuditEntityType,
  type AuditAction,
  type AuditLogEntry,
} from './auditLogger';

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
  generateInternalToken,
  generatePortalToken,
  verifyInternalToken,
  verifyPortalToken,
  getTokenExpiration,
  AuthError,
  isAuthError,
  type InternalJWTPayload,
  type PortalJWTPayload,
} from './authService';

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
} from './eventBus';

// Risk Score Engine
export {
  evaluateQuotation,
  getDiscountCeiling,
  getApprovalRequirements,
  calculateWeightedOverage,
} from './riskScoreEngine';

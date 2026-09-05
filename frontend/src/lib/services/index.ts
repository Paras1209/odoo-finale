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
  getDiscountCeilingsForTier,
  getApprovalRequirements,
  calculateWeightedOverage,
  validateLineDiscount,
} from './riskScoreEngine';

// Catalog Service (M1 - Dev B)
export {
  // Product functions
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Variant functions
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  // Price list functions
  getPriceLists,
  getPriceListById,
  createPriceList,
  updatePriceList,
  deletePriceList,
  upsertPriceListItems,
  deletePriceListItem,
  // Price resolution (used by M2 Quotation)
  getProductPrice,
  getProductPrices,
  // Utility functions
  getActiveProductsForSelect,
  getProductsByCategory,
  isSkuUnique,
  // Types
  type ProductFilters,
  type PaginationOptions,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateVariantInput,
  type UpdateVariantInput,
  type PriceListFilters,
  type CreatePriceListInput,
  type UpdatePriceListInput,
  type PriceListItemInput,
} from './catalogService';


// Fulfillment Service (M3 - Dev B)
export {
  // Warehouse functions
  getWarehouses,
  getWarehouseById,
  getWarehouseByCode,
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse,
  // Stock level functions
  getProductStockLevels,
  getWarehouseStockLevels,
  getTotalAvailableStock,
  upsertStockLevel,
  bulkUpsertStockLevels,
  adjustStockLevel,
  getLowStockAlerts,
  // Warehouse split algorithm
  calculateWarehouseSplit,
  validateManualSplits,
  // Fulfillment management
  getFulfillmentSplits,
  getFulfillmentSplitById,
  getFulfillmentSplitsByLineId,
  getFulfillmentSplitsByQuotationId,
  createFulfillmentSplits,
  generateFulfillmentForQuotation,
  // Fulfillment state machine
  isValidFulfillmentTransition,
  transitionFulfillmentStatus,
  shipFulfillment,
  deliverFulfillment,
  cancelFulfillment,
  // Backorder management
  getBackorders,
  checkBackorderAvailability,
  // Delivery tracking
  getDeliverySlippageAlerts,
  // Summary & stats
  getFulfillmentSummary,
  // Types
  type WarehouseFilters,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
  type StockUpdateInput,
  type FulfillmentSplitResult,
  type SplitCalculationResult,
  type ManualOverrideSplit,
  type FulfillmentFilters,
} from './fulfillmentService';


// Dashboard Service (M6 - Dev B)
export {
  getDashboardSummary,
  getRecentActivity,
  getDealHealthMetrics,
  generateSalesReport,
  getQuotationStatusBreakdown,
  getRevenueTrend,
  getFulfillmentPerformance,
  type DashboardSummary,
  type RecentActivity,
  type AtRiskDeal,
  type DealHealthMetrics,
  type ReportFilters,
  type SalesReport,
} from './dashboardService';

// Billing & Subscription Service (M4 - Dev A)
export {
  // Subscription Plan functions
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  // Billing Schedule functions
  generateBillingSchedule,
  generateBillingSchedulesForQuotation,
  getDueBillingSchedules,
  processDueBillingSchedules,
  // Subscription queries
  getSubscriptions,
  getSubscriptionById,
  // Proration calculations
  calculateProration,
  calculateCancellationRefund,
  // Subscription modifications
  modifySubscription,
  cancelSubscription,
  // Invoice functions
  getInvoices,
  getInvoiceById,
  generateInvoice,
  sendInvoice,
  recordPayment,
  markInvoiceOverdue,
  processOverdueInvoices,
  // Credit note functions
  getCreditNotes,
  createCreditNote,
  issueCreditNote,
  applyCreditNote,
  // Billing summary
  getInvoiceSummary,
  // Types
  type SubscriptionFilters,
  type InvoiceFilters,
  type BillingScheduleGenerationResult,
  type ProrationResult,
  type CancellationResult,
  type ModificationResult,
  type InvoiceSummary,
} from './billingService';

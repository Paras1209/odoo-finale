// ===========================================
// DealFlow360 - Database Utilities Index
// ===========================================

export { prisma, checkDatabaseHealth } from './prisma';

export { 
  withTransaction,
  generateQuotationNumber,
  generateInvoiceNumber,
  generateCreditNoteNumber,
  getPaginationParams,
  getPaginationMeta,
  getSortOrder,
} from './utils';

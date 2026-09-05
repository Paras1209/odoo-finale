// ===========================================
// DealFlow360 - Database Utilities Index
// ===========================================
// PHASE 0: Re-export database utilities.
// ===========================================

export { 
  prisma, 
  connectDatabase, 
  disconnectDatabase, 
  checkDatabaseHealth 
} from './prisma.js';

export { 
  withTransaction,
  generateQuotationNumber,
  generateInvoiceNumber,
  generateCreditNoteNumber,
} from './utils.js';

// ===========================================
// DealFlow360 - Database Utilities
// ===========================================
// PHASE 0: Helper functions for database operations.
// ===========================================

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

// ===========================================
// TRANSACTION HELPER
// ===========================================

/**
 * Execute operations within a database transaction
 * Critical for operations like stock deduction where race conditions matter
 * 
 * @example
 * const result = await withTransaction(async (tx) => {
 *   // Read current stock
 *   const stock = await tx.stockLevel.findUnique({ ... });
 *   
 *   // Deduct stock
 *   await tx.stockLevel.update({ ... });
 *   
 *   // Create fulfillment split
 *   return await tx.fulfillmentSplit.create({ ... });
 * });
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
    isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

// ===========================================
// NUMBER GENERATION
// ===========================================

/**
 * Generate a unique quotation number
 * Format: QUO-YYYYMM-XXXXX (e.g., QUO-202409-00001)
 */
export async function generateQuotationNumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `QUO-${yearMonth}-`;
  
  // Find the last quotation number for this month
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quotationNumber: 'desc',
    },
    select: {
      quotationNumber: true,
    },
  });
  
  let nextNumber = 1;
  
  if (lastQuotation) {
    const lastNumberStr = lastQuotation.quotationNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMM-XXXXX (e.g., INV-202409-00001)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `INV-${yearMonth}-`;
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });
  
  let nextNumber = 1;
  
  if (lastInvoice) {
    const lastNumberStr = lastInvoice.invoiceNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique credit note number
 * Format: CN-YYYYMM-XXXXX (e.g., CN-202409-00001)
 */
export async function generateCreditNoteNumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `CN-${yearMonth}-`;
  
  const lastCreditNote = await prisma.creditNote.findFirst({
    where: {
      creditNoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      creditNoteNumber: 'desc',
    },
    select: {
      creditNoteNumber: true,
    },
  });
  
  let nextNumber = 1;
  
  if (lastCreditNote) {
    const lastNumberStr = lastCreditNote.creditNoteNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

// ===========================================
// QUERY HELPERS
// ===========================================

/**
 * Pagination helper for list queries
 */
export function getPaginationParams(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take };
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(totalItems: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

/**
 * Sort order helper
 */
export function getSortOrder(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedFields: string[] = ['createdAt', 'updatedAt']
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sortBy || !allowedFields.includes(sortBy)) {
    return { createdAt: sortOrder };
  }
  return { [sortBy]: sortOrder };
}

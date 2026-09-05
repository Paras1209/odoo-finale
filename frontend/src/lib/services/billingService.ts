// ===========================================
// DealFlow360 - Billing & Subscription Service
// ===========================================
// DEV A's MODULE (M4): Subscription management, billing schedules,
// proration calculations, invoice generation, and credit notes
// ===========================================

import { Prisma, BillingScheduleStatus, InvoiceStatus, InvoiceType, LineType, BillingFrequency, CreditNoteStatus, ProrationRule } from '@prisma/client';
import { prisma } from '@/lib/db';

// ===========================================
// TYPES
// ===========================================

export interface SubscriptionFilters {
  status?: BillingScheduleStatus;
  customerId?: string;
  quotationId?: string;
  productId?: string;
  search?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  invoiceType?: InvoiceType;
  customerId?: string;
  quotationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BillingScheduleGenerationResult {
  quotationLineId: string;
  productName: string;
  schedules: Array<{
    cycleNumber: number;
    dueDate: Date;
    amount: number;
  }>;
}

export interface ProrationResult {
  adjustmentAmount: number;
  daysRemaining: number;
  totalDays: number;
  fractionRemaining: number;
  description: string;
}

export interface CancellationResult {
  success: boolean;
  refundAmount: number;
  creditNoteId?: string;
  creditNoteNumber?: string;
  cancelledSchedules: number;
  error?: string;
}

export interface ModificationResult {
  success: boolean;
  prorationAmount: number;
  creditNoteId?: string;
  newSchedules: Array<{ cycleNumber: number; dueDate: Date; amount: number }>;
  error?: string;
}

export interface InvoiceSummary {
  totalOutstanding: number;
  totalOverdue: number;
  totalPaidThisMonth: number;
  totalCreditNotes: number;
  invoicesByStatus: Record<InvoiceStatus, number>;
}

// ===========================================
// PAGINATION HELPERS
// ===========================================

function getPaginationParams(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take };
}

// ===========================================
// BILLING FREQUENCY HELPERS
// ===========================================

/**
 * Get the number of days in a billing cycle
 */
function getCycleDays(frequency: BillingFrequency): number {
  switch (frequency) {
    case 'MONTHLY': return 30;
    case 'QUARTERLY': return 90;
    case 'YEARLY': return 365;
    default: return 30;
  }
}

/**
 * Get the number of cycles per year
 */
function getCyclesPerYear(frequency: BillingFrequency): number {
  switch (frequency) {
    case 'MONTHLY': return 12;
    case 'QUARTERLY': return 4;
    case 'YEARLY': return 1;
    default: return 12;
  }
}

/**
 * Add interval to date based on billing frequency
 */
function addBillingInterval(date: Date, cycles: number, frequency: BillingFrequency): Date {
  const result = new Date(date);
  switch (frequency) {
    case 'MONTHLY':
      result.setMonth(result.getMonth() + cycles);
      break;
    case 'QUARTERLY':
      result.setMonth(result.getMonth() + (cycles * 3));
      break;
    case 'YEARLY':
      result.setFullYear(result.getFullYear() + cycles);
      break;
  }
  return result;
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: `${prefix}-${year}${month}` }
    },
    orderBy: { invoiceNumber: 'desc' }
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
    sequence = lastSeq + 1;
  }

  return `${prefix}-${year}${month}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Generate unique credit note number
 */
async function generateCreditNoteNumber(): Promise<string> {
  const prefix = 'CN';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const lastCreditNote = await prisma.creditNote.findFirst({
    where: {
      creditNoteNumber: { startsWith: `${prefix}-${year}${month}` }
    },
    orderBy: { creditNoteNumber: 'desc' }
  });

  let sequence = 1;
  if (lastCreditNote) {
    const lastSeq = parseInt(lastCreditNote.creditNoteNumber.split('-').pop() || '0');
    sequence = lastSeq + 1;
  }

  return `${prefix}-${year}${month}-${sequence.toString().padStart(4, '0')}`;
}

// ===========================================
// SUBSCRIPTION PLAN MANAGEMENT
// ===========================================

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans(
  filters: { isActive?: boolean; search?: string } = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const where: Prisma.SubscriptionPlanWhereInput = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { product: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [plans, total] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, salePrice: true, category: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.subscriptionPlan.count({ where }),
  ]);

  return {
    data: plans,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get subscription plan by ID
 */
export async function getSubscriptionPlanById(id: string) {
  return prisma.subscriptionPlan.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
}

/**
 * Create a subscription plan
 */
export async function createSubscriptionPlan(data: {
  productId: string;
  name: string;
  frequency: BillingFrequency;
  prorationRule?: ProrationRule;
  trialDays?: number;
}) {
  return prisma.subscriptionPlan.create({
    data: {
      productId: data.productId,
      name: data.name,
      frequency: data.frequency,
      prorationRule: data.prorationRule ?? 'DAILY',
      trialDays: data.trialDays ?? 0,
    },
    include: {
      product: true,
    },
  });
}

/**
 * Update a subscription plan
 */
export async function updateSubscriptionPlan(
  id: string,
  data: {
    name?: string;
    frequency?: BillingFrequency;
    prorationRule?: ProrationRule;
    trialDays?: number;
    isActive?: boolean;
  }
) {
  return prisma.subscriptionPlan.update({
    where: { id },
    data,
    include: {
      product: true,
    },
  });
}

// ===========================================
// BILLING SCHEDULE GENERATION
// ===========================================

/**
 * Generate billing schedule for a recurring quotation line
 * Called when a quotation is confirmed
 */
export async function generateBillingSchedule(
  quotationLineId: string,
  startDate: Date = new Date(),
  numberOfCycles: number = 12
): Promise<BillingScheduleGenerationResult | null> {
  const quotationLine = await prisma.quotationLine.findUnique({
    where: { id: quotationLineId },
    include: {
      product: { 
        select: { id: true, name: true },
        include: { subscriptionPlan: true }
      },
      quotation: true,
    },
  });

  if (!quotationLine) {
    return null;
  }

  // Only generate for recurring line types
  if (quotationLine.lineType !== 'RECURRING' || !quotationLine.billingFrequency) {
    return null;
  }

  const frequency = quotationLine.billingFrequency;
  const cycleAmount = quotationLine.lineTotal.toNumber();
  const schedules: Array<{ cycleNumber: number; dueDate: Date; amount: number }> = [];

  // Delete existing schedules for this line (idempotent regeneration)
  await prisma.billingSchedule.deleteMany({
    where: { quotationLineId },
  });

  // Generate schedules
  for (let i = 0; i < numberOfCycles; i++) {
    const dueDate = addBillingInterval(startDate, i, frequency);
    schedules.push({
      cycleNumber: i + 1,
      dueDate,
      amount: cycleAmount,
    });
  }

  // Insert all schedules
  await prisma.billingSchedule.createMany({
    data: schedules.map(s => ({
      quotationLineId,
      cycleNumber: s.cycleNumber,
      dueDate: s.dueDate,
      amount: s.amount,
      status: 'UPCOMING',
    })),
  });

  return {
    quotationLineId,
    productName: quotationLine.product.name,
    schedules,
  };
}

/**
 * Generate billing schedules for all recurring lines in a quotation
 */
export async function generateBillingSchedulesForQuotation(
  quotationId: string,
  startDate: Date = new Date()
): Promise<BillingScheduleGenerationResult[]> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      lines: {
        where: { lineType: 'RECURRING' },
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!quotation) {
    return [];
  }

  const results: BillingScheduleGenerationResult[] = [];

  for (const line of quotation.lines) {
    const result = await generateBillingSchedule(line.id, startDate);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

// ===========================================
// SUBSCRIPTION QUERIES (Based on Billing Schedules)
// ===========================================

/**
 * Get active subscriptions (recurring quotation lines with billing schedules)
 */
export async function getSubscriptions(
  filters: SubscriptionFilters = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const where: Prisma.QuotationLineWhereInput = {
    lineType: LineType.RECURRING,
    billingSchedules: { some: {} }, // Has at least one billing schedule
  };

  if (filters.quotationId) {
    where.quotationId = filters.quotationId;
  }

  if (filters.productId) {
    where.productId = filters.productId;
  }

  if (filters.customerId) {
    where.quotation = { customerId: filters.customerId };
  }

  if (filters.status) {
    where.billingSchedules = {
      some: { status: filters.status },
    };
  }

  if (filters.search) {
    where.OR = [
      { product: { name: { contains: filters.search, mode: 'insensitive' } } },
      { quotation: { quotationNumber: { contains: filters.search, mode: 'insensitive' } } },
      { quotation: { customer: { name: { contains: filters.search, mode: 'insensitive' } } } },
    ];
  }

  const [subscriptions, total] = await Promise.all([
    prisma.quotationLine.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, salePrice: true },
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            customer: {
              select: { id: true, name: true, email: true, tier: true },
            },
            rep: {
              select: { id: true, name: true },
            },
          },
        },
        billingSchedules: {
          orderBy: { cycleNumber: 'asc' },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.quotationLine.count({ where }),
  ]);

  // Enrich with subscription status info
  const enrichedSubscriptions = subscriptions.map(sub => {
    const schedules = sub.billingSchedules;
    const upcomingCount = schedules.filter(s => s.status === 'UPCOMING').length;
    const paidCount = schedules.filter(s => s.status === 'PAID').length;
    const cancelledCount = schedules.filter(s => s.status === 'CANCELLED').length;
    const nextSchedule = schedules.find(s => s.status === 'UPCOMING');
    
    let subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING' = 'PENDING';
    if (cancelledCount === schedules.length) {
      subscriptionStatus = 'CANCELLED';
    } else if (paidCount > 0 && upcomingCount > 0) {
      subscriptionStatus = 'ACTIVE';
    } else if (paidCount === schedules.length && upcomingCount === 0) {
      subscriptionStatus = 'COMPLETED';
    } else if (upcomingCount > 0) {
      subscriptionStatus = 'ACTIVE';
    }

    return {
      ...sub,
      subscriptionStatus,
      totalSchedules: schedules.length,
      upcomingCount,
      paidCount,
      cancelledCount,
      nextBillingDate: nextSchedule?.dueDate ?? null,
      nextBillingAmount: nextSchedule?.amount ?? null,
    };
  });

  return {
    data: enrichedSubscriptions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get subscription details (quotation line with billing schedules)
 */
export async function getSubscriptionById(quotationLineId: string) {
  const subscription = await prisma.quotationLine.findUnique({
    where: { id: quotationLineId },
    include: {
      product: {
        include: { subscriptionPlan: true },
      },
      quotation: {
        include: {
          customer: true,
          rep: { select: { id: true, name: true, email: true } },
        },
      },
      billingSchedules: {
        orderBy: { cycleNumber: 'asc' },
      },
    },
  });

  if (!subscription || subscription.lineType !== 'RECURRING') {
    return null;
  }

  const schedules = subscription.billingSchedules;
  const upcomingCount = schedules.filter(s => s.status === 'UPCOMING').length;
  const paidCount = schedules.filter(s => s.status === 'PAID').length;
  const cancelledCount = schedules.filter(s => s.status === 'CANCELLED').length;
  const nextSchedule = schedules.find(s => s.status === 'UPCOMING');
  const lastPaidSchedule = [...schedules].reverse().find(s => s.status === 'PAID');

  let subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING' = 'PENDING';
  if (cancelledCount === schedules.length) {
    subscriptionStatus = 'CANCELLED';
  } else if (paidCount > 0 && upcomingCount > 0) {
    subscriptionStatus = 'ACTIVE';
  } else if (paidCount === schedules.length && upcomingCount === 0) {
    subscriptionStatus = 'COMPLETED';
  } else if (upcomingCount > 0) {
    subscriptionStatus = 'ACTIVE';
  }

  return {
    ...subscription,
    subscriptionStatus,
    totalSchedules: schedules.length,
    upcomingCount,
    paidCount,
    cancelledCount,
    nextBillingDate: nextSchedule?.dueDate ?? null,
    nextBillingAmount: nextSchedule?.amount ? nextSchedule.amount.toNumber() : null,
    lastPaymentDate: lastPaidSchedule?.dueDate ?? null,
    totalPaid: schedules
      .filter(s => s.status === 'PAID')
      .reduce((sum, s) => sum + s.amount.toNumber(), 0),
    totalRemaining: schedules
      .filter(s => s.status === 'UPCOMING')
      .reduce((sum, s) => sum + s.amount.toNumber(), 0),
  };
}

// ===========================================
// PRORATION CALCULATIONS
// ===========================================

/**
 * Calculate proration for mid-cycle changes
 * Used when upgrading/downgrading or cancelling subscriptions
 */
export function calculateProration(
  currentAmount: number,
  newAmount: number,
  cycleStartDate: Date,
  cycleEndDate: Date,
  changeDate: Date,
  prorationRule: ProrationRule = 'DAILY'
): ProrationResult {
  if (prorationRule === 'NONE') {
    return {
      adjustmentAmount: 0,
      daysRemaining: 0,
      totalDays: 0,
      fractionRemaining: 0,
      description: 'No proration applied',
    };
  }

  const totalDays = Math.ceil(
    (cycleEndDate.getTime() - cycleStartDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  const daysRemaining = Math.ceil(
    (cycleEndDate.getTime() - changeDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysRemaining <= 0) {
    return {
      adjustmentAmount: 0,
      daysRemaining: 0,
      totalDays,
      fractionRemaining: 0,
      description: 'Cycle already ended, no proration needed',
    };
  }

  let fractionRemaining: number;
  if (prorationRule === 'WEEKLY') {
    const weeksRemaining = Math.ceil(daysRemaining / 7);
    const totalWeeks = Math.ceil(totalDays / 7);
    fractionRemaining = weeksRemaining / totalWeeks;
  } else {
    // DAILY
    fractionRemaining = daysRemaining / totalDays;
  }

  const adjustmentAmount = (newAmount - currentAmount) * fractionRemaining;

  return {
    adjustmentAmount: Math.round(adjustmentAmount * 100) / 100, // Round to 2 decimal places
    daysRemaining,
    totalDays,
    fractionRemaining: Math.round(fractionRemaining * 10000) / 10000,
    description: `Prorated for ${daysRemaining} of ${totalDays} days (${(fractionRemaining * 100).toFixed(1)}%)`,
  };
}

/**
 * Calculate refund amount for subscription cancellation
 */
export function calculateCancellationRefund(
  cycleAmount: number,
  cycleStartDate: Date,
  cycleEndDate: Date,
  cancelDate: Date,
  prorationRule: ProrationRule = 'DAILY'
): ProrationResult {
  // Cancellation refund = prorating from current amount to 0
  return calculateProration(cycleAmount, 0, cycleStartDate, cycleEndDate, cancelDate, prorationRule);
}

// ===========================================
// SUBSCRIPTION MODIFICATIONS
// ===========================================

/**
 * Modify a subscription (change quantity or plan)
 * Creates proration adjustment and updates future schedules
 */
export async function modifySubscription(
  quotationLineId: string,
  newQuantity: number,
  effectiveDate: Date = new Date()
): Promise<ModificationResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.quotationLine.findUnique({
        where: { id: quotationLineId },
        include: {
          product: { include: { subscriptionPlan: true } },
          quotation: true,
          billingSchedules: {
            where: { status: 'UPCOMING' },
            orderBy: { cycleNumber: 'asc' },
          },
        },
      });

      if (!subscription || subscription.lineType !== 'RECURRING') {
        throw new Error('Subscription not found or not a recurring item');
      }

      const currentQuantity = subscription.quantity;
      const unitPrice = subscription.unitPrice.toNumber();
      const discountPct = subscription.discountPct.toNumber();
      const currentAmount = subscription.lineTotal.toNumber();
      
      // Calculate new line total
      const newLineTotal = newQuantity * unitPrice * (1 - discountPct / 100);
      const priceDifference = newLineTotal - currentAmount;

      // Find current cycle (first upcoming schedule)
      const currentCycleSchedule = subscription.billingSchedules[0];
      let prorationAmount = 0;
      let creditNoteId: string | undefined;

      if (currentCycleSchedule && subscription.billingFrequency) {
        // Calculate proration for current cycle
        const cycleStartDate = addBillingInterval(
          currentCycleSchedule.dueDate,
          -1,
          subscription.billingFrequency
        );
        const cycleEndDate = currentCycleSchedule.dueDate;
        const prorationRule = subscription.product.subscriptionPlan?.prorationRule ?? 'DAILY';

        const proration = calculateProration(
          currentAmount,
          newLineTotal,
          cycleStartDate,
          cycleEndDate,
          effectiveDate,
          prorationRule
        );

        prorationAmount = proration.adjustmentAmount;

        // If there's a credit (downgrade), create a credit note
        if (prorationAmount < 0) {
          // Find related invoice
          const relatedInvoice = await tx.invoice.findFirst({
            where: { quotationId: subscription.quotationId },
            orderBy: { createdAt: 'desc' },
          });

          if (relatedInvoice) {
            const creditNoteNumber = await generateCreditNoteNumber();
            const creditNote = await tx.creditNote.create({
              data: {
                creditNoteNumber,
                invoiceId: relatedInvoice.id,
                amount: Math.abs(prorationAmount),
                reason: `Subscription modification: quantity changed from ${currentQuantity} to ${newQuantity}`,
                status: 'ISSUED',
                issuedAt: new Date(),
              },
            });
            creditNoteId = creditNote.id;
          }
        }
      }

      // Update the quotation line
      await tx.quotationLine.update({
        where: { id: quotationLineId },
        data: {
          quantity: newQuantity,
          lineTotal: newLineTotal,
          marginAmount: newLineTotal - (subscription.product.costPrice?.toNumber() ?? 0) * newQuantity,
        },
      });

      // Update all future billing schedules
      const updatedSchedules = await Promise.all(
        subscription.billingSchedules.map(async (schedule) => {
          const updated = await tx.billingSchedule.update({
            where: { id: schedule.id },
            data: { amount: newLineTotal },
          });
          return {
            cycleNumber: updated.cycleNumber,
            dueDate: updated.dueDate,
            amount: newLineTotal,
          };
        })
      );

      return {
        prorationAmount,
        creditNoteId,
        newSchedules: updatedSchedules,
      };
    });

    return {
      success: true,
      prorationAmount: result.prorationAmount,
      creditNoteId: result.creditNoteId,
      newSchedules: result.newSchedules,
    };
  } catch (error) {
    return {
      success: false,
      prorationAmount: 0,
      newSchedules: [],
      error: error instanceof Error ? error.message : 'Failed to modify subscription',
    };
  }
}

/**
 * Cancel a subscription with prorated refund
 */
export async function cancelSubscription(
  quotationLineId: string,
  cancelDate: Date = new Date(),
  reason: string = 'Customer requested cancellation'
): Promise<CancellationResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.quotationLine.findUnique({
        where: { id: quotationLineId },
        include: {
          product: { include: { subscriptionPlan: true } },
          quotation: true,
          billingSchedules: {
            orderBy: { cycleNumber: 'asc' },
          },
        },
      });

      if (!subscription || subscription.lineType !== 'RECURRING') {
        throw new Error('Subscription not found or not a recurring item');
      }

      // Find upcoming schedules
      const upcomingSchedules = subscription.billingSchedules.filter(
        s => s.status === 'UPCOMING'
      );

      if (upcomingSchedules.length === 0) {
        throw new Error('No upcoming billing schedules to cancel');
      }

      // Find current cycle (first upcoming)
      const currentCycleSchedule = upcomingSchedules[0];
      const cycleAmount = currentCycleSchedule.amount.toNumber();

      // Calculate prorated refund for current cycle
      let refundAmount = 0;
      let creditNoteId: string | undefined;
      let creditNoteNumber: string | undefined;

      if (subscription.billingFrequency) {
        const cycleStartDate = addBillingInterval(
          currentCycleSchedule.dueDate,
          -1,
          subscription.billingFrequency
        );
        const cycleEndDate = currentCycleSchedule.dueDate;
        const prorationRule = subscription.product.subscriptionPlan?.prorationRule ?? 'DAILY';

        const refundCalc = calculateCancellationRefund(
          cycleAmount,
          cycleStartDate,
          cycleEndDate,
          cancelDate,
          prorationRule
        );

        refundAmount = Math.abs(refundCalc.adjustmentAmount);

        // Create credit note for refund if there's an amount
        if (refundAmount > 0) {
          const relatedInvoice = await tx.invoice.findFirst({
            where: { quotationId: subscription.quotationId },
            orderBy: { createdAt: 'desc' },
          });

          if (relatedInvoice) {
            creditNoteNumber = await generateCreditNoteNumber();
            const creditNote = await tx.creditNote.create({
              data: {
                creditNoteNumber,
                invoiceId: relatedInvoice.id,
                amount: refundAmount,
                reason: `Subscription cancellation: ${reason}`,
                status: 'ISSUED',
                issuedAt: new Date(),
              },
            });
            creditNoteId = creditNote.id;
          }
        }
      }

      // Cancel all upcoming billing schedules
      const cancelledCount = await tx.billingSchedule.updateMany({
        where: {
          quotationLineId,
          status: 'UPCOMING',
        },
        data: {
          status: 'CANCELLED',
        },
      });

      return {
        refundAmount,
        creditNoteId,
        creditNoteNumber,
        cancelledSchedules: cancelledCount.count,
      };
    });

    return {
      success: true,
      refundAmount: result.refundAmount,
      creditNoteId: result.creditNoteId,
      creditNoteNumber: result.creditNoteNumber,
      cancelledSchedules: result.cancelledSchedules,
    };
  } catch (error) {
    return {
      success: false,
      refundAmount: 0,
      cancelledSchedules: 0,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

// ===========================================
// INVOICE MANAGEMENT
// ===========================================

/**
 * Get invoices with filters and pagination
 */
export async function getInvoices(
  filters: InvoiceFilters = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const where: Prisma.InvoiceWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.invoiceType) {
    where.invoiceType = filters.invoiceType;
  }

  if (filters.quotationId) {
    where.quotationId = filters.quotationId;
  }

  if (filters.customerId) {
    where.quotation = { customerId: filters.customerId };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom && { gte: filters.dateFrom }),
      ...(filters.dateTo && { lte: filters.dateTo }),
    };
  }

  if (filters.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      { quotation: { quotationNumber: { contains: filters.search, mode: 'insensitive' } } },
      { quotation: { customer: { name: { contains: filters.search, mode: 'insensitive' } } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            customer: {
              select: { id: true, name: true, email: true, tier: true },
            },
          },
        },
        creditNotes: {
          select: { id: true, amount: true, status: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data: invoices,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get invoice by ID with full details
 */
export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      quotation: {
        include: {
          customer: true,
          rep: { select: { id: true, name: true, email: true } },
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      },
      creditNotes: true,
    },
  });
}

/**
 * Generate invoice for a quotation
 * Note: Invoice totalAmount matches the quotation total directly - no additional taxes are added
 * The quotation's lineTotal values already represent the final negotiated prices
 */
export async function generateInvoice(
  quotationId: string,
  invoiceType: InvoiceType = 'ONE_TIME',
  dueDate?: Date
): Promise<{ success: boolean; invoice?: unknown; error?: string }> {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        lines: {
          include: { product: true },
        },
        customer: true,
      },
    });

    if (!quotation) {
      return { success: false, error: 'Quotation not found' };
    }

    if (!['CONFIRMED', 'FULFILLING', 'APPROVED'].includes(quotation.status)) {
      return { success: false, error: 'Quotation must be confirmed to generate invoice' };
    }

    // Calculate totals - use line totals directly without adding extra taxes
    // The quotation total already represents the final agreed-upon amount
    let amount = 0;

    for (const line of quotation.lines) {
      // Filter by invoice type
      if (invoiceType === 'ONE_TIME' && line.lineType === 'ONE_TIME') {
        amount += line.lineTotal.toNumber();
      } else if (invoiceType === 'RECURRING' && line.lineType === 'RECURRING') {
        amount += line.lineTotal.toNumber();
      }
    }

    if (amount === 0) {
      return { success: false, error: `No ${invoiceType.toLowerCase()} items to invoice` };
    }

    const invoiceNumber = await generateInvoiceNumber();
    // Total amount equals the sum of line totals - no additional tax
    const totalAmount = amount;
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30); // Net 30 default

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quotationId,
        invoiceType,
        amount,
        taxAmount: 0, // No additional tax - price shown in quotation is final
        totalAmount,
        status: 'DRAFT',
        dueDate: dueDate ?? defaultDueDate,
      },
      include: {
        quotation: {
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    return { success: true, invoice };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
  }
}

/**
 * Send invoice (transition from DRAFT to SENT)
 */
export async function sendInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status !== 'DRAFT') {
      return { success: false, error: 'Only draft invoices can be sent' };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        issuedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invoice',
    };
  }
}

/**
 * Record payment for an invoice
 */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  paidAt: Date = new Date()
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (!['SENT', 'OVERDUE'].includes(invoice.status)) {
      return { success: false, error: 'Invoice must be sent or overdue to record payment' };
    }

    // Update invoice status to PAID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt,
      },
    });

    // Update related billing schedules if this is a recurring invoice
    if (invoice.invoiceType === 'RECURRING') {
      await prisma.billingSchedule.updateMany({
        where: {
          invoiceId: invoiceId,
          status: 'INVOICED',
        },
        data: {
          status: 'PAID',
        },
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record payment',
    };
  }
}

/**
 * Mark invoice as overdue
 */
export async function markInvoiceOverdue(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'OVERDUE' },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark invoice as overdue',
    };
  }
}

/**
 * Check and update overdue invoices (for cron job)
 */
export async function processOverdueInvoices(): Promise<{ updated: number }> {
  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: {
      status: 'SENT',
      dueDate: { lt: now },
    },
    data: {
      status: 'OVERDUE',
    },
  });

  return { updated: result.count };
}

// ===========================================
// CREDIT NOTE MANAGEMENT
// ===========================================

/**
 * Get credit notes for an invoice
 */
export async function getCreditNotes(invoiceId: string) {
  return prisma.creditNote.findMany({
    where: { invoiceId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a credit note
 */
export async function createCreditNote(
  invoiceId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; creditNote?: unknown; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Validate amount doesn't exceed invoice total
    const existingCreditNotes = await prisma.creditNote.aggregate({
      where: {
        invoiceId,
        status: { not: 'CANCELLED' },
      },
      _sum: { amount: true },
    });

    const totalCredited = existingCreditNotes._sum.amount?.toNumber() ?? 0;
    const invoiceTotal = invoice.totalAmount.toNumber();

    if (totalCredited + amount > invoiceTotal) {
      return {
        success: false,
        error: `Credit note amount exceeds remaining balance. Max allowed: $${(invoiceTotal - totalCredited).toFixed(2)}`,
      };
    }

    const creditNoteNumber = await generateCreditNoteNumber();

    const creditNote = await prisma.creditNote.create({
      data: {
        creditNoteNumber,
        invoiceId,
        amount,
        reason,
        status: 'DRAFT',
      },
    });

    return { success: true, creditNote };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create credit note',
    };
  }
}

/**
 * Issue a credit note (transition from DRAFT to ISSUED)
 */
export async function issueCreditNote(creditNoteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const creditNote = await prisma.creditNote.findUnique({ where: { id: creditNoteId } });

    if (!creditNote) {
      return { success: false, error: 'Credit note not found' };
    }

    if (creditNote.status !== 'DRAFT') {
      return { success: false, error: 'Only draft credit notes can be issued' };
    }

    await prisma.creditNote.update({
      where: { id: creditNoteId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to issue credit note',
    };
  }
}

/**
 * Apply a credit note (mark as APPLIED)
 */
export async function applyCreditNote(creditNoteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const creditNote = await prisma.creditNote.findUnique({ where: { id: creditNoteId } });

    if (!creditNote) {
      return { success: false, error: 'Credit note not found' };
    }

    if (creditNote.status !== 'ISSUED') {
      return { success: false, error: 'Only issued credit notes can be applied' };
    }

    await prisma.creditNote.update({
      where: { id: creditNoteId },
      data: { status: 'APPLIED' },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply credit note',
    };
  }
}

// ===========================================
// BILLING SUMMARY & STATISTICS
// ===========================================

/**
 * Get invoice summary statistics
 */
export async function getInvoiceSummary(): Promise<InvoiceSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    outstandingResult,
    overdueResult,
    paidThisMonthResult,
    creditNotesResult,
    statusCounts,
  ] = await Promise.all([
    // Total outstanding (SENT)
    prisma.invoice.aggregate({
      where: { status: 'SENT' },
      _sum: { totalAmount: true },
    }),
    // Total overdue
    prisma.invoice.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { totalAmount: true },
    }),
    // Paid this month
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    }),
    // Total credit notes (issued + applied)
    prisma.creditNote.aggregate({
      where: {
        status: { in: ['ISSUED', 'APPLIED'] },
      },
      _sum: { amount: true },
    }),
    // Count by status
    prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const invoicesByStatus = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as Record<InvoiceStatus, number>);

  return {
    totalOutstanding: outstandingResult._sum.totalAmount?.toNumber() ?? 0,
    totalOverdue: overdueResult._sum.totalAmount?.toNumber() ?? 0,
    totalPaidThisMonth: paidThisMonthResult._sum.totalAmount?.toNumber() ?? 0,
    totalCreditNotes: creditNotesResult._sum.amount?.toNumber() ?? 0,
    invoicesByStatus,
  };
}

/**
 * Get billing schedules due for processing
 */
export async function getDueBillingSchedules(
  beforeDate: Date = new Date()
) {
  return prisma.billingSchedule.findMany({
    where: {
      status: 'UPCOMING',
      dueDate: { lte: beforeDate },
    },
    include: {
      quotationLine: {
        include: {
          product: { select: { id: true, name: true } },
          quotation: {
            select: {
              id: true,
              quotationNumber: true,
              customerId: true,
              customer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });
}

/**
 * Process due billing schedules - generate invoices for due recurring charges
 */
export async function processDueBillingSchedules(): Promise<{
  processed: number;
  invoicesGenerated: number;
  errors: string[];
}> {
  const dueSchedules = await getDueBillingSchedules();
  let processed = 0;
  let invoicesGenerated = 0;
  const errors: string[] = [];

  // Group schedules by quotation
  const schedulesByQuotation = dueSchedules.reduce((acc, schedule) => {
    const quotationId = schedule.quotationLine.quotationId;
    if (!acc[quotationId]) {
      acc[quotationId] = [];
    }
    acc[quotationId].push(schedule);
    return acc;
  }, {} as Record<string, typeof dueSchedules>);

  for (const [quotationId, schedules] of Object.entries(schedulesByQuotation)) {
    try {
      // Generate invoice for the recurring items
      const invoiceResult = await generateInvoice(quotationId, 'RECURRING');
      
      if (invoiceResult.success && invoiceResult.invoice) {
        invoicesGenerated++;

        // Mark schedules as invoiced
        await prisma.billingSchedule.updateMany({
          where: {
            id: { in: schedules.map(s => s.id) },
          },
          data: {
            status: 'INVOICED',
            invoiceId: (invoiceResult.invoice as { id: string }).id,
          },
        });

        processed += schedules.length;
      } else {
        errors.push(`Failed to generate invoice for quotation ${quotationId}: ${invoiceResult.error}`);
      }
    } catch (error) {
      errors.push(
        `Error processing quotation ${quotationId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return { processed, invoicesGenerated, errors };
}

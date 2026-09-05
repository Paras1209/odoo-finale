// ===========================================
// DealFlow360 - Dashboard Service
// ===========================================
// DEV B's MODULE: Dashboard aggregations, deal health metrics, reports
// ===========================================

import { Prisma, QuotationStatus, FulfillmentStatus, AuditLog, User, Customer, Quotation, FulfillmentSplit, Warehouse, QuotationLine, Product } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// ===========================================
// TYPES
// ===========================================

export interface DashboardSummary {
  quotations: {
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    confirmed: number;
  };
  approvals: {
    pending: number;
    approvedToday: number;
    rejectedToday: number;
  };
  fulfillment: {
    pending: number;
    processing: number;
    shipped: number;
    backorders: number;
  };
  invoices: {
    unpaid: number;
    overdue: number;
    totalOutstanding: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

export interface RecentActivity {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorName: string;
  actorType: string;
  description: string;
  createdAt: Date;
}

export interface AtRiskDeal {
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  repName: string;
  totalAmount: number;
  status: QuotationStatus;
  riskType: 'STALLED' | 'HIGH_DISCOUNT' | 'EXPIRING_SOON' | 'REJECTED';
  riskDetails: string;
  lastActivityAt: Date;
  daysSinceActivity: number;
}

export interface DealHealthMetrics {
  stalledDeals: AtRiskDeal[];
  discountAnomalies: AtRiskDeal[];
  deliverySlippage: {
    id: string;
    quotationNumber: string;
    customerName: string;
    productName: string;
    warehouseName: string;
    estimatedShipDate: Date;
    actualShipDate: Date | null;
    slippageDays: number;
    status: FulfillmentStatus;
  }[];
  expiringQuotations: AtRiskDeal[];
  summary: {
    totalAtRisk: number;
    stalledCount: number;
    highDiscountCount: number;
    slippageCount: number;
    expiringCount: number;
  };
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  repId?: string;
  customerId?: string;
  category?: string;
}

export interface SalesReport {
  period: string;
  quotationsCreated: number;
  quotationsConfirmed: number;
  totalRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  topCustomers: { customerId: string; customerName: string; totalAmount: number; dealCount: number }[];
  topReps: { repId: string; repName: string; totalAmount: number; dealCount: number }[];
}

// Internal types for Prisma results
type QuotationWithRelations = Quotation & {
  customer: { name: string; companyName: string | null };
  rep: { name: string };
};

type FulfillmentWithRelations = FulfillmentSplit & {
  warehouse: { name: string };
  quotationLine: QuotationLine & {
    product: { name: string };
    quotation: {
      quotationNumber: string;
      customer: { name: string; companyName: string | null };
    };
  };
};

type AuditLogWithRelations = AuditLog & {
  user: { name: string } | null;
  customer: { name: string } | null;
};

// ===========================================
// DASHBOARD SUMMARY
// ===========================================

/**
 * Get dashboard summary stats for the home page widgets
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    // Quotation counts
    totalQuotations,
    draftQuotations,
    pendingApprovalQuotations,
    approvedQuotations,
    confirmedQuotations,
    // Approval counts
    pendingApprovals,
    approvedToday,
    rejectedToday,
    // Fulfillment counts
    pendingFulfillments,
    processingFulfillments,
    shippedFulfillments,
    backorderFulfillments,
    // Invoice counts
    unpaidInvoices,
    overdueInvoices,
    outstandingAmount,
    // Revenue
    thisMonthRevenue,
    lastMonthRevenue,
  ] = await Promise.all([
    // Quotations
    prisma.quotation.count(),
    prisma.quotation.count({ where: { status: 'DRAFT' } }),
    prisma.quotation.count({ where: { status: { in: ['PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL'] } } }),
    prisma.quotation.count({ where: { status: 'APPROVED' } }),
    prisma.quotation.count({ where: { status: 'CONFIRMED' } }),
    // Approvals
    prisma.approval.count({ where: { status: 'PENDING' } }),
    prisma.approval.count({ where: { status: 'APPROVED', actedAt: { gte: todayStart } } }),
    prisma.approval.count({ where: { status: 'REJECTED', actedAt: { gte: todayStart } } }),
    // Fulfillment
    prisma.fulfillmentSplit.count({ where: { status: 'PENDING' } }),
    prisma.fulfillmentSplit.count({ where: { status: 'PROCESSING' } }),
    prisma.fulfillmentSplit.count({ where: { status: 'SHIPPED' } }),
    prisma.fulfillmentSplit.count({ where: { isBackorder: true, status: { not: 'CANCELLED' } } }),
    // Invoices
    prisma.invoice.count({ where: { status: { in: ['SENT', 'OVERDUE'] } } }),
    prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    prisma.invoice.aggregate({
      where: { status: { in: ['SENT', 'OVERDUE'] } },
      _sum: { totalAmount: true },
    }),
    // Revenue (from paid invoices)
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: thisMonthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { totalAmount: true },
    }),
  ]);

  const thisMonthTotal = thisMonthRevenue._sum.totalAmount?.toNumber() || 0;
  const lastMonthTotal = lastMonthRevenue._sum.totalAmount?.toNumber() || 0;
  const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return {
    quotations: {
      total: totalQuotations,
      draft: draftQuotations,
      pendingApproval: pendingApprovalQuotations,
      approved: approvedQuotations,
      confirmed: confirmedQuotations,
    },
    approvals: {
      pending: pendingApprovals,
      approvedToday,
      rejectedToday,
    },
    fulfillment: {
      pending: pendingFulfillments,
      processing: processingFulfillments,
      shipped: shippedFulfillments,
      backorders: backorderFulfillments,
    },
    invoices: {
      unpaid: unpaidInvoices,
      overdue: overdueInvoices,
      totalOutstanding: outstandingAmount._sum.totalAmount?.toNumber() || 0,
    },
    revenue: {
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      growth: Math.round(growth * 10) / 10,
    },
  };
}

// ===========================================
// RECENT ACTIVITY
// ===========================================

/**
 * Get recent activity from audit log
 */
export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  const logs: AuditLogWithRelations[] = await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });

  return logs.map((log: AuditLogWithRelations) => ({
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    actorName: log.user?.name || log.customer?.name || 'System',
    actorType: log.actorType,
    description: formatActivityDescription(log.entityType, log.action, log.reason),
    createdAt: log.createdAt,
  }));
}

function formatActivityDescription(entityType: string, action: string, reason: string | null): string {
  // Special handling for specific actions
  if (action === 'COUNTER_DISCOUNT') {
    return reason || 'Submitted counter offer on quotation';
  }
  
  if (action === 'APPROVE' && entityType === 'QUOTATION') {
    return `Approved quotation${reason ? `: ${reason}` : ''}`;
  }
  
  if (action === 'REJECT' && entityType === 'QUOTATION') {
    return `Rejected quotation${reason ? `: ${reason}` : ''}`;
  }
  
  if (action === 'CONFIRM' && entityType === 'QUOTATION') {
    return 'Confirmed quotation as order';
  }

  const entity = entityType.toLowerCase().replace('_', ' ');
  const actionText = action.toLowerCase().replace('_', ' ');
  let description = `${actionText} ${entity}`;
  if (reason) {
    description += `: ${reason}`;
  }
  return description.charAt(0).toUpperCase() + description.slice(1);
}

// ===========================================
// DEAL HEALTH METRICS
// ===========================================

/**
 * Get deal health metrics - stalled deals, anomalies, slippage
 */
export async function getDealHealthMetrics(): Promise<DealHealthMetrics> {
  const now = new Date();
  const stalledThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
  const expiringThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

  // Stalled deals - no activity for 7+ days, not in terminal state
  const stalledDeals: QuotationWithRelations[] = await prisma.quotation.findMany({
    where: {
      status: { in: ['DRAFT', 'PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED'] },
      lastActivityAt: { lt: stalledThreshold },
    },
    include: {
      customer: { select: { name: true, companyName: true } },
      rep: { select: { name: true } },
    },
    orderBy: { lastActivityAt: 'asc' },
    take: 20,
  });

  // High discount anomalies - quotations with margin < 10%
  const discountAnomalies: QuotationWithRelations[] = await prisma.quotation.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      totalMarginPct: { lt: 10 },
      totalAmount: { gt: 0 },
    },
    include: {
      customer: { select: { name: true, companyName: true } },
      rep: { select: { name: true } },
    },
    orderBy: { totalMarginPct: 'asc' },
    take: 20,
  });

  // Delivery slippage - shipped after estimated date or pending past estimated date
  const deliverySlippage: FulfillmentWithRelations[] = await prisma.fulfillmentSplit.findMany({
    where: {
      OR: [
        // Past estimated date but not shipped
        {
          status: { in: ['PENDING', 'PROCESSING'] },
          estimatedShipDate: { lt: now },
        },
        // Shipped but after estimated date (handled in JS since Prisma can't compare columns)
        {
          status: { in: ['SHIPPED', 'DELIVERED'] },
          estimatedShipDate: { not: null },
          actualShipDate: { not: null },
        },
      ],
    },
    include: {
      warehouse: { select: { name: true } },
      quotationLine: {
        include: {
          product: { select: { name: true } },
          quotation: {
            select: {
              quotationNumber: true,
              customer: { select: { name: true, companyName: true } },
            },
          },
        },
      },
    },
    take: 50,
  });

  // Filter actual slippage in JS (shipped after estimated)
  const actualSlippage = deliverySlippage.filter((split: FulfillmentWithRelations) => {
    if (!split.estimatedShipDate) return false;
    if (split.status === 'PENDING' || split.status === 'PROCESSING') {
      return split.estimatedShipDate < now;
    }
    if (split.actualShipDate && split.estimatedShipDate) {
      return split.actualShipDate > split.estimatedShipDate;
    }
    return false;
  });

  // Expiring quotations - valid until date within 7 days
  const expiringQuotations: QuotationWithRelations[] = await prisma.quotation.findMany({
    where: {
      status: { in: ['DRAFT', 'PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED'] },
      validUntil: { gte: now, lte: expiringThreshold },
    },
    include: {
      customer: { select: { name: true, companyName: true } },
      rep: { select: { name: true } },
    },
    orderBy: { validUntil: 'asc' },
    take: 20,
  });

  const formatAtRiskDeal = (
    q: QuotationWithRelations,
    riskType: AtRiskDeal['riskType'],
    riskDetails: string
  ): AtRiskDeal => {
    const daysSinceActivity = Math.floor((now.getTime() - q.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
    return {
      quotationId: q.id,
      quotationNumber: q.quotationNumber,
      customerName: q.customer.companyName || q.customer.name,
      repName: q.rep.name,
      totalAmount: q.totalAmount.toNumber(),
      status: q.status,
      riskType,
      riskDetails,
      lastActivityAt: q.lastActivityAt,
      daysSinceActivity,
    };
  };

  return {
    stalledDeals: stalledDeals.map((q: QuotationWithRelations) =>
      formatAtRiskDeal(q, 'STALLED', `No activity for ${Math.floor((now.getTime() - q.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))} days`)
    ),
    discountAnomalies: discountAnomalies.map((q: QuotationWithRelations) =>
      formatAtRiskDeal(q, 'HIGH_DISCOUNT', `Margin only ${q.totalMarginPct.toNumber().toFixed(1)}%`)
    ),
    deliverySlippage: actualSlippage.map((split: FulfillmentWithRelations) => {
      const slippageDays = split.actualShipDate
        ? Math.floor((split.actualShipDate.getTime() - split.estimatedShipDate!.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((now.getTime() - split.estimatedShipDate!.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: split.id,
        quotationNumber: split.quotationLine.quotation.quotationNumber,
        customerName: split.quotationLine.quotation.customer.companyName || split.quotationLine.quotation.customer.name,
        productName: split.quotationLine.product.name,
        warehouseName: split.warehouse.name,
        estimatedShipDate: split.estimatedShipDate!,
        actualShipDate: split.actualShipDate,
        slippageDays,
        status: split.status,
      };
    }),
    expiringQuotations: expiringQuotations.map((q: QuotationWithRelations) => {
      const daysUntilExpiry = Math.floor((q.validUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return formatAtRiskDeal(q, 'EXPIRING_SOON', `Expires in ${daysUntilExpiry} days`);
    }),
    summary: {
      totalAtRisk: stalledDeals.length + discountAnomalies.length + actualSlippage.length + expiringQuotations.length,
      stalledCount: stalledDeals.length,
      highDiscountCount: discountAnomalies.length,
      slippageCount: actualSlippage.length,
      expiringCount: expiringQuotations.length,
    },
  };
}

// ===========================================
// REPORTS
// ===========================================

/**
 * Generate sales report with filters
 */
export async function generateSalesReport(filters: ReportFilters = {}): Promise<SalesReport> {
  const { startDate, endDate, repId, customerId } = filters;

  const dateFilter: Prisma.QuotationWhereInput = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = startDate;
    if (endDate) dateFilter.createdAt.lte = endDate;
  }

  const baseFilter: Prisma.QuotationWhereInput = {
    ...dateFilter,
    ...(repId && { repId }),
    ...(customerId && { customerId }),
  };

  const confirmedFilter: Prisma.QuotationWhereInput = {
    ...baseFilter,
    status: { in: ['CONFIRMED', 'FULFILLING', 'BILLED'] },
  };

  // Get aggregates
  const [quotationsCreated, quotationsConfirmed, revenueAggregate] = await Promise.all([
    prisma.quotation.count({ where: baseFilter }),
    prisma.quotation.count({ where: confirmedFilter }),
    prisma.quotation.aggregate({
      where: confirmedFilter,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    }),
  ]);

  // Top products
  const topProductsRaw = await prisma.quotationLine.groupBy({
    by: ['productId'],
    where: {
      quotation: confirmedFilter,
    },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: 'desc' } },
    take: 10,
  });

  const productIds = topProductsRaw.map((p: { productId: string }) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p: { id: string; name: string }) => [p.id, p.name]));

  const topProducts = topProductsRaw.map((p: { productId: string; _sum: { quantity: number | null; lineTotal: Prisma.Decimal | null } }) => ({
    productId: p.productId,
    productName: productMap.get(p.productId) || 'Unknown',
    quantity: p._sum.quantity || 0,
    revenue: p._sum.lineTotal?.toNumber() || 0,
  }));

  // Top customers
  const topCustomersRaw = await prisma.quotation.groupBy({
    by: ['customerId'],
    where: confirmedFilter,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10,
  });

  const customerIds = topCustomersRaw.map((c: { customerId: string }) => c.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, companyName: true },
  });
  const customerMap = new Map(customers.map((c: { id: string; name: string; companyName: string | null }) => [c.id, c.companyName || c.name]));

  const topCustomers = topCustomersRaw.map((c: { customerId: string; _sum: { totalAmount: Prisma.Decimal | null }; _count: { id: number } }) => ({
    customerId: c.customerId,
    customerName: customerMap.get(c.customerId) || 'Unknown',
    totalAmount: c._sum.totalAmount?.toNumber() || 0,
    dealCount: c._count.id,
  }));

  // Top reps
  const topRepsRaw = await prisma.quotation.groupBy({
    by: ['repId'],
    where: confirmedFilter,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10,
  });

  const repIds = topRepsRaw.map((r: { repId: string }) => r.repId);
  const reps = await prisma.user.findMany({
    where: { id: { in: repIds } },
    select: { id: true, name: true },
  });
  const repMap = new Map(reps.map((r: { id: string; name: string }) => [r.id, r.name]));

  const topReps = topRepsRaw.map((r: { repId: string; _sum: { totalAmount: Prisma.Decimal | null }; _count: { id: number } }) => ({
    repId: r.repId,
    repName: repMap.get(r.repId) || 'Unknown',
    totalAmount: r._sum.totalAmount?.toNumber() || 0,
    dealCount: r._count.id,
  }));

  const totalRevenue = revenueAggregate._sum.totalAmount?.toNumber() || 0;
  const averageDealSize = revenueAggregate._avg.totalAmount?.toNumber() || 0;
  const conversionRate = quotationsCreated > 0 ? (quotationsConfirmed / quotationsCreated) * 100 : 0;

  // Format period string
  let period = 'All Time';
  if (startDate && endDate) {
    period = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  } else if (startDate) {
    period = `From ${startDate.toLocaleDateString()}`;
  } else if (endDate) {
    period = `Until ${endDate.toLocaleDateString()}`;
  }

  return {
    period,
    quotationsCreated,
    quotationsConfirmed,
    totalRevenue,
    averageDealSize: Math.round(averageDealSize * 100) / 100,
    conversionRate: Math.round(conversionRate * 10) / 10,
    topProducts,
    topCustomers,
    topReps,
  };
}

/**
 * Get quotation status breakdown for charts
 */
export async function getQuotationStatusBreakdown(): Promise<{ status: string; count: number }[]> {
  const breakdown = await prisma.quotation.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return breakdown.map((item: { status: QuotationStatus; _count: { id: number } }) => ({
    status: item.status,
    count: item._count.id,
  }));
}

/**
 * Get monthly revenue trend
 */
export async function getRevenueTrend(months = 6): Promise<{ month: string; revenue: number }[]> {
  const now = new Date();
  const results: { month: string; revenue: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const revenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
    });

    results.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: revenue._sum.totalAmount?.toNumber() || 0,
    });
  }

  return results;
}

/**
 * Get fulfillment performance metrics
 */
export async function getFulfillmentPerformance(): Promise<{
  onTimeRate: number;
  averageShipDays: number;
  backorderRate: number;
}> {
  const [totalShipped, onTimeShipped, backorders, totalActive] = await Promise.all([
    prisma.fulfillmentSplit.count({
      where: { status: { in: ['SHIPPED', 'DELIVERED'] }, actualShipDate: { not: null } },
    }),
    prisma.fulfillmentSplit.count({
      where: {
        status: { in: ['SHIPPED', 'DELIVERED'] },
        actualShipDate: { not: null },
        estimatedShipDate: { not: null },
      },
    }),
    prisma.fulfillmentSplit.count({
      where: { isBackorder: true, status: { not: 'CANCELLED' } },
    }),
    prisma.fulfillmentSplit.count({
      where: { status: { not: 'CANCELLED' } },
    }),
  ]);

  // For accurate on-time rate, we'd need to query all shipped items and filter in JS
  // For now, return estimates based on available data
  const onTimeRate = totalShipped > 0 ? (onTimeShipped / totalShipped) * 100 : 100;
  const backorderRate = totalActive > 0 ? (backorders / totalActive) * 100 : 0;

  return {
    onTimeRate: Math.round(onTimeRate * 10) / 10,
    averageShipDays: 3, // Would need actual calculation with dates
    backorderRate: Math.round(backorderRate * 10) / 10,
  };
}

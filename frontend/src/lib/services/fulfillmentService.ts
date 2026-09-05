// ===========================================
// DealFlow360 - Fulfillment Service
// ===========================================
// DEV B's MODULE: Warehouse split algorithm, stock management,
// and fulfillment state machine
// ===========================================

import { Prisma, FulfillmentStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

// ===========================================
// TYPES
// ===========================================

export interface WarehouseFilters {
  isActive?: boolean;
  search?: string;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  address?: string;
  shippingCostWeight?: number;
}

export interface UpdateWarehouseInput {
  name?: string;
  code?: string;
  address?: string;
  shippingCostWeight?: number;
  isActive?: boolean;
}

export interface StockUpdateInput {
  warehouseId: string;
  productId: string;
  quantityAvailable: number;
  reorderPoint?: number;
}

export interface FulfillmentSplitResult {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  availableStock: number;
}

export interface SplitCalculationResult {
  splits: FulfillmentSplitResult[];
  totalFulfilled: number;
  shortfall: number;
  isBackorder: boolean;
}

export interface ManualOverrideSplit {
  warehouseId: string;
  quantity: number;
}

export interface FulfillmentFilters {
  status?: FulfillmentStatus;
  isBackorder?: boolean;
  warehouseId?: string;
  quotationId?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Valid fulfillment status transitions
const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

// ===========================================
// PAGINATION HELPERS
// ===========================================

function getPaginationParams(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take };
}

// ===========================================
// WAREHOUSE MANAGEMENT
// ===========================================

/**
 * Get all warehouses with optional filters
 */
export async function getWarehouses(
  filters: WarehouseFilters = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const where: Prisma.WarehouseWhereInput = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { stockLevels: true, fulfillmentSplits: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.warehouse.count({ where }),
  ]);

  return {
    data: warehouses,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get warehouse by ID with stock levels
 */
export async function getWarehouseById(id: string) {
  return prisma.warehouse.findUnique({
    where: { id },
    include: {
      stockLevels: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true },
          },
        },
      },
      _count: {
        select: { fulfillmentSplits: true },
      },
    },
  });
}

/**
 * Get warehouse by code
 */
export async function getWarehouseByCode(code: string) {
  return prisma.warehouse.findUnique({
    where: { code },
  });
}

/**
 * Create a new warehouse
 */
export async function createWarehouse(data: CreateWarehouseInput) {
  return prisma.warehouse.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address,
      shippingCostWeight: data.shippingCostWeight ?? 1,
    },
  });
}

/**
 * Update a warehouse
 */
export async function updateWarehouse(id: string, data: UpdateWarehouseInput) {
  return prisma.warehouse.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.code && { code: data.code.toUpperCase() }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.shippingCostWeight !== undefined && { shippingCostWeight: data.shippingCostWeight }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/**
 * Soft delete warehouse (set isActive = false)
 */
export async function deactivateWarehouse(id: string) {
  return prisma.warehouse.update({
    where: { id },
    data: { isActive: false },
  });
}

// ===========================================
// STOCK LEVEL MANAGEMENT
// ===========================================

/**
 * Get stock levels for a product across all warehouses
 */
export async function getProductStockLevels(productId: string) {
  return prisma.stockLevel.findMany({
    where: { productId },
    include: {
      warehouse: {
        select: { id: true, name: true, code: true, isActive: true },
      },
    },
    orderBy: { quantityAvailable: 'desc' },
  });
}

/**
 * Get stock levels for a warehouse
 */
export async function getWarehouseStockLevels(
  warehouseId: string,
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 50, sortBy = 'quantityAvailable', sortOrder = 'desc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const [stockLevels, total] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { warehouseId },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, salePrice: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.stockLevel.count({ where: { warehouseId } }),
  ]);

  return {
    data: stockLevels,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get total available stock for a product across all active warehouses
 */
export async function getTotalAvailableStock(productId: string): Promise<number> {
  const result = await prisma.stockLevel.aggregate({
    where: {
      productId,
      warehouse: { isActive: true },
    },
    _sum: { quantityAvailable: true },
  });
  return result._sum.quantityAvailable ?? 0;
}

/**
 * Update or create stock level for a product in a warehouse
 */
export async function upsertStockLevel(data: StockUpdateInput) {
  return prisma.stockLevel.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: data.warehouseId,
        productId: data.productId,
      },
    },
    create: {
      warehouseId: data.warehouseId,
      productId: data.productId,
      quantityAvailable: data.quantityAvailable,
      reorderPoint: data.reorderPoint,
    },
    update: {
      quantityAvailable: data.quantityAvailable,
      ...(data.reorderPoint !== undefined && { reorderPoint: data.reorderPoint }),
    },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true, sku: true } },
    },
  });
}

/**
 * Bulk update stock levels (transactional)
 */
export async function bulkUpsertStockLevels(updates: StockUpdateInput[]) {
  return prisma.$transaction(
    updates.map((update) =>
      prisma.stockLevel.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: update.warehouseId,
            productId: update.productId,
          },
        },
        create: {
          warehouseId: update.warehouseId,
          productId: update.productId,
          quantityAvailable: update.quantityAvailable,
          reorderPoint: update.reorderPoint,
        },
        update: {
          quantityAvailable: update.quantityAvailable,
          ...(update.reorderPoint !== undefined && { reorderPoint: update.reorderPoint }),
        },
      })
    )
  );
}

/**
 * Adjust stock level (add or subtract)
 * Uses optimistic locking pattern for concurrency safety
 */
export async function adjustStockLevel(
  warehouseId: string,
  productId: string,
  adjustment: number
): Promise<{ success: boolean; newQuantity: number; error?: string }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current stock with lock
      const current = await tx.stockLevel.findUnique({
        where: {
          warehouseId_productId: { warehouseId, productId },
        },
      });

      if (!current) {
        throw new Error('Stock level not found');
      }

      const newQuantity = current.quantityAvailable + adjustment;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock. Available: ${current.quantityAvailable}, Requested: ${Math.abs(adjustment)}`);
      }

      const updated = await tx.stockLevel.update({
        where: { id: current.id },
        data: { quantityAvailable: newQuantity },
      });

      return updated.quantityAvailable;
    });

    return { success: true, newQuantity: result };
  } catch (error) {
    return {
      success: false,
      newQuantity: 0,
      error: error instanceof Error ? error.message : 'Failed to adjust stock',
    };
  }
}

/**
 * Get products with low stock (below reorder point)
 */
export async function getLowStockAlerts(warehouseId?: string) {
  const where: Prisma.StockLevelWhereInput = {
    reorderPoint: { not: null },
    warehouse: { isActive: true },
  };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  const stockLevels = await prisma.stockLevel.findMany({
    where,
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true, sku: true, category: true } },
    },
  });

  // Filter to only those below reorder point
  return stockLevels.filter(
    (sl) => sl.reorderPoint !== null && sl.quantityAvailable <= sl.reorderPoint
  );
}

// ===========================================
// WAREHOUSE SPLIT ALGORITHM
// ===========================================

/**
 * Calculate optimal warehouse split for fulfilling a product order
 * Uses greedy algorithm: prioritize warehouses with most stock (fewer shipments)
 * Considers shipping cost weight as secondary factor
 */
export async function calculateWarehouseSplit(
  productId: string,
  quantityNeeded: number
): Promise<SplitCalculationResult> {
  // Get all active warehouses with stock for this product
  const stockLevels = await prisma.stockLevel.findMany({
    where: {
      productId,
      warehouse: { isActive: true },
      quantityAvailable: { gt: 0 },
    },
    include: {
      warehouse: {
        select: { id: true, name: true, code: true, shippingCostWeight: true },
      },
    },
    orderBy: [
      { quantityAvailable: 'desc' }, // Primary: most stock first (fewer splits)
      { warehouse: { shippingCostWeight: 'asc' } }, // Secondary: lower shipping cost
    ],
  });

  const splits: FulfillmentSplitResult[] = [];
  let remaining = quantityNeeded;

  for (const sl of stockLevels) {
    if (remaining <= 0) break;

    const take = Math.min(sl.quantityAvailable, remaining);
    if (take > 0) {
      splits.push({
        warehouseId: sl.warehouse.id,
        warehouseName: sl.warehouse.name,
        warehouseCode: sl.warehouse.code,
        quantity: take,
        availableStock: sl.quantityAvailable,
      });
      remaining -= take;
    }
  }

  const totalFulfilled = quantityNeeded - remaining;

  return {
    splits,
    totalFulfilled,
    shortfall: remaining,
    isBackorder: remaining > 0,
  };
}

/**
 * Validate manual override splits
 * Ensures: total matches quantity, stock is available, warehouses exist
 */
export async function validateManualSplits(
  productId: string,
  quantityNeeded: number,
  splits: ManualOverrideSplit[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check total matches
  const totalSplit = splits.reduce((sum, s) => sum + s.quantity, 0);
  if (totalSplit !== quantityNeeded) {
    errors.push(`Split total (${totalSplit}) does not match required quantity (${quantityNeeded})`);
  }

  // Check each warehouse
  for (const split of splits) {
    if (split.quantity <= 0) {
      errors.push(`Invalid quantity (${split.quantity}) for warehouse`);
      continue;
    }

    const stockLevel = await prisma.stockLevel.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: split.warehouseId,
          productId,
        },
      },
      include: {
        warehouse: { select: { name: true, isActive: true } },
      },
    });

    if (!stockLevel) {
      errors.push(`No stock record found for warehouse ${split.warehouseId}`);
    } else if (!stockLevel.warehouse.isActive) {
      errors.push(`Warehouse "${stockLevel.warehouse.name}" is not active`);
    } else if (stockLevel.quantityAvailable < split.quantity) {
      errors.push(
        `Insufficient stock in "${stockLevel.warehouse.name}": available ${stockLevel.quantityAvailable}, requested ${split.quantity}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ===========================================
// FULFILLMENT MANAGEMENT
// ===========================================

/**
 * Get fulfillment splits with filters
 */
export async function getFulfillmentSplits(
  filters: FulfillmentFilters = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const where: Prisma.FulfillmentSplitWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.isBackorder !== undefined) {
    where.isBackorder = filters.isBackorder;
  }

  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.quotationId) {
    where.quotationLine = {
      quotation: { id: filters.quotationId },
    };
  }

  const [splits, total] = await Promise.all([
    prisma.fulfillmentSplit.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
        quotationLine: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: true },
            },
            quotation: {
              select: {
                id: true,
                quotationNumber: true,
                status: true,
                customer: {
                  select: { id: true, name: true, companyName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.fulfillmentSplit.count({ where }),
  ]);

  return {
    data: splits,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get fulfillment split by ID
 */
export async function getFulfillmentSplitById(id: string) {
  return prisma.fulfillmentSplit.findUnique({
    where: { id },
    include: {
      warehouse: true,
      quotationLine: {
        include: {
          product: true,
          quotation: {
            include: {
              customer: true,
              rep: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Get all fulfillment splits for a quotation line
 */
export async function getFulfillmentSplitsByLineId(quotationLineId: string) {
  return prisma.fulfillmentSplit.findMany({
    where: { quotationLineId },
    include: {
      warehouse: {
        select: { id: true, name: true, code: true, address: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get all fulfillment splits for a quotation
 */
export async function getFulfillmentSplitsByQuotationId(quotationId: string) {
  return prisma.fulfillmentSplit.findMany({
    where: {
      quotationLine: { quotationId },
    },
    include: {
      warehouse: {
        select: { id: true, name: true, code: true },
      },
      quotationLine: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
    },
    orderBy: [
      { quotationLine: { createdAt: 'asc' } },
      { createdAt: 'asc' },
    ],
  });
}

/**
 * Create fulfillment splits for a quotation line
 * TRANSACTIONAL: Creates splits and deducts stock atomically
 */
export async function createFulfillmentSplits(
  quotationLineId: string,
  splits: ManualOverrideSplit[],
  isManualOverride: boolean = false,
  estimatedShipDate?: Date
): Promise<{ success: boolean; splits: unknown[]; error?: string }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the quotation line to know the product
      const quotationLine = await tx.quotationLine.findUnique({
        where: { id: quotationLineId },
        include: {
          quotation: true,
          product: true,
        },
      });

      if (!quotationLine) {
        throw new Error('Quotation line not found');
      }

      // Delete any existing splits for this line
      await tx.fulfillmentSplit.deleteMany({
        where: { quotationLineId },
      });

      const createdSplits = [];

      for (const split of splits) {
        // Get current stock
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: split.warehouseId,
              productId: quotationLine.productId,
            },
          },
        });

        if (!stockLevel) {
          throw new Error(`No stock record for warehouse ${split.warehouseId}`);
        }

        // Determine if this is a backorder
        const isBackorder = split.quantity > stockLevel.quantityAvailable;
        const quantityToDeduct = Math.min(split.quantity, stockLevel.quantityAvailable);

        // Deduct stock (only what's available)
        if (quantityToDeduct > 0) {
          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: {
              quantityAvailable: stockLevel.quantityAvailable - quantityToDeduct,
              quantityReserved: stockLevel.quantityReserved + quantityToDeduct,
            },
          });
        }

        // Create the fulfillment split
        const fulfillmentSplit = await tx.fulfillmentSplit.create({
          data: {
            quotationLineId,
            warehouseId: split.warehouseId,
            quantityFulfilled: split.quantity,
            isBackorder,
            isManualOverride,
            estimatedShipDate: estimatedShipDate ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Default 3 days
            status: 'PENDING',
          },
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        });

        createdSplits.push(fulfillmentSplit);
      }

      return createdSplits;
    });

    return { success: true, splits: result };
  } catch (error) {
    return {
      success: false,
      splits: [],
      error: error instanceof Error ? error.message : 'Failed to create fulfillment splits',
    };
  }
}

/**
 * Auto-generate fulfillment splits for all lines in a confirmed quotation
 */
export async function generateFulfillmentForQuotation(quotationId: string): Promise<{
  success: boolean;
  results: Array<{ lineId: string; productName: string; success: boolean; error?: string }>;
}> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      lines: {
        include: {
          product: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });

  if (!quotation) {
    return { success: false, results: [{ lineId: '', productName: '', success: false, error: 'Quotation not found' }] };
  }

  const results = [];

  for (const line of quotation.lines) {
    // Skip service/subscription items - they don't need physical fulfillment
    if (line.product.category === 'SERVICE' || line.product.category === 'SUBSCRIPTION') {
      results.push({
        lineId: line.id,
        productName: line.product.name,
        success: true,
        error: 'Skipped - non-physical product',
      });
      continue;
    }

    // Calculate optimal split
    const splitCalc = await calculateWarehouseSplit(line.productId, line.quantity);

    if (splitCalc.splits.length === 0) {
      results.push({
        lineId: line.id,
        productName: line.product.name,
        success: false,
        error: 'No stock available in any warehouse',
      });
      continue;
    }

    // Create the splits
    const createResult = await createFulfillmentSplits(
      line.id,
      splitCalc.splits.map((s) => ({ warehouseId: s.warehouseId, quantity: s.quantity })),
      false
    );

    results.push({
      lineId: line.id,
      productName: line.product.name,
      success: createResult.success,
      error: createResult.error,
    });
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
}

// ===========================================
// FULFILLMENT STATE MACHINE
// ===========================================

/**
 * Check if a fulfillment status transition is valid
 */
export function isValidFulfillmentTransition(
  currentStatus: FulfillmentStatus,
  newStatus: FulfillmentStatus
): boolean {
  const allowedTransitions = FULFILLMENT_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Transition fulfillment split to a new status
 */
export async function transitionFulfillmentStatus(
  splitId: string,
  newStatus: FulfillmentStatus,
  actualShipDate?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const split = await prisma.fulfillmentSplit.findUnique({
      where: { id: splitId },
    });

    if (!split) {
      return { success: false, error: 'Fulfillment split not found' };
    }

    if (!isValidFulfillmentTransition(split.status, newStatus)) {
      return {
        success: false,
        error: `Invalid transition from ${split.status} to ${newStatus}`,
      };
    }

    const updateData: Prisma.FulfillmentSplitUpdateInput = {
      status: newStatus,
    };

    // If shipping, record actual ship date
    if (newStatus === 'SHIPPED') {
      updateData.actualShipDate = actualShipDate ?? new Date();
    }

    await prisma.fulfillmentSplit.update({
      where: { id: splitId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transition status',
    };
  }
}

/**
 * Mark fulfillment as shipped
 */
export async function shipFulfillment(
  splitId: string,
  actualShipDate?: Date
): Promise<{ success: boolean; error?: string }> {
  return transitionFulfillmentStatus(splitId, 'SHIPPED', actualShipDate);
}

/**
 * Mark fulfillment as delivered
 */
export async function deliverFulfillment(splitId: string): Promise<{ success: boolean; error?: string }> {
  return transitionFulfillmentStatus(splitId, 'DELIVERED');
}

/**
 * Cancel fulfillment and release reserved stock
 */
export async function cancelFulfillment(splitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const split = await tx.fulfillmentSplit.findUnique({
        where: { id: splitId },
        include: {
          quotationLine: true,
        },
      });

      if (!split) {
        throw new Error('Fulfillment split not found');
      }

      if (!isValidFulfillmentTransition(split.status, 'CANCELLED')) {
        throw new Error(`Cannot cancel fulfillment in ${split.status} status`);
      }

      // Release reserved stock back to available
      const stockLevel = await tx.stockLevel.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: split.warehouseId,
            productId: split.quotationLine.productId,
          },
        },
      });

      if (stockLevel && !split.isBackorder) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            quantityAvailable: stockLevel.quantityAvailable + split.quantityFulfilled,
            quantityReserved: Math.max(0, stockLevel.quantityReserved - split.quantityFulfilled),
          },
        });
      }

      // Update fulfillment status
      await tx.fulfillmentSplit.update({
        where: { id: splitId },
        data: { status: 'CANCELLED' },
      });
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel fulfillment',
    };
  }
}

// ===========================================
// BACKORDER MANAGEMENT
// ===========================================

/**
 * Get all backorders
 */
export async function getBackorders(pagination: PaginationOptions = {}) {
  return getFulfillmentSplits({ isBackorder: true }, pagination);
}

/**
 * Check if stock is now available for backorders
 * Returns backorders that can be fulfilled
 */
export async function checkBackorderAvailability(): Promise<
  Array<{
    splitId: string;
    productId: string;
    productName: string;
    quantityNeeded: number;
    nowAvailable: number;
    canFulfill: boolean;
  }>
> {
  const backorders = await prisma.fulfillmentSplit.findMany({
    where: {
      isBackorder: true,
      status: 'PENDING',
    },
    include: {
      quotationLine: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
      warehouse: { select: { id: true } },
    },
  });

  const results = [];

  for (const backorder of backorders) {
    const totalAvailable = await getTotalAvailableStock(backorder.quotationLine.productId);

    results.push({
      splitId: backorder.id,
      productId: backorder.quotationLine.productId,
      productName: backorder.quotationLine.product.name,
      quantityNeeded: backorder.quantityFulfilled,
      nowAvailable: totalAvailable,
      canFulfill: totalAvailable >= backorder.quantityFulfilled,
    });
  }

  return results;
}

// ===========================================
// DELIVERY SLIPPAGE TRACKING
// ===========================================

/**
 * Get fulfillments with delivery slippage (late or at-risk)
 */
export async function getDeliverySlippageAlerts(): Promise<
  Array<{
    id: string;
    quotationNumber: string;
    customerName: string;
    productName: string;
    warehouseName: string;
    estimatedShipDate: Date;
    actualShipDate: Date | null;
    status: FulfillmentStatus;
    slippageDays: number;
    isLate: boolean;
    isAtRisk: boolean;
  }>
> {
  const now = new Date();
  const atRiskThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

  const atRiskSplits = await prisma.fulfillmentSplit.findMany({
    where: {
      OR: [
        // Already late: shipped after estimated date
        {
          actualShipDate: { not: null },
          // Prisma doesn't support comparing two columns directly, so we'll filter in JS
        },
        // At risk: not shipped yet and estimated date is past or within 1 day
        {
          actualShipDate: null,
          estimatedShipDate: { lte: atRiskThreshold },
          status: { in: ['PENDING', 'PROCESSING'] },
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
  });

  return atRiskSplits
    .map((split) => {
      const estimatedDate = split.estimatedShipDate ?? now;
      const actualDate = split.actualShipDate;
      
      let slippageDays = 0;
      let isLate = false;
      let isAtRisk = false;

      if (actualDate && estimatedDate) {
        slippageDays = Math.ceil(
          (actualDate.getTime() - estimatedDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        isLate = slippageDays > 0;
      } else if (!actualDate && estimatedDate) {
        slippageDays = Math.ceil(
          (now.getTime() - estimatedDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        isLate = slippageDays > 0;
        isAtRisk = !isLate && estimatedDate <= atRiskThreshold;
      }

      return {
        id: split.id,
        quotationNumber: split.quotationLine.quotation.quotationNumber,
        customerName: split.quotationLine.quotation.customer.companyName || split.quotationLine.quotation.customer.name,
        productName: split.quotationLine.product.name,
        warehouseName: split.warehouse.name,
        estimatedShipDate: estimatedDate,
        actualShipDate: actualDate,
        status: split.status,
        slippageDays,
        isLate,
        isAtRisk,
      };
    })
    .filter((item) => item.isLate || item.isAtRisk);
}

// ===========================================
// FULFILLMENT SUMMARY & STATS
// ===========================================

/**
 * Get fulfillment summary statistics
 */
export async function getFulfillmentSummary() {
  const [
    total,
    totalPending,
    totalProcessing,
    totalShipped,
    totalDelivered,
    totalCancelled,
    totalBackorders,
  ] = await Promise.all([
    prisma.fulfillmentSplit.count(),
    prisma.fulfillmentSplit.count({ where: { status: 'PENDING' } }),
    prisma.fulfillmentSplit.count({ where: { status: 'PROCESSING' } }),
    prisma.fulfillmentSplit.count({ where: { status: 'SHIPPED' } }),
    prisma.fulfillmentSplit.count({ where: { status: 'DELIVERED' } }),
    prisma.fulfillmentSplit.count({ where: { status: 'CANCELLED' } }),
    prisma.fulfillmentSplit.count({ where: { isBackorder: true, status: { not: 'CANCELLED' } } }),
  ]);

  return {
    total,
    pending: totalPending,
    processing: totalProcessing,
    shipped: totalShipped,
    delivered: totalDelivered,
    cancelled: totalCancelled,
    backorders: totalBackorders,
  };
}

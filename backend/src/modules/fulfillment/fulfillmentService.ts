// ===========================================
// DealFlow360 - Fulfillment Service
// ===========================================
// DEV B's MODULE: Warehouse split algorithm
// PHASE 0: Interface stubs agreed upon by both developers.
// ===========================================

import { prisma } from '../../shared/db/prisma.js';
import { withTransaction } from '../../shared/db/utils.js';
import { dealEvents } from '../../shared/services/eventBus.js';
import { auditLogger } from '../../shared/services/auditLogger.js';
import { FulfillmentSplitSuggestion } from '../../shared/types/index.js';

// ===========================================
// INTERFACE (FROZEN IN PHASE 0)
// ===========================================

/**
 * Calculate the optimal warehouse split for a product quantity
 * 
 * Algorithm:
 * 1. Sort warehouses by available stock (descending)
 * 2. For each warehouse, take min(available, remaining)
 * 3. If remaining > 0 after all warehouses, mark as backorder
 * 
 * AGREED INTERFACE - DO NOT CHANGE SIGNATURE
 * 
 * @param productId - The product to fulfill
 * @param quantityNeeded - The quantity required
 * @returns Array of split suggestions with backorder flag
 * 
 * @example
 * // Dev B implements this in Phase 2
 * const splits = await calculateWarehouseSplit('prod-123', 100);
 * // Returns: [
 * //   { warehouseId: 'wh-1', warehouseName: 'Main', quantity: 50, isBackorder: false },
 * //   { warehouseId: 'wh-2', warehouseName: 'East', quantity: 30, isBackorder: false },
 * //   { warehouseId: null, warehouseName: 'Backorder', quantity: 20, isBackorder: true },
 * // ]
 */
export async function calculateWarehouseSplit(
  productId: string,
  quantityNeeded: number
): Promise<FulfillmentSplitSuggestion[]> {
  // ===========================================
  // TODO: DEV B IMPLEMENTS THIS IN PHASE 2
  // ===========================================
  //
  // Implementation steps:
  // 1. Fetch all stock levels for the product, ordered by quantity descending
  // 2. Iterate through warehouses, taking available stock
  // 3. Track remaining quantity needed
  // 4. If remaining > 0 after all warehouses, add backorder entry
  // 5. Return split suggestions
  //
  // Consider:
  // - Only active warehouses
  // - Only warehouses with quantityAvailable > quantityReserved
  // - Shipping cost weight (prefer lower cost warehouses if stock is equal)
  // ===========================================

  console.warn('[FulfillmentService] Using stub implementation - Dev B to implement in Phase 2');

  // Fetch stock levels sorted by available quantity
  const stockLevels = await prisma.stockLevel.findMany({
    where: {
      productId,
      quantityAvailable: { gt: 0 },
      warehouse: { isActive: true },
    },
    include: {
      warehouse: true,
    },
    orderBy: {
      quantityAvailable: 'desc',
    },
  });

  const splits: FulfillmentSplitSuggestion[] = [];
  let remaining = quantityNeeded;

  for (const stock of stockLevels) {
    if (remaining <= 0) break;

    const available = stock.quantityAvailable - stock.quantityReserved;
    const take = Math.min(available, remaining);

    if (take > 0) {
      splits.push({
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        quantity: take,
        isBackorder: false,
        estimatedShipDate: getEstimatedShipDate(stock.warehouse.shippingCostWeight.toNumber()),
      });
      remaining -= take;
    }
  }

  // Add backorder if we couldn't fulfill everything
  if (remaining > 0) {
    splits.push({
      warehouseId: '', // No warehouse for backorder
      warehouseName: 'Backorder',
      quantity: remaining,
      isBackorder: true,
      estimatedShipDate: null, // Unknown until stock arrives
    });
  }

  return splits;
}

/**
 * Execute a warehouse split for a quotation line
 * Uses a database transaction to prevent race conditions
 * 
 * @param quotationLineId - The line to fulfill
 * @param splits - The splits to execute (from calculateWarehouseSplit or manual override)
 * @returns The created fulfillment split records
 */
export async function executeFulfillmentSplit(
  quotationLineId: string,
  splits: Array<{ warehouseId: string; quantity: number }>,
  isManualOverride: boolean = false
): Promise<void> {
  // ===========================================
  // TODO: DEV B IMPLEMENTS THIS IN PHASE 2
  // ===========================================
  //
  // Implementation steps (MUST use transaction):
  // 1. Begin transaction
  // 2. For each split:
  //    a. Read current stock level
  //    b. Verify sufficient stock available
  //    c. Deduct from quantityAvailable, add to quantityReserved
  //    d. Create fulfillment_split record
  // 3. Emit stock.updated events
  // 4. Commit transaction
  //
  // On error: rollback transaction
  // ===========================================

  console.warn('[FulfillmentService] Using stub implementation - Dev B to implement in Phase 2');

  await withTransaction(async (tx) => {
    for (const split of splits) {
      if (!split.warehouseId || split.quantity <= 0) continue;

      // Get quotation line to find product
      const line = await tx.quotationLine.findUnique({
        where: { id: quotationLineId },
      });

      if (!line) {
        throw new Error(`Quotation line not found: ${quotationLineId}`);
      }

      // Read current stock
      const stockLevel = await tx.stockLevel.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: split.warehouseId,
            productId: line.productId,
          },
        },
      });

      if (!stockLevel) {
        throw new Error(`No stock record for warehouse ${split.warehouseId}`);
      }

      const available = stockLevel.quantityAvailable - stockLevel.quantityReserved;
      if (available < split.quantity) {
        throw new Error(`Insufficient stock in warehouse ${split.warehouseId}`);
      }

      // Reserve stock
      await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityReserved: stockLevel.quantityReserved + split.quantity,
        },
      });

      // Create fulfillment split record
      await tx.fulfillmentSplit.create({
        data: {
          quotationLineId,
          warehouseId: split.warehouseId,
          quantityFulfilled: split.quantity,
          isBackorder: false,
          isManualOverride,
          estimatedShipDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
          status: 'PENDING',
        },
      });

      // Emit stock update event
      dealEvents.emit('stock.updated', {
        warehouseId: split.warehouseId,
        productId: line.productId,
        previousQuantity: stockLevel.quantityAvailable,
        newQuantity: stockLevel.quantityAvailable, // Available unchanged, reserved increased
        reason: 'FULFILLMENT',
        updatedAt: new Date(),
      });
    }
  });
}

/**
 * Handle quotation confirmed event
 * This is the listener that Dev B registers for INTERSECTION POINT 2
 */
export async function handleQuotationConfirmed(payload: {
  quotationId: string;
  lines: Array<{ id: string; productId: string; quantity: number }>;
}): Promise<void> {
  // ===========================================
  // TODO: DEV B IMPLEMENTS THIS IN PHASE 2
  // ===========================================
  
  console.warn('[FulfillmentService] handleQuotationConfirmed - Dev B to implement in Phase 2');
  
  for (const line of payload.lines) {
    // Only fulfill physical products (HARDWARE)
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
    });

    if (product?.category === 'HARDWARE') {
      const splits = await calculateWarehouseSplit(line.productId, line.quantity);
      
      // Convert suggestions to execution format
      const executableSplits = splits
        .filter(s => !s.isBackorder && s.warehouseId)
        .map(s => ({
          warehouseId: s.warehouseId,
          quantity: s.quantity,
        }));

      if (executableSplits.length > 0) {
        await executeFulfillmentSplit(line.id, executableSplits);
      }
    }
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getEstimatedShipDate(shippingCostWeight: number): string {
  // Higher weight = slower shipping
  const daysToAdd = Math.ceil(2 + shippingCostWeight);
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
}

// ===========================================
// MODULE INITIALIZATION
// ===========================================

/**
 * Initialize the fulfillment module
 * Registers event listeners for inter-module communication
 * 
 * Call this during app startup:
 * import { initFulfillmentModule } from './modules/fulfillment/fulfillmentService';
 * initFulfillmentModule();
 */
export function initFulfillmentModule(): void {
  // INTERSECTION POINT 2: Listen for quotation.confirmed
  dealEvents.on('quotation.confirmed', async (payload) => {
    console.log(`[FulfillmentModule] Received quotation.confirmed for ${payload.quotationId}`);
    
    try {
      await handleQuotationConfirmed({
        quotationId: payload.quotationId,
        lines: payload.lines.map(l => ({
          id: l.id,
          productId: l.productId,
          quantity: l.quantity,
        })),
      });
    } catch (error) {
      console.error('[FulfillmentModule] Error handling quotation.confirmed:', error);
    }
  });

  console.log('[FulfillmentModule] Initialized - listening for quotation.confirmed events');
}

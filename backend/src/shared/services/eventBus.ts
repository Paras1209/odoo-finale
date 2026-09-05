// ===========================================
// DealFlow360 - Event Bus for Inter-Module Communication
// ===========================================
// PHASE 0: Typed event emitter for decoupled module communication.
// This file is FROZEN after Phase 0 - do not modify individually.
//
// INTERSECTION POINT 2: Dev A emits events, Dev B listens.
// Example: quotation.confirmed → triggers fulfillment split
// ===========================================

import { EventEmitter } from 'events';
import { Quotation, QuotationLine } from '../types/index.js';

// ===========================================
// EVENT PAYLOAD TYPES
// ===========================================

/**
 * Quotation confirmed - ready for fulfillment
 * Emitted by: Dev A (Quotation module)
 * Listened by: Dev B (Fulfillment module)
 */
export interface QuotationConfirmedEvent {
  quotationId: string;
  quotation: Quotation;
  lines: QuotationLine[];
  customerId: string;
  confirmedBy: {
    id: string;
    type: 'INTERNAL' | 'CUSTOMER';
  };
  confirmedAt: Date;
}

/**
 * Quotation approved - may trigger notifications
 * Emitted by: Dev A (Approval module)
 * Listened by: Any module needing approval notifications
 */
export interface QuotationApprovedEvent {
  quotationId: string;
  quotation: Quotation;
  approvalLevel: 'MANAGER' | 'FINANCE';
  approverId: string;
  approvedAt: Date;
}

/**
 * Quotation rejected
 * Emitted by: Dev A (Approval module)
 * Listened by: Dashboard module for alerts
 */
export interface QuotationRejectedEvent {
  quotationId: string;
  quotation: Quotation;
  rejectedBy: string;
  rejectionLevel: 'MANAGER' | 'FINANCE';
  reason: string;
  rejectedAt: Date;
}

/**
 * Quotation status changed (generic)
 * Emitted by: Dev A (Quotation module)
 * Listened by: Dashboard, Portal modules
 */
export interface QuotationStatusChangedEvent {
  quotationId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: {
    id: string;
    type: 'INTERNAL' | 'CUSTOMER';
  };
  changedAt: Date;
}

/**
 * Stock level updated
 * Emitted by: Dev B (Fulfillment module)
 * Listened by: Dashboard module for backorder alerts
 */
export interface StockUpdatedEvent {
  warehouseId: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: 'FULFILLMENT' | 'ADJUSTMENT' | 'RESTOCK' | 'RETURN';
  updatedAt: Date;
}

/**
 * Fulfillment completed
 * Emitted by: Dev B (Fulfillment module)
 * Listened by: Billing module to generate invoice
 */
export interface FulfillmentCompletedEvent {
  quotationId: string;
  quotationLineId: string;
  warehouseId: string;
  quantity: number;
  shippedAt: Date;
}

/**
 * Invoice generated
 * Emitted by: Dev A (Billing module)
 * Listened by: Portal module for customer notifications
 */
export interface InvoiceGeneratedEvent {
  invoiceId: string;
  quotationId: string;
  customerId: string;
  amount: number;
  invoiceType: 'ONE_TIME' | 'RECURRING';
  dueDate: Date;
  generatedAt: Date;
}

/**
 * Payment received
 * Emitted by: Dev A (Billing module)
 * Listened by: Dashboard module for reporting
 */
export interface PaymentReceivedEvent {
  invoiceId: string;
  quotationId: string;
  customerId: string;
  amount: number;
  paidAt: Date;
}

/**
 * Customer counter-discount requested
 * Emitted by: Dev B (Portal module)
 * Listened by: Quotation module for re-evaluation
 */
export interface CustomerCounterDiscountEvent {
  quotationId: string;
  quotationLineId: string;
  customerId: string;
  requestedDiscountPct: number;
  previousDiscountPct: number;
  comment?: string;
  requestedAt: Date;
}

/**
 * Backorder can be fulfilled (stock now available)
 * Emitted by: Dev B (Fulfillment module)
 * Listened by: Dashboard for consolidation alerts
 */
export interface BackorderReadyEvent {
  fulfillmentSplitId: string;
  quotationLineId: string;
  quotationId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  detectedAt: Date;
}

// ===========================================
// EVENT MAP
// ===========================================

/**
 * Complete map of all events and their payloads
 * Add new events here as the system grows
 */
export interface DealEventMap {
  // Quotation lifecycle events
  'quotation.confirmed': QuotationConfirmedEvent;
  'quotation.approved': QuotationApprovedEvent;
  'quotation.rejected': QuotationRejectedEvent;
  'quotation.statusChanged': QuotationStatusChangedEvent;
  
  // Fulfillment events
  'stock.updated': StockUpdatedEvent;
  'fulfillment.completed': FulfillmentCompletedEvent;
  'backorder.ready': BackorderReadyEvent;
  
  // Billing events
  'invoice.generated': InvoiceGeneratedEvent;
  'payment.received': PaymentReceivedEvent;
  
  // Portal events
  'portal.counterDiscount': CustomerCounterDiscountEvent;
}

// ===========================================
// TYPED EVENT EMITTER
// ===========================================

type EventCallback<T> = (payload: T) => void | Promise<void>;

/**
 * Typed event emitter for DealFlow360
 * Provides type safety for event names and payloads
 */
class TypedEventEmitter {
  private emitter: EventEmitter;
  private listenerCounts: Map<string, number>;

  constructor() {
    this.emitter = new EventEmitter();
    this.listenerCounts = new Map();
    
    // Increase max listeners for production use
    this.emitter.setMaxListeners(50);
  }

  /**
   * Emit an event with type-safe payload
   * 
   * @example
   * // Dev A emits when quotation is confirmed:
   * dealEvents.emit('quotation.confirmed', {
   *   quotationId: quote.id,
   *   quotation: quote,
   *   lines: quote.lines,
   *   customerId: quote.customerId,
   *   confirmedBy: { id: userId, type: 'INTERNAL' },
   *   confirmedAt: new Date(),
   * });
   */
  emit<K extends keyof DealEventMap>(event: K, payload: DealEventMap[K]): boolean {
    console.log(`[EventBus] Emitting event: ${String(event)}`);
    return this.emitter.emit(String(event), payload);
  }

  /**
   * Register a listener for an event with type-safe callback
   * 
   * @example
   * // Dev B listens for quotation confirmation in fulfillment module:
   * dealEvents.on('quotation.confirmed', async (payload) => {
   *   await handleFulfillmentSplit(payload.quotationId, payload.lines);
   * });
   */
  on<K extends keyof DealEventMap>(event: K, callback: EventCallback<DealEventMap[K]>): this {
    const eventName = String(event);
    this.emitter.on(eventName, callback);
    
    const count = (this.listenerCounts.get(eventName) || 0) + 1;
    this.listenerCounts.set(eventName, count);
    
    console.log(`[EventBus] Registered listener for: ${eventName} (total: ${count})`);
    return this;
  }

  /**
   * Register a one-time listener for an event
   */
  once<K extends keyof DealEventMap>(event: K, callback: EventCallback<DealEventMap[K]>): this {
    this.emitter.once(String(event), callback);
    return this;
  }

  /**
   * Remove a specific listener
   */
  off<K extends keyof DealEventMap>(event: K, callback: EventCallback<DealEventMap[K]>): this {
    const eventName = String(event);
    this.emitter.off(eventName, callback);
    
    const count = Math.max(0, (this.listenerCounts.get(eventName) || 0) - 1);
    this.listenerCounts.set(eventName, count);
    
    return this;
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<K extends keyof DealEventMap>(event?: K): this {
    if (event) {
      this.emitter.removeAllListeners(String(event));
      this.listenerCounts.set(String(event), 0);
    } else {
      this.emitter.removeAllListeners();
      this.listenerCounts.clear();
    }
    return this;
  }

  /**
   * Get the count of listeners for an event
   */
  listenerCount<K extends keyof DealEventMap>(event: K): number {
    return this.emitter.listenerCount(String(event));
  }

  /**
   * Get all registered event names
   */
  eventNames(): string[] {
    return this.emitter.eventNames() as string[];
  }
}

// ===========================================
// SINGLETON EXPORT
// ===========================================

/**
 * Singleton instance of the event bus
 * Import this in your modules:
 * 
 * import { dealEvents } from '@/shared/services/eventBus';
 * 
 * // Dev A's quotation module - EMIT events:
 * dealEvents.emit('quotation.confirmed', { ... });
 * 
 * // Dev B's fulfillment module - LISTEN for events:
 * dealEvents.on('quotation.confirmed', handleFulfillmentSplit);
 */
export const dealEvents = new TypedEventEmitter();

// ===========================================
// USAGE DOCUMENTATION
// ===========================================

/**
 * INTERSECTION POINT 2: Warehouse split triggers after Quotation CONFIRMED
 * 
 * This is how Dev A and Dev B communicate without editing each other's files:
 * 
 * === DEV A's CODE (quotation module) ===
 * 
 * // In quotationService.ts, after transitioning to CONFIRMED:
 * import { dealEvents } from '@/shared/services/eventBus';
 * 
 * async function confirmQuotation(quotationId: string, userId: string) {
 *   const quotation = await updateQuotationStatus(quotationId, 'CONFIRMED');
 *   const lines = await getQuotationLines(quotationId);
 *   
 *   // Emit event - Dev A doesn't need to know about fulfillment module
 *   dealEvents.emit('quotation.confirmed', {
 *     quotationId,
 *     quotation,
 *     lines,
 *     customerId: quotation.customerId,
 *     confirmedBy: { id: userId, type: 'INTERNAL' },
 *     confirmedAt: new Date(),
 *   });
 *   
 *   return quotation;
 * }
 * 
 * === DEV B's CODE (fulfillment module) ===
 * 
 * // In fulfillmentModule.ts initialization:
 * import { dealEvents } from '@/shared/services/eventBus';
 * import { handleFulfillmentSplit } from './fulfillmentService';
 * 
 * // Register listener - Dev B doesn't need to edit Dev A's files
 * export function initFulfillmentModule() {
 *   dealEvents.on('quotation.confirmed', async (payload) => {
 *     console.log(`Processing fulfillment for quotation: ${payload.quotationId}`);
 *     await handleFulfillmentSplit(payload.quotationId, payload.lines);
 *   });
 * }
 */

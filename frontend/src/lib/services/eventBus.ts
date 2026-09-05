// ===========================================
// DealFlow360 - Event Bus for Inter-Module Communication
// ===========================================
// Typed event emitter for decoupled module communication.
// ===========================================

import { EventEmitter } from 'events';
import { Quotation, QuotationLine } from '@/lib/types';

// ===========================================
// EVENT PAYLOAD TYPES
// ===========================================

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

export interface QuotationApprovedEvent {
  quotationId: string;
  quotation: Quotation;
  approvalLevel: 'MANAGER' | 'FINANCE';
  approverId: string;
  approvedAt: Date;
}

export interface QuotationRejectedEvent {
  quotationId: string;
  quotation: Quotation;
  rejectedBy: string;
  rejectionLevel: 'MANAGER' | 'FINANCE';
  reason: string;
  rejectedAt: Date;
}

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

export interface StockUpdatedEvent {
  warehouseId: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: 'FULFILLMENT' | 'ADJUSTMENT' | 'RESTOCK' | 'RETURN';
  updatedAt: Date;
}

export interface FulfillmentCompletedEvent {
  quotationId: string;
  quotationLineId: string;
  warehouseId: string;
  quantity: number;
  shippedAt: Date;
}

export interface InvoiceGeneratedEvent {
  invoiceId: string;
  invoiceNumber: string;
  quotationId: string;
  customerId: string;
  amount: number;
  invoiceType: 'ONE_TIME' | 'RECURRING';
  dueDate: Date;
  generatedAt: Date;
}

export interface InvoiceSentEvent {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  sentAt: Date;
  sentBy: string;
}

export interface InvoiceStatusChangedEvent {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  previousStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  newStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  changedAt: Date;
  reason?: string;
}

export interface PaymentReceivedEvent {
  invoiceId: string;
  quotationId: string;
  customerId: string;
  amount: number;
  paidAt: Date;
}

export interface SubscriptionCreatedEvent {
  subscriptionId: string;
  quotationId: string;
  quotationLineId: string;
  customerId: string;
  productId: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  amount: number;
  startDate: Date;
  createdAt: Date;
}

export interface SubscriptionModifiedEvent {
  subscriptionId: string;
  quotationLineId: string;
  customerId: string;
  previousAmount: number;
  newAmount: number;
  previousQuantity: number;
  newQuantity: number;
  prorationAmount: number;
  effectiveDate: Date;
  modifiedBy: {
    id: string;
    type: 'INTERNAL' | 'CUSTOMER';
  };
  modifiedAt: Date;
}

export interface SubscriptionCancelledEvent {
  subscriptionId: string;
  quotationLineId: string;
  customerId: string;
  cancellationType: 'IMMEDIATE' | 'END_OF_CYCLE';
  refundAmount: number;
  creditNoteId?: string;
  cancelledBy: {
    id: string;
    type: 'INTERNAL' | 'CUSTOMER';
  };
  cancelledAt: Date;
  effectiveDate: Date;
  reason?: string;
}

export interface SubscriptionRenewedEvent {
  subscriptionId: string;
  quotationLineId: string;
  customerId: string;
  cycleNumber: number;
  amount: number;
  billingScheduleId: string;
  renewedAt: Date;
  nextDueDate: Date;
}

export interface CreditNoteIssuedEvent {
  creditNoteId: string;
  creditNoteNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  reason: string;
  issuedAt: Date;
}

export interface CustomerCounterDiscountEvent {
  quotationId: string;
  quotationLineId: string;
  customerId: string;
  requestedDiscountPct: number;
  previousDiscountPct: number;
  comment?: string;
  requestedAt: Date;
}

export interface PortalCommentEvent {
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  commentId: string;
  commentText: string;
  quotationLineId: string | null;
  repId: string;
  createdAt: Date;
}

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

export interface DealEventMap {
  'quotation.confirmed': QuotationConfirmedEvent;
  'quotation.approved': QuotationApprovedEvent;
  'quotation.rejected': QuotationRejectedEvent;
  'quotation.statusChanged': QuotationStatusChangedEvent;
  'stock.updated': StockUpdatedEvent;
  'fulfillment.completed': FulfillmentCompletedEvent;
  'backorder.ready': BackorderReadyEvent;
  'invoice.generated': InvoiceGeneratedEvent;
  'invoice.sent': InvoiceSentEvent;
  'invoice.statusChanged': InvoiceStatusChangedEvent;
  'payment.received': PaymentReceivedEvent;
  'creditNote.issued': CreditNoteIssuedEvent;
  'subscription.created': SubscriptionCreatedEvent;
  'subscription.modified': SubscriptionModifiedEvent;
  'subscription.cancelled': SubscriptionCancelledEvent;
  'subscription.renewed': SubscriptionRenewedEvent;
  'portal.counterDiscount': CustomerCounterDiscountEvent;
  'portal.comment': PortalCommentEvent;
}

// ===========================================
// TYPED EVENT EMITTER
// ===========================================

type EventCallback<T> = (payload: T) => void | Promise<void>;

class TypedEventEmitter {
  private emitter: EventEmitter;
  private listenerCounts: Map<string, number>;

  constructor() {
    this.emitter = new EventEmitter();
    this.listenerCounts = new Map();
    this.emitter.setMaxListeners(50);
  }

  emit<K extends keyof DealEventMap>(event: K, payload: DealEventMap[K]): boolean {
    console.log(`[EventBus] Emitting event: ${String(event)}`);
    return this.emitter.emit(String(event), payload);
  }

  on<K extends keyof DealEventMap>(event: K, callback: EventCallback<DealEventMap[K]>): this {
    const eventName = String(event);
    this.emitter.on(eventName, callback);
    
    const count = (this.listenerCounts.get(eventName) || 0) + 1;
    this.listenerCounts.set(eventName, count);
    
    console.log(`[EventBus] Registered listener for: ${eventName} (total: ${count})`);
    return this;
  }

  once<K extends keyof DealEventMap>(event: K, callback: EventCallback<DealEventMap[K]>): this {
    this.emitter.once(String(event), callback);
    return this;
  }

  off<K extends keyof DealEventMap>(event: K, callback: EventCallback<DealEventMap[K]>): this {
    const eventName = String(event);
    this.emitter.off(eventName, callback);
    
    const count = Math.max(0, (this.listenerCounts.get(eventName) || 0) - 1);
    this.listenerCounts.set(eventName, count);
    
    return this;
  }

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

  listenerCount<K extends keyof DealEventMap>(event: K): number {
    return this.emitter.listenerCount(String(event));
  }

  eventNames(): string[] {
    return this.emitter.eventNames() as string[];
  }
}

// ===========================================
// SINGLETON EXPORT
// ===========================================

export const dealEvents = new TypedEventEmitter();

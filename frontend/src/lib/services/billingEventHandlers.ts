// ===========================================
// DealFlow360 - Billing Event Handlers
// ===========================================
// Listens for quotation events and triggers billing logic:
// - Invoice generation for one-time items
// - Billing schedule generation for recurring items
// ===========================================

import { dealEvents, type QuotationConfirmedEvent } from './eventBus';
import { 
  generateInvoice, 
  generateBillingSchedulesForQuotation,
  sendInvoice,
} from './billingService';
import { generateFulfillmentForQuotation } from './fulfillmentService';
import { auditLogger } from './auditLogger';
import { ActorType } from '@/lib/types';

// ===========================================
// HANDLER STATE
// ===========================================

let handlersRegistered = false;

// ===========================================
// EVENT HANDLERS
// ===========================================

/**
 * Handle quotation confirmed event
 * This is the main trigger for billing and fulfillment processes
 */
async function handleQuotationConfirmed(event: QuotationConfirmedEvent): Promise<void> {
  const { quotationId, quotation, lines, customerId, confirmedBy, confirmedAt } = event;
  
  console.log(`[BillingHandlers] Processing quotation.confirmed for ${quotationId}`);

  const results = {
    oneTimeInvoice: { success: false, invoiceId: null as string | null, error: null as string | null },
    billingSchedules: { success: false, count: 0, error: null as string | null },
    fulfillment: { success: false, resultCount: 0, error: null as string | null },
  };

  // Check if there are one-time items to invoice
  const hasOneTimeItems = lines.some(line => line.lineType === 'ONE_TIME');
  const hasRecurringItems = lines.some(line => line.lineType === 'RECURRING');

  // Map confirmedBy.type to ActorType enum
  const actorType = confirmedBy.type === 'INTERNAL' ? ActorType.INTERNAL : ActorType.CUSTOMER;

  // 1. Generate invoice for one-time items
  if (hasOneTimeItems) {
    try {
      console.log(`[BillingHandlers] Generating one-time invoice for quotation ${quotationId}`);
      const invoiceResult = await generateInvoice(quotationId, 'ONE_TIME');
      
      if (invoiceResult.success && invoiceResult.invoice) {
        results.oneTimeInvoice.success = true;
        results.oneTimeInvoice.invoiceId = (invoiceResult.invoice as { id: string }).id;
        
        // Emit invoice generated event
        dealEvents.emit('invoice.generated', {
          invoiceId: (invoiceResult.invoice as { id: string }).id,
          invoiceNumber: (invoiceResult.invoice as { invoiceNumber: string }).invoiceNumber,
          quotationId,
          customerId,
          amount: (invoiceResult.invoice as { totalAmount: number }).totalAmount,
          invoiceType: 'ONE_TIME',
          dueDate: (invoiceResult.invoice as { dueDate: Date }).dueDate,
          generatedAt: new Date(),
        });

        // Auto-send the invoice (transition from DRAFT to SENT)
        const sendResult = await sendInvoice((invoiceResult.invoice as { id: string }).id);
        if (sendResult.success) {
          console.log(`[BillingHandlers] Invoice auto-sent for quotation ${quotationId}`);
        }
        
        await auditLogger.log({
          entityType: 'INVOICE',
          entityId: (invoiceResult.invoice as { id: string }).id,
          action: 'CREATE',
          actorId: confirmedBy.id,
          actorType: actorType,
          afterState: {
            quotationId,
            invoiceType: 'ONE_TIME',
            triggeredBy: 'quotation.confirmed',
          },
        });
      } else {
        results.oneTimeInvoice.error = invoiceResult.error || 'Unknown error';
        console.error(`[BillingHandlers] Failed to generate one-time invoice: ${invoiceResult.error}`);
      }
    } catch (error) {
      results.oneTimeInvoice.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BillingHandlers] Error generating one-time invoice:`, error);
    }
  }

  // 2. Generate billing schedules for recurring items
  if (hasRecurringItems) {
    try {
      console.log(`[BillingHandlers] Generating billing schedules for quotation ${quotationId}`);
      const scheduleResults = await generateBillingSchedulesForQuotation(quotationId);
      
      results.billingSchedules.success = true;
      results.billingSchedules.count = scheduleResults.length;

      // Emit subscription created events for each recurring line
      for (const scheduleResult of scheduleResults) {
        const line = lines.find(l => l.id === scheduleResult.quotationLineId);
        if (line) {
          dealEvents.emit('subscription.created', {
            subscriptionId: scheduleResult.quotationLineId, // Using line ID as subscription ID
            quotationId,
            quotationLineId: scheduleResult.quotationLineId,
            customerId,
            productId: line.productId,
            frequency: (line.billingFrequency || 'MONTHLY') as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
            amount: scheduleResults[0]?.schedules[0]?.amount || 0,
            startDate: scheduleResult.schedules[0]?.dueDate || new Date(),
            createdAt: new Date(),
          });
        }
      }

      await auditLogger.log({
        entityType: 'QUOTATION',
        entityId: quotationId,
        action: 'UPDATE',
        actorId: confirmedBy.id,
        actorType: actorType,
        afterState: {
          action: 'BILLING_SCHEDULES_GENERATED',
          schedulesCount: scheduleResults.length,
          triggeredBy: 'quotation.confirmed',
        },
      });

      console.log(`[BillingHandlers] Created ${scheduleResults.length} billing schedules`);
    } catch (error) {
      results.billingSchedules.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BillingHandlers] Error generating billing schedules:`, error);
    }
  }

  // 3. Generate fulfillment splits for physical items
  try {
    console.log(`[BillingHandlers] Generating fulfillment for quotation ${quotationId}`);
    const fulfillmentResult = await generateFulfillmentForQuotation(quotationId);
    
    if (fulfillmentResult.success) {
      results.fulfillment.success = true;
      results.fulfillment.resultCount = fulfillmentResult.results.length;
      console.log(`[BillingHandlers] Created ${results.fulfillment.resultCount} fulfillment results`);
    } else {
      // Get error from first failed result if any
      const failedResult = fulfillmentResult.results.find(r => !r.success);
      results.fulfillment.error = failedResult?.error || 'Unknown error';
      // Note: This may fail if stock is unavailable, which is expected
      console.log(`[BillingHandlers] Fulfillment generation note: ${results.fulfillment.error}`);
    }
  } catch (error) {
    results.fulfillment.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BillingHandlers] Error generating fulfillment:`, error);
  }

  console.log(`[BillingHandlers] Completed processing for quotation ${quotationId}:`, results);
}

// ===========================================
// HANDLER REGISTRATION
// ===========================================

/**
 * Register all billing event handlers
 * This should be called once during application initialization
 */
export function registerBillingEventHandlers(): void {
  if (handlersRegistered) {
    console.log('[BillingHandlers] Handlers already registered, skipping');
    return;
  }

  console.log('[BillingHandlers] Registering billing event handlers...');

  // Register for quotation confirmed event
  dealEvents.on('quotation.confirmed', handleQuotationConfirmed);

  handlersRegistered = true;
  console.log('[BillingHandlers] Billing event handlers registered successfully');
}

/**
 * Unregister all billing event handlers
 * Useful for testing or cleanup
 */
export function unregisterBillingEventHandlers(): void {
  if (!handlersRegistered) {
    return;
  }

  dealEvents.off('quotation.confirmed', handleQuotationConfirmed);
  handlersRegistered = false;
  console.log('[BillingHandlers] Billing event handlers unregistered');
}

/**
 * Check if handlers are registered
 */
export function areBillingHandlersRegistered(): boolean {
  return handlersRegistered;
}

// ===========================================
// AUTO-REGISTRATION
// ===========================================
// Register handlers immediately when this module is imported
// This ensures handlers are active as soon as the service layer is used
registerBillingEventHandlers();

// ===========================================
// DealFlow360 - Credit Notes API
// ===========================================
// M4 - Dev A: Credit note management for invoices
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { createCreditNoteSchema } from '@/lib/validators';
import { 
  getCreditNotes, 
  createCreditNote, 
  issueCreditNote, 
  applyCreditNote,
  getInvoiceById,
} from '@/lib/services/billingService';
import { auditLogger, dealEvents } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/billing/invoices/[id]/credit-notes - List credit notes for an invoice
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: invoiceId } = await params;

    // Verify invoice exists
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    const creditNotes = await getCreditNotes(invoiceId);

    return NextResponse.json({
      success: true,
      data: creditNotes.map(cn => ({
        id: cn.id,
        creditNoteNumber: cn.creditNoteNumber,
        invoiceId: cn.invoiceId,
        amount: cn.amount.toNumber(),
        reason: cn.reason,
        status: cn.status,
        issuedAt: cn.issuedAt?.toISOString() ?? null,
        createdAt: cn.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Billing/CreditNotes/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/billing/invoices/[id]/credit-notes - Create a credit note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only finance/admin can create credit notes
    const financeRoles = [UserRole.FINANCE_OPS, UserRole.ADMIN];
    if (!session.user.role || !financeRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only finance users can create credit notes' } },
        { status: 403 }
      );
    }

    const { id: invoiceId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Verify invoice exists
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    // Handle create action (default)
    if (!action || action === 'create') {
      const body = await request.json();
      const parsed = createCreditNoteSchema.omit({ invoiceId: true }).safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { amount, reason } = parsed.data;

      const result = await createCreditNote(invoiceId, amount, reason);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: 'CREATE_FAILED', message: result.error } },
          { status: 400 }
        );
      }

      const creditNote = result.creditNote as { id: string; creditNoteNumber: string };

      await auditLogger.log({
        entityType: 'CREDIT_NOTE',
        entityId: creditNote.id,
        actorId: session.user.id,
        actorType: ActorType.INTERNAL,
        action: 'CREATE',
        afterState: { invoiceId, amount, reason },
      });

      return NextResponse.json({
        success: true,
        data: result.creditNote,
        message: 'Credit note created successfully',
      }, { status: 201 });
    }

    // Handle issue action
    if (action === 'issue') {
      const body = await request.json();
      const { creditNoteId } = body as { creditNoteId: string };

      if (!creditNoteId) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'creditNoteId is required' } },
          { status: 400 }
        );
      }

      const result = await issueCreditNote(creditNoteId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: 'ISSUE_FAILED', message: result.error } },
          { status: 400 }
        );
      }

      await auditLogger.log({
        entityType: 'CREDIT_NOTE',
        entityId: creditNoteId,
        actorId: session.user.id,
        actorType: ActorType.INTERNAL,
        action: 'ISSUE',
      });

      dealEvents.emit('creditNote.issued', {
        creditNoteId,
        creditNoteNumber: '', // Would need to fetch for complete event
        invoiceId,
        customerId: invoice.quotation.customer.id,
        amount: 0, // Would need to fetch for complete event
        reason: '',
        issuedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Credit note issued successfully',
      });
    }

    // Handle apply action
    if (action === 'apply') {
      const body = await request.json();
      const { creditNoteId } = body as { creditNoteId: string };

      if (!creditNoteId) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'creditNoteId is required' } },
          { status: 400 }
        );
      }

      const result = await applyCreditNote(creditNoteId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: 'APPLY_FAILED', message: result.error } },
          { status: 400 }
        );
      }

      await auditLogger.log({
        entityType: 'CREDIT_NOTE',
        entityId: creditNoteId,
        actorId: session.user.id,
        actorType: ActorType.INTERNAL,
        action: 'APPLY',
      });

      return NextResponse.json({
        success: true,
        message: 'Credit note applied successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action. Use ?action=create, ?action=issue, or ?action=apply' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Billing/CreditNotes/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

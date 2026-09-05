// ===========================================
// DealFlow360 - Invoice PDF Generation API
// ===========================================
// Generates PDF invoices using @react-pdf/renderer
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { InvoicePDF, type InvoicePDFData } from '@/components/pdf/InvoicePDF';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/billing/invoices/[id]/pdf - Generate and return PDF
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                tier: true,
                companyName: true,
                address: true,
                phone: true,
              },
            },
            lines: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    // Prepare PDF data - use totalAmount directly without adding extra taxes
    // The totalAmount should already match the quotation total
    const pdfData: InvoicePDFData = {
      invoiceNumber: invoice.invoiceNumber,
      quotationNumber: invoice.quotation.quotationNumber,
      status: invoice.status,
      invoiceType: invoice.invoiceType,
      customer: {
        name: invoice.quotation.customer.name,
        email: invoice.quotation.customer.email,
        tier: invoice.quotation.customer.tier,
        companyName: invoice.quotation.customer.companyName ?? undefined,
        address: invoice.quotation.customer.address ?? undefined,
        phone: invoice.quotation.customer.phone ?? undefined,
      },
      lines: invoice.quotation.lines.map(line => ({
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toNumber(),
        discountPct: line.discountPct.toNumber(),
        lineTotal: line.lineTotal.toNumber(),
      })),
      // Use totalAmount directly - this should match quotation total (no extra tax)
      totalAmount: invoice.totalAmount.toNumber(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      issuedAt: invoice.issuedAt?.toISOString() ?? null,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
    };

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(<InvoicePDF data={pdfData} />);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', pdfBuffer.length.toString());
    
    if (download) {
      // Force download with filename
      headers.set(
        'Content-Disposition',
        `attachment; filename="${invoice.invoiceNumber}.pdf"`
      );
    } else {
      // Inline display (preview)
      headers.set(
        'Content-Disposition',
        `inline; filename="${invoice.invoiceNumber}.pdf"`
      );
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Billing/Invoices/PDF] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to generate PDF',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// ===========================================
// DealFlow360 - Portal Quotation Comments API
// ===========================================
// GET and POST comments for quotation negotiation
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { auditLogger, dealEvents } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface PortalCommentDTO {
  id: string;
  authorType: 'REP' | 'CUSTOMER';
  authorName: string;
  commentText: string;
  quotationLineId: string | null;
  productName: string | null;
  createdAt: string;
}

// GET - Fetch comments for a quotation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const customerId = session.user.id;

    // Verify quotation belongs to customer
    const quotation = await prisma.quotation.findUnique({
      where: { id, customerId },
      select: { id: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // Fetch comments with author details
    const comments = await prisma.quotationComment.findMany({
      where: { quotationId: id },
      include: {
        quotationLine: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get author names
    const customerIds = comments
      .filter(c => c.authorType === 'CUSTOMER')
      .map(c => c.authorId);
    const userIds = comments
      .filter(c => c.authorType === 'INTERNAL')
      .map(c => c.authorId);

    const [customers, users] = await Promise.all([
      customerIds.length > 0
        ? prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true },
          })
        : [],
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const result: PortalCommentDTO[] = comments.map(comment => ({
      id: comment.id,
      authorType: comment.authorType === 'CUSTOMER' ? 'CUSTOMER' : 'REP',
      authorName: comment.authorType === 'CUSTOMER'
        ? customerMap.get(comment.authorId) || 'Customer'
        : userMap.get(comment.authorId) || 'Sales Rep',
      commentText: comment.commentText,
      quotationLineId: comment.quotationLineId,
      productName: comment.quotationLine?.product.name || null,
      createdAt: comment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Portal/Comments] GET Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST - Add a comment to the quotation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const customerId = session.user.id;
    const body = await request.json();

    // Validate input
    const { commentText, quotationLineId } = body;
    
    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Comment text is required' } },
        { status: 400 }
      );
    }

    if (commentText.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Comment must be less than 1000 characters' } },
        { status: 400 }
      );
    }

    // Verify quotation belongs to customer
    const quotation = await prisma.quotation.findUnique({
      where: { id, customerId },
      select: { 
        id: true, 
        quotationNumber: true,
        repId: true,
        lines: { select: { id: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // Validate quotation line if provided
    if (quotationLineId) {
      const lineExists = quotation.lines.some(l => l.id === quotationLineId);
      if (!lineExists) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid quotation line' } },
          { status: 400 }
        );
      }
    }

    // Create comment
    const comment = await prisma.quotationComment.create({
      data: {
        quotationId: id,
        quotationLineId: quotationLineId || null,
        authorType: 'CUSTOMER',
        authorId: customerId,
        commentText: commentText.trim(),
      },
      include: {
        quotationLine: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Update quotation last activity
    await prisma.quotation.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });

    // Emit event for notifications
    dealEvents.emit('portal.comment', {
      quotationId: id,
      quotationNumber: quotation.quotationNumber,
      customerId,
      customerName: session.user.name,
      commentId: comment.id,
      commentText: commentText.trim(),
      quotationLineId: quotationLineId || null,
      repId: quotation.repId,
      createdAt: new Date(),
    });

    // Audit log
    await auditLogger.logCreate(
      customerId,
      ActorType.CUSTOMER,
      'QUOTATION_COMMENT',
      comment.id,
      {
        quotationId: id,
        quotationLineId: quotationLineId || null,
        commentText: commentText.trim(),
      }
    );

    const result: PortalCommentDTO = {
      id: comment.id,
      authorType: 'CUSTOMER',
      authorName: session.user.name || 'Customer',
      commentText: comment.commentText,
      quotationLineId: comment.quotationLineId,
      productName: comment.quotationLine?.product.name || null,
      createdAt: comment.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('[Portal/Comments] POST Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

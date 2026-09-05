import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quotation/[id]/comments
 * Fetch all negotiation comments for a quotation (internal users)
 */
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

    // Verify quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, quotationNumber: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // Fetch all comments with author info
    const comments = await prisma.quotationComment.findMany({
      where: { quotationId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Get author details for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        let authorName = 'Unknown';
        let authorEmail = '';

        if (comment.authorType === ActorType.INTERNAL) {
          const user = await prisma.user.findUnique({
            where: { id: comment.authorId },
            select: { name: true, email: true },
          });
          if (user) {
            authorName = user.name;
            authorEmail = user.email;
          }
        } else if (comment.authorType === ActorType.CUSTOMER) {
          const customer = await prisma.customer.findUnique({
            where: { id: comment.authorId },
            select: { name: true, email: true },
          });
          if (customer) {
            authorName = customer.name;
            authorEmail = customer.email;
          }
        }

        return {
          id: comment.id,
          quotationId: comment.quotationId,
          quotationLineId: comment.quotationLineId,
          authorType: comment.authorType,
          authorId: comment.authorId,
          authorName,
          authorEmail,
          commentText: comment.commentText,
          createdAt: comment.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: commentsWithAuthors,
    });
  } catch (error) {
    console.error('[Quotation/Comments/GET] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotation/[id]/comments
 * Add a negotiation comment (internal users)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { commentText, quotationLineId } = body;

    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Comment text is required' } },
        { status: 400 }
      );
    }

    // Verify quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, quotationNumber: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // If quotationLineId is provided, verify it exists
    if (quotationLineId) {
      const line = await prisma.quotationLine.findUnique({
        where: { id: quotationLineId, quotationId: id },
      });
      if (!line) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Quotation line not found' } },
          { status: 404 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.quotationComment.create({
      data: {
        quotationId: id,
        quotationLineId: quotationLineId || null,
        authorType: ActorType.INTERNAL,
        authorId: session.user.id,
        commentText: commentText.trim(),
      },
    });

    // Update last activity on quotation
    await prisma.quotation.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });

    // Get author info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: comment.id,
        quotationId: comment.quotationId,
        quotationLineId: comment.quotationLineId,
        authorType: comment.authorType,
        authorId: comment.authorId,
        authorName: user?.name ?? 'Unknown',
        authorEmail: user?.email ?? '',
        commentText: comment.commentText,
        createdAt: comment.createdAt.toISOString(),
      },
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('[Quotation/Comments/POST] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

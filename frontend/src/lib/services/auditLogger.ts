// ===========================================
// DealFlow360 - Audit Logger Service
// ===========================================
// Centralized audit logging service.
// Every mutating action across all modules should call this service.
// ===========================================

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { ActorType } from '@/lib/types';
import { headers } from 'next/headers';

// ===========================================
// TYPES
// ===========================================

export type AuditEntityType =
  | 'USER'
  | 'CUSTOMER'
  | 'PRODUCT'
  | 'PRODUCT_VARIANT'
  | 'PRICE_LIST'
  | 'DISCOUNT_TIER'
  | 'APPROVAL_CHAIN'
  | 'QUOTATION'
  | 'QUOTATION_LINE'
  | 'QUOTATION_COMMENT'
  | 'APPROVAL'
  | 'WAREHOUSE'
  | 'STOCK_LEVEL'
  | 'FULFILLMENT_SPLIT'
  | 'SUBSCRIPTION'
  | 'SUBSCRIPTION_PLAN'
  | 'BILLING_SCHEDULE'
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'PRODUCT_PAIRING';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'CONFIRM'
  | 'APPROVE'
  | 'REJECT'
  | 'RETURN'
  | 'CANCEL'
  | 'COUNTER_DISCOUNT'
  | 'FULFILL'
  | 'SHIP'
  | 'DELIVER'
  | 'INVOICE'
  | 'PAYMENT'
  | 'REFUND'
  | 'STOCK_ADJUST'
  | 'OVERRIDE'
  | string;

export interface AuditLogEntry {
  entityType: AuditEntityType;
  entityId: string;
  actorId: string;
  actorType: ActorType;
  action: AuditAction;
  reason?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

// ===========================================
// AUDIT LOGGER CLASS
// ===========================================

class AuditLogger {
  /**
   * Log an audit entry directly with all parameters
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId,
          actorId: entry.actorId,
          actorType: entry.actorType,
          action: entry.action,
          reason: entry.reason || null,
          beforeState: entry.beforeState as Prisma.InputJsonValue ?? Prisma.JsonNull,
          afterState: entry.afterState as Prisma.InputJsonValue ?? Prisma.JsonNull,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        },
      });
    } catch (error) {
      console.error('[AuditLogger] Failed to write audit log:', error);
      console.error('[AuditLogger] Entry:', JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Log with request context from Next.js headers
   */
  async logWithHeaders(
    actorId: string,
    actorType: ActorType,
    entry: Omit<AuditLogEntry, 'actorId' | 'actorType' | 'ipAddress' | 'userAgent'>
  ): Promise<void> {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0].trim() 
      || headersList.get('x-real-ip') 
      || 'unknown';
    const userAgent = headersList.get('user-agent') || undefined;

    await this.log({
      ...entry,
      actorId,
      actorType,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a CREATE action
   */
  async logCreate(
    actorId: string,
    actorType: ActorType,
    entityType: AuditEntityType,
    entityId: string,
    afterState: Record<string, unknown>
  ): Promise<void> {
    await this.logWithHeaders(actorId, actorType, {
      entityType,
      entityId,
      action: 'CREATE',
      afterState: this.sanitizeState(afterState),
    });
  }

  /**
   * Log an UPDATE action with before/after states
   */
  async logUpdate(
    actorId: string,
    actorType: ActorType,
    entityType: AuditEntityType,
    entityId: string,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>,
    reason?: string
  ): Promise<void> {
    await this.logWithHeaders(actorId, actorType, {
      entityType,
      entityId,
      action: 'UPDATE',
      beforeState: this.sanitizeState(beforeState),
      afterState: this.sanitizeState(afterState),
      reason,
    });
  }

  /**
   * Log a DELETE action
   */
  async logDelete(
    actorId: string,
    actorType: ActorType,
    entityType: AuditEntityType,
    entityId: string,
    beforeState: Record<string, unknown>,
    reason?: string
  ): Promise<void> {
    await this.logWithHeaders(actorId, actorType, {
      entityType,
      entityId,
      action: 'DELETE',
      beforeState: this.sanitizeState(beforeState),
      reason,
    });
  }

  /**
   * Log a quotation state transition
   */
  async logQuotationTransition(
    actorId: string,
    actorType: ActorType,
    quotationId: string,
    action: 'CONFIRM' | 'APPROVE' | 'REJECT' | 'RETURN' | 'CANCEL' | 'COUNTER_DISCOUNT',
    beforeStatus: string,
    afterStatus: string,
    reason?: string
  ): Promise<void> {
    await this.logWithHeaders(actorId, actorType, {
      entityType: 'QUOTATION',
      entityId: quotationId,
      action,
      beforeState: { status: beforeStatus },
      afterState: { status: afterStatus },
      reason,
    });
  }

  /**
   * Log authentication event (login/logout/register)
   */
  async logAuth(
    actorId: string,
    actorType: ActorType,
    action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE',
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logWithHeaders(actorId, actorType, {
      entityType: actorType === ActorType.INTERNAL ? 'USER' : 'CUSTOMER',
      entityId: actorId,
      action,
      afterState: details || null,
    });
  }

  /**
   * Log an approval action (approve/reject/return)
   */
  async logApprovalAction(
    actorId: string,
    approvalId: string,
    quotationId: string,
    level: string,
    action: 'APPROVE' | 'REJECT' | 'RETURN',
    reason?: string
  ): Promise<void> {
    await this.logWithHeaders(actorId, ActorType.INTERNAL, {
      entityType: 'APPROVAL',
      entityId: approvalId,
      action,
      beforeState: { level, quotationId },
      afterState: { status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RETURNED' },
      reason,
    });
  }

  /**
   * Sanitize state objects by removing sensitive fields
   */
  private sanitizeState(state: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'portalPasswordHash',
      'token',
      'secret',
      'apiKey',
    ];

    const sanitized = { ...state };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeState(value as Record<string, unknown>);
      }
    }

    return sanitized;
  }

  // ===========================================
  // QUERY METHODS
  // ===========================================

  /**
   * Get audit logs for a specific entity
   */
  async getLogsForEntity(
    entityType: AuditEntityType,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get recent audit logs with optional filtering
   */
  async getRecentLogs(options?: {
    entityType?: AuditEntityType;
    action?: AuditAction;
    actorType?: ActorType;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
  }) {
    return prisma.auditLog.findMany({
      where: {
        entityType: options?.entityType,
        action: options?.action,
        actorType: options?.actorType,
        createdAt: {
          gte: options?.fromDate,
          lte: options?.toDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }
}

// ===========================================
// SINGLETON EXPORT
// ===========================================

export const auditLogger = new AuditLogger();
export { AuditLogger };

// ===========================================
// DealFlow360 - Audit Logger Service
// ===========================================
// PHASE 0: Centralized audit logging service.
// This file is FROZEN after Phase 0 - do not modify individually.
// Every mutating action across all modules should call this service.
// ===========================================

import { prisma } from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import { ActorType } from '../types/index.js';
import { Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

// ===========================================
// TYPES
// ===========================================

/**
 * Entity types for audit logging
 * Add new entity types here as needed
 */
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
  | 'APPROVAL'
  | 'WAREHOUSE'
  | 'STOCK_LEVEL'
  | 'FULFILLMENT_SPLIT'
  | 'SUBSCRIPTION_PLAN'
  | 'BILLING_SCHEDULE'
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'PRODUCT_PAIRING';

/**
 * Common audit actions
 */
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
  | string; // Allow custom actions

/**
 * Audit log entry input
 */
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

/**
 * Audit log entry with request context
 */
export interface AuditLogWithRequest {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  reason?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
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
      // Log to console but don't throw - audit logging should not break the main flow
      console.error('[AuditLogger] Failed to write audit log:', error);
      console.error('[AuditLogger] Entry:', JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Log an audit entry using request context for actor information
   * Automatically extracts actorId, actorType, IP address, and user agent from request
   */
  async logFromRequest(req: Request, entry: AuditLogWithRequest): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.auth) {
      console.warn('[AuditLogger] Cannot log audit entry: Request not authenticated');
      return;
    }

    const fullEntry: AuditLogEntry = {
      ...entry,
      actorId: authReq.auth.id,
      actorType: authReq.auth.actorType as ActorType,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'] || undefined,
    };

    await this.log(fullEntry);
  }

  /**
   * Log a CREATE action
   */
  async logCreate(
    req: Request,
    entityType: AuditEntityType,
    entityId: string,
    afterState: Record<string, unknown>
  ): Promise<void> {
    await this.logFromRequest(req, {
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
    req: Request,
    entityType: AuditEntityType,
    entityId: string,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>,
    reason?: string
  ): Promise<void> {
    await this.logFromRequest(req, {
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
    req: Request,
    entityType: AuditEntityType,
    entityId: string,
    beforeState: Record<string, unknown>,
    reason?: string
  ): Promise<void> {
    await this.logFromRequest(req, {
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
    req: Request,
    quotationId: string,
    action: 'CONFIRM' | 'APPROVE' | 'REJECT' | 'RETURN' | 'CANCEL' | 'COUNTER_DISCOUNT',
    beforeStatus: string,
    afterStatus: string,
    reason?: string
  ): Promise<void> {
    await this.logFromRequest(req, {
      entityType: 'QUOTATION',
      entityId: quotationId,
      action,
      beforeState: { status: beforeStatus },
      afterState: { status: afterStatus },
      reason,
    });
  }

  /**
   * Log an approval action
   */
  async logApprovalAction(
    req: Request,
    approvalId: string,
    quotationId: string,
    action: 'APPROVE' | 'REJECT' | 'RETURN',
    level: 'MANAGER' | 'FINANCE',
    reason?: string
  ): Promise<void> {
    await this.logFromRequest(req, {
      entityType: 'APPROVAL',
      entityId: approvalId,
      action,
      afterState: { quotationId, level, action },
      reason,
    });
  }

  /**
   * Log a fulfillment action
   */
  async logFulfillment(
    req: Request,
    fulfillmentSplitId: string,
    action: 'FULFILL' | 'SHIP' | 'DELIVER' | 'OVERRIDE',
    details: Record<string, unknown>
  ): Promise<void> {
    await this.logFromRequest(req, {
      entityType: 'FULFILLMENT_SPLIT',
      entityId: fulfillmentSplitId,
      action,
      afterState: details,
    });
  }

  /**
   * Log a stock adjustment
   */
  async logStockAdjustment(
    req: Request,
    stockLevelId: string,
    warehouseId: string,
    productId: string,
    beforeQuantity: number,
    afterQuantity: number,
    reason?: string
  ): Promise<void> {
    await this.logFromRequest(req, {
      entityType: 'STOCK_LEVEL',
      entityId: stockLevelId,
      action: 'STOCK_ADJUST',
      beforeState: { warehouseId, productId, quantity: beforeQuantity },
      afterState: { warehouseId, productId, quantity: afterQuantity },
      reason,
    });
  }

  /**
   * Log a payment action
   */
  async logPayment(
    req: Request,
    invoiceId: string,
    action: 'INVOICE' | 'PAYMENT' | 'REFUND',
    amount: number,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logFromRequest(req, {
      entityType: 'INVOICE',
      entityId: invoiceId,
      action,
      afterState: { amount, ...details },
    });
  }

  /**
   * Log authentication event (login/logout/register)
   * Can be called without auth context for login/register
   */
  async logAuth(
    actorId: string,
    actorType: ActorType,
    action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE',
    req?: Request,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      entityType: actorType === ActorType.INTERNAL ? 'USER' : 'CUSTOMER',
      entityId: actorId,
      actorId,
      actorType,
      action,
      afterState: details || null,
      ipAddress: req ? this.getClientIp(req) : undefined,
      userAgent: req?.headers['user-agent'],
    });
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  /**
   * Extract client IP address from request
   * Handles proxied requests (X-Forwarded-For)
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
      return ips.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip;
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

    // Handle nested objects
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
   * Get audit logs by actor
   */
  async getLogsByActor(
    actorId: string,
    actorType: ActorType,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    return prisma.auditLog.findMany({
      where: {
        actorId,
        actorType,
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

/**
 * Singleton instance of the AuditLogger
 * Import this in your modules:
 * 
 * import { auditLogger } from '@/shared/services/auditLogger';
 * 
 * // In your route handler:
 * await auditLogger.logCreate(req, 'QUOTATION', quotation.id, quotation);
 */
export const auditLogger = new AuditLogger();

// Also export the class for testing purposes
export { AuditLogger };

// ===========================================
// DealFlow360 - Prisma Client Singleton
// ===========================================
// PHASE 0: Database client with proper singleton pattern.
// Prevents multiple Prisma client instances in development.
// ===========================================

import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// ===========================================
// PRISMA CLIENT CONFIGURATION
// ===========================================

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: env.isDevelopment ? 'pretty' : 'minimal',
  });
};

// ===========================================
// GLOBAL SINGLETON PATTERN
// ===========================================

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

/**
 * Prisma client singleton instance
 * In development, reuses the same client across hot reloads
 * In production, creates a fresh client
 * 
 * @example
 * import { prisma } from '@/shared/db/prisma';
 * 
 * const users = await prisma.user.findMany();
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.isDevelopment) {
  globalThis.prismaGlobal = prisma;
}

// ===========================================
// CONNECTION MANAGEMENT
// ===========================================

/**
 * Connect to the database
 * Called automatically on first query, but can be called explicitly
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[Database] Connected successfully');
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 * Should be called on application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[Database] Disconnected');
  } catch (error) {
    console.error('[Database] Disconnect error:', error);
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

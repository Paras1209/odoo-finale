// ===========================================
// DealFlow360 - Prisma Client Singleton
// ===========================================
// Database client with proper singleton pattern for Next.js
// Prevents multiple Prisma client instances in development.
// ===========================================

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

/**
 * Prisma client singleton instance
 * In development, reuses the same client across hot reloads
 * In production, creates a fresh client
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
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

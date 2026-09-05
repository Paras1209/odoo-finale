// ===========================================
// DealFlow360 - Environment Configuration
// ===========================================
// PHASE 0: Centralized environment variable access.
// ===========================================

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * Environment configuration with validation
 */
export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // JWT - Internal Users
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // JWT - Portal Customers (separate secret for security)
  PORTAL_JWT_SECRET: process.env.PORTAL_JWT_SECRET || 'portal-secret-change-in-production',
  PORTAL_JWT_EXPIRES_IN: process.env.PORTAL_JWT_EXPIRES_IN || '24h',
  
  // CORS
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  
  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (env.isProduction) {
      process.exit(1);
    }
  }
  
  // Warn about default secrets in production
  if (env.isProduction) {
    if (env.JWT_SECRET === 'dev-secret-change-in-production') {
      console.error('ERROR: Using default JWT_SECRET in production!');
      process.exit(1);
    }
    if (env.PORTAL_JWT_SECRET === 'portal-secret-change-in-production') {
      console.error('ERROR: Using default PORTAL_JWT_SECRET in production!');
      process.exit(1);
    }
  }
}

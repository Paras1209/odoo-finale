// ===========================================
// DealFlow360 - Backend Entry Point
// ===========================================
// PHASE 0: Express server with auto-registering routes.
// This file is FROZEN after Phase 0 - do not modify individually.
// ===========================================

import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './shared/config/env.js';
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './shared/db/prisma.js';
import { registerModuleRoutes } from './app.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';
import { requestLogger } from './shared/middleware/requestLogger.js';
import { initFulfillmentModule } from './modules/fulfillment/fulfillmentService.js';

// Validate environment variables
validateEnv();

// Create Express app
const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (env.isDevelopment) {
  app.use(requestLogger);
}

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
    environment: env.NODE_ENV,
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'DealFlow360 API',
    version: '1.0.0',
    description: 'Intelligent Sales Operations Platform',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      quotation: '/api/quotation',
      approval: '/api/approval',
      catalog: '/api/catalog',
      fulfillment: '/api/fulfillment',
      billing: '/api/billing',
      portal: '/api/portal',
      dashboard: '/api/dashboard',
      upsell: '/api/upsell',
    },
  });
});

// ===========================================
// AUTO-REGISTER MODULE ROUTES
// ===========================================

// Register all module routes automatically
// This prevents merge conflicts when adding new modules
registerModuleRoutes(app);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===========================================
// SERVER STARTUP
// ===========================================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    console.log('[Server] Connecting to database...');
    await connectDatabase();

    // Initialize modules that need event listeners
    console.log('[Server] Initializing modules...');
    initFulfillmentModule();
    // Add other module initializations here as needed

    // Start listening
    app.listen(env.PORT, () => {
      console.log(`
========================================
  DealFlow360 Backend Server
========================================
  Environment: ${env.NODE_ENV}
  Port:        ${env.PORT}
  API URL:     http://localhost:${env.PORT}/api
  Health:      http://localhost:${env.PORT}/health
========================================
      `);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
  
  try {
    await disconnectDatabase();
    console.log('[Server] Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

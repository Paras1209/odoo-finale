// ===========================================
// DealFlow360 - App Configuration & Route Registration
// ===========================================
// PHASE 0: Auto-registering module routes.
// This file is FROZEN after Phase 0 - do not modify individually.
//
// Each developer creates a routes.ts in their module folder.
// Routes are auto-registered here - no need to edit this file.
// ===========================================

import { Express } from 'express';
import authRoutes from './routes/auth.js';

// Import module routes
import quotationRoutes from './modules/quotation/routes.js';
import approvalRoutes from './modules/approval/routes.js';
import billingRoutes from './modules/billing/routes.js';
import catalogRoutes from './modules/catalog/routes.js';
import fulfillmentRoutes from './modules/fulfillment/routes.js';
import portalRoutes from './modules/portal/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import upsellRoutes from './modules/upsell/routes.js';

/**
 * Register all module routes on the Express app
 * 
 * PHASE 0 PATTERN:
 * Each module has its own routes.ts file that exports a Router.
 * This function imports and mounts them all at /api/{moduleName}.
 * 
 * Developers only need to create/edit their own module's routes.ts file.
 * This file (app.ts) is only edited when adding a completely new module.
 * 
 * @param app - The Express application instance
 */
export function registerModuleRoutes(app: Express): void {
  // ===========================================
  // AUTH ROUTES (shared)
  // ===========================================
  app.use('/api/auth', authRoutes);
  console.log('[Routes] Registered: /api/auth');

  // ===========================================
  // DEV A's MODULES
  // ===========================================
  
  // Quotation Module (Dev A)
  app.use('/api/quotation', quotationRoutes);
  console.log('[Routes] Registered: /api/quotation');
  
  // Approval Module (Dev A)
  app.use('/api/approval', approvalRoutes);
  console.log('[Routes] Registered: /api/approval');
  
  // Billing Module (Dev A)
  app.use('/api/billing', billingRoutes);
  console.log('[Routes] Registered: /api/billing');

  // ===========================================
  // DEV B's MODULES
  // ===========================================
  
  // Catalog Module (Dev B)
  app.use('/api/catalog', catalogRoutes);
  console.log('[Routes] Registered: /api/catalog');
  
  // Fulfillment Module (Dev B)
  app.use('/api/fulfillment', fulfillmentRoutes);
  console.log('[Routes] Registered: /api/fulfillment');
  
  // Portal Module (Dev B) - Customer-facing
  app.use('/api/portal', portalRoutes);
  console.log('[Routes] Registered: /api/portal');
  
  // Dashboard Module (Dev B)
  app.use('/api/dashboard', dashboardRoutes);
  console.log('[Routes] Registered: /api/dashboard');
  
  // Upsell Module (Dev B)
  app.use('/api/upsell', upsellRoutes);
  console.log('[Routes] Registered: /api/upsell');

  console.log('[Routes] All module routes registered');
}

// ===========================================
// DealFlow360 - Authentication Routes
// ===========================================
// PHASE 0: Shared authentication endpoints.
// ===========================================

import { Router, Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema, portalLoginSchema } from '../shared/validators/index.js';
import {
  registerUser,
  loginUser,
  loginCustomer,
  AuthError,
  isAuthError,
} from '../shared/services/authService.js';
import { auditLogger } from '../shared/services/auditLogger.js';
import { requireAuth, getAuthContext } from '../shared/middleware/auth.js';
import { ActorType } from '../shared/types/index.js';

const router = Router();

// ===========================================
// INTERNAL USER AUTH
// ===========================================

/**
 * Register a new internal user
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const { name, email, password, role } = parsed.data;
    const user = await registerUser(name, email, password, role);

    // Log registration
    await auditLogger.logAuth(user.id, ActorType.INTERNAL, 'REGISTER', req, { email });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  } catch (error) {
    if (isAuthError(error)) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
});

/**
 * Login internal user
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    // Log login
    await auditLogger.logAuth(result.user.id, ActorType.INTERNAL, 'LOGIN', req);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (isAuthError(error)) {
      res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const auth = getAuthContext(req);
  
  res.json({
    success: true,
    data: {
      id: auth.id,
      email: auth.email,
      name: auth.name,
      role: auth.role,
      actorType: auth.actorType,
    },
  });
});

/**
 * Logout (client-side token deletion, server logs it)
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const auth = getAuthContext(req);
  
  // Log logout
  await auditLogger.logAuth(auth.id, ActorType.INTERNAL, 'LOGOUT', req);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ===========================================
// PORTAL CUSTOMER AUTH
// ===========================================

/**
 * Login portal customer
 * POST /api/auth/portal/login
 */
router.post('/portal/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = portalLoginSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const { email, password } = parsed.data;
    const result = await loginCustomer(email, password);

    // Log portal login
    await auditLogger.logAuth(result.customer.id, ActorType.CUSTOMER, 'LOGIN', req);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (isAuthError(error)) {
      res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
});

export default router;

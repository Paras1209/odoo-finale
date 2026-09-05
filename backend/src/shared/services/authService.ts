// ===========================================
// DealFlow360 - Authentication Service
// ===========================================
// PHASE 0: User authentication and registration logic.
// ===========================================

import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { 
  generateInternalToken, 
  generatePortalToken,
  getTokenExpiration,
} from '../middleware/auth.js';
import { env } from '../config/env.js';
import { 
  UserRole, 
  CustomerTier,
  LoginResponseDTO,
  PortalLoginResponseDTO,
  UserDTO,
  CustomerDTO,
} from '../types/index.js';

// ===========================================
// PASSWORD UTILITIES
// ===========================================

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===========================================
// INTERNAL USER AUTHENTICATION
// ===========================================

/**
 * Register a new internal user
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = UserRole.SALES_REP
): Promise<UserDTO> {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new AuthError('EMAIL_EXISTS', 'A user with this email already exists');
  }
  
  const passwordHash = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });
  
  return mapUserToDTO(user);
}

/**
 * Login an internal user
 */
export async function loginUser(email: string, password: string): Promise<LoginResponseDTO> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  
  if (!user.isActive) {
    throw new AuthError('ACCOUNT_DISABLED', 'This account has been disabled');
  }
  
  const isValidPassword = await comparePassword(password, user.passwordHash);
  
  if (!isValidPassword) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  
  const token = generateInternalToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  });
  
  const expiresAt = getTokenExpiration(env.JWT_EXPIRES_IN);
  
  return {
    token,
    user: mapUserToDTO(user),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return null;
  }
  
  return mapUserToDTO(user);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    return null;
  }
  
  return mapUserToDTO(user);
}

// ===========================================
// PORTAL CUSTOMER AUTHENTICATION
// ===========================================

/**
 * Register a new portal customer
 */
export async function registerCustomer(
  name: string,
  email: string,
  password: string,
  tier: CustomerTier = CustomerTier.BRONZE,
  companyName?: string,
  phone?: string,
  address?: string
): Promise<CustomerDTO> {
  // Check if email already exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { email },
  });
  
  if (existingCustomer) {
    throw new AuthError('EMAIL_EXISTS', 'A customer with this email already exists');
  }
  
  const portalPasswordHash = await hashPassword(password);
  
  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      portalPasswordHash,
      tier,
      companyName,
      phone,
      address,
    },
  });
  
  return mapCustomerToDTO(customer);
}

/**
 * Login a portal customer
 */
export async function loginCustomer(email: string, password: string): Promise<PortalLoginResponseDTO> {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });
  
  if (!customer) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  
  if (!customer.isActive) {
    throw new AuthError('ACCOUNT_DISABLED', 'This account has been disabled');
  }
  
  if (!customer.portalPasswordHash) {
    throw new AuthError('NO_PORTAL_ACCESS', 'Portal access has not been set up for this customer');
  }
  
  const isValidPassword = await comparePassword(password, customer.portalPasswordHash);
  
  if (!isValidPassword) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  
  const token = generatePortalToken({
    sub: customer.id,
    email: customer.email,
    name: customer.name,
    tier: customer.tier,
  });
  
  const expiresAt = getTokenExpiration(env.PORTAL_JWT_EXPIRES_IN);
  
  return {
    token,
    customer: mapCustomerToDTO(customer),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<CustomerDTO | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  
  if (!customer) {
    return null;
  }
  
  return mapCustomerToDTO(customer);
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<CustomerDTO | null> {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });
  
  if (!customer) {
    return null;
  }
  
  return mapCustomerToDTO(customer);
}

/**
 * Set or update portal password for a customer
 * Used when admin creates a customer and sets their initial password
 */
export async function setCustomerPortalPassword(customerId: string, password: string): Promise<void> {
  const portalPasswordHash = await hashPassword(password);
  
  await prisma.customer.update({
    where: { id: customerId },
    data: { portalPasswordHash },
  });
}

// ===========================================
// DTO MAPPERS
// ===========================================

interface PrismaUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

interface PrismaCustomer {
  id: string;
  name: string;
  email: string;
  tier: string;
  companyName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
}

function mapUserToDTO(user: PrismaUser): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

function mapCustomerToDTO(customer: PrismaCustomer): CustomerDTO {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    tier: customer.tier as CustomerTier,
    companyName: customer.companyName,
    phone: customer.phone,
    isActive: customer.isActive,
    createdAt: customer.createdAt.toISOString(),
  };
}

// ===========================================
// ERROR HANDLING
// ===========================================

export class AuthError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

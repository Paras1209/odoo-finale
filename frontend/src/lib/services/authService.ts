// ===========================================
// DealFlow360 - Authentication Service
// ===========================================
// User authentication and registration logic.
// ===========================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { 
  UserRole, 
  CustomerTier,
  LoginResponseDTO,
  PortalLoginResponseDTO,
  UserDTO,
  CustomerDTO,
  ActorType,
} from '@/lib/types';

// ===========================================
// CONFIGURATION
// ===========================================

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'portal-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const PORTAL_JWT_EXPIRES_IN = process.env.PORTAL_JWT_EXPIRES_IN || '7d';

// ===========================================
// JWT TYPES
// ===========================================

export interface InternalJWTPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  actorType: ActorType.INTERNAL;
  iat?: number;
  exp?: number;
}

export interface PortalJWTPayload {
  sub: string;
  email: string;
  name: string;
  tier: string;
  actorType: ActorType.CUSTOMER;
  iat?: number;
  exp?: number;
}

// ===========================================
// PASSWORD UTILITIES
// ===========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===========================================
// JWT TOKEN FUNCTIONS
// ===========================================

export function generateInternalToken(payload: Omit<InternalJWTPayload, 'iat' | 'exp' | 'actorType'>): string {
  const tokenPayload: InternalJWTPayload = {
    ...payload,
    actorType: ActorType.INTERNAL,
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function generatePortalToken(payload: Omit<PortalJWTPayload, 'iat' | 'exp' | 'actorType'>): string {
  const tokenPayload: PortalJWTPayload = {
    ...payload,
    actorType: ActorType.CUSTOMER,
  };
  
  return jwt.sign(tokenPayload, PORTAL_JWT_SECRET, {
    expiresIn: PORTAL_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyInternalToken(token: string): InternalJWTPayload {
  return jwt.verify(token, JWT_SECRET) as InternalJWTPayload;
}

export function verifyPortalToken(token: string): PortalJWTPayload {
  return jwt.verify(token, PORTAL_JWT_SECRET) as PortalJWTPayload;
}

export function getTokenExpiration(expiresIn: string): Date {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return new Date(now.getTime() + value * 1000);
    case 'm': return new Date(now.getTime() + value * 60 * 1000);
    case 'h': return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

// ===========================================
// INTERNAL USER AUTHENTICATION
// ===========================================

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = UserRole.SALES_REP
): Promise<UserDTO> {
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
  
  const expiresAt = getTokenExpiration(JWT_EXPIRES_IN);
  
  return {
    token,
    user: mapUserToDTO(user),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getUserById(userId: string): Promise<UserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return null;
  }
  
  return mapUserToDTO(user);
}

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

export async function registerCustomer(
  name: string,
  email: string,
  password: string,
  tier: CustomerTier = CustomerTier.BRONZE,
  companyName?: string,
  phone?: string,
  address?: string
): Promise<CustomerDTO> {
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
  
  const expiresAt = getTokenExpiration(PORTAL_JWT_EXPIRES_IN);
  
  return {
    token,
    customer: mapCustomerToDTO(customer),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getCustomerById(customerId: string): Promise<CustomerDTO | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  
  if (!customer) {
    return null;
  }
  
  return mapCustomerToDTO(customer);
}

export async function getCustomerByEmail(email: string): Promise<CustomerDTO | null> {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });
  
  if (!customer) {
    return null;
  }
  
  return mapCustomerToDTO(customer);
}

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

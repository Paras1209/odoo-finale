// ===========================================
// DealFlow360 - User & Customer Seed Data
// ===========================================
// PHASE 0: Shared seed data for testing.
// Creates test users for all roles and a test customer.
// ===========================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  // Default password for all test users
  const defaultPassword = await hashPassword('password123');

  // ===========================================
  // INTERNAL USERS
  // ===========================================

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dealflow360.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@dealflow360.com',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`  Created admin user: ${admin.email}`);

  // Sales Rep users
  const rep1 = await prisma.user.upsert({
    where: { email: 'rep@dealflow360.com' },
    update: {},
    create: {
      name: 'John Sales',
      email: 'rep@dealflow360.com',
      passwordHash: defaultPassword,
      role: 'SALES_REP',
      isActive: true,
    },
  });
  console.log(`  Created sales rep: ${rep1.email}`);

  const rep2 = await prisma.user.upsert({
    where: { email: 'jane.rep@dealflow360.com' },
    update: {},
    create: {
      name: 'Jane Seller',
      email: 'jane.rep@dealflow360.com',
      passwordHash: defaultPassword,
      role: 'SALES_REP',
      isActive: true,
    },
  });
  console.log(`  Created sales rep: ${rep2.email}`);

  // Sales Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@dealflow360.com' },
    update: {},
    create: {
      name: 'Sarah Manager',
      email: 'manager@dealflow360.com',
      passwordHash: defaultPassword,
      role: 'SALES_MANAGER',
      isActive: true,
    },
  });
  console.log(`  Created sales manager: ${manager.email}`);

  // Finance Operations user
  const finance = await prisma.user.upsert({
    where: { email: 'finance@dealflow360.com' },
    update: {},
    create: {
      name: 'Mike Finance',
      email: 'finance@dealflow360.com',
      passwordHash: defaultPassword,
      role: 'FINANCE_OPS',
      isActive: true,
    },
  });
  console.log(`  Created finance user: ${finance.email}`);

  // ===========================================
  // PORTAL CUSTOMERS
  // ===========================================

  // Gold tier customer (highest discount allowance)
  const goldCustomer = await prisma.customer.upsert({
    where: { email: 'acme@example.com' },
    update: {},
    create: {
      name: 'Acme Corporation',
      email: 'acme@example.com',
      portalPasswordHash: defaultPassword,
      tier: 'GOLD',
      companyName: 'Acme Corp',
      phone: '+1-555-0100',
      address: '123 Business Ave, New York, NY 10001',
      isActive: true,
    },
  });
  console.log(`  Created Gold customer: ${goldCustomer.email}`);

  // Silver tier customer
  const silverCustomer = await prisma.customer.upsert({
    where: { email: 'beta@example.com' },
    update: {},
    create: {
      name: 'Beta Industries',
      email: 'beta@example.com',
      portalPasswordHash: defaultPassword,
      tier: 'SILVER',
      companyName: 'Beta Industries Ltd',
      phone: '+1-555-0200',
      address: '456 Commerce St, Chicago, IL 60601',
      isActive: true,
    },
  });
  console.log(`  Created Silver customer: ${silverCustomer.email}`);

  // Bronze tier customer (lowest discount allowance)
  const bronzeCustomer = await prisma.customer.upsert({
    where: { email: 'gamma@example.com' },
    update: {},
    create: {
      name: 'Gamma Startup',
      email: 'gamma@example.com',
      portalPasswordHash: defaultPassword,
      tier: 'BRONZE',
      companyName: 'Gamma Startup Inc',
      phone: '+1-555-0300',
      address: '789 Tech Lane, San Francisco, CA 94102',
      isActive: true,
    },
  });
  console.log(`  Created Bronze customer: ${bronzeCustomer.email}`);

  console.log(`
  Test Credentials (all use password: password123):
  ------------------------------------------------
  Admin:         admin@dealflow360.com
  Sales Rep:     rep@dealflow360.com, jane.rep@dealflow360.com
  Manager:       manager@dealflow360.com
  Finance:       finance@dealflow360.com
  Gold Customer: acme@example.com
  Silver Customer: beta@example.com
  Bronze Customer: gamma@example.com
  `);
}

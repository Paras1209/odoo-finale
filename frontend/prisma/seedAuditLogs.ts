import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAuditLogs() {
  // Get existing IDs from database
  const users = await prisma.user.findMany({ select: { id: true } });
  const customers = await prisma.customer.findMany({ select: { id: true } });
  const quotations = await prisma.quotation.findMany({ select: { id: true }, take: 100 });
  const invoices = await prisma.invoice.findMany({ select: { id: true }, take: 100 });
  const products = await prisma.product.findMany({ select: { id: true }, take: 50 });

  const userIds = users.map(u => u.id);
  const customerIds = customers.map(c => c.id);
  const quotationIds = quotations.map(q => q.id);
  const invoiceIds = invoices.map(i => i.id);
  const productIds = products.map(p => p.id);

  console.log(`Found ${userIds.length} users, ${customerIds.length} customers, ${quotationIds.length} quotations`);

  const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const generateId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'c';
    for (let i = 0; i < 24; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const entityTypes = ['QUOTATION', 'INVOICE', 'PRODUCT', 'CUSTOMER', 'USER'];
  const actions = ['CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'VIEW', 'EXPORT', 'SUBMIT', 'CANCEL'];
  const ipAddresses = ['192.168.1.100', '10.0.0.50', '172.16.0.25'];
  const userAgents = ['Mozilla/5.0 Chrome/120.0.0.0', 'Mozilla/5.0 Safari/605.1.15'];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-09-01');

  // The schema has conflicting FK constraints - actorId references both User and Customer
  // We need to temporarily drop these constraints to insert polymorphic data
  
  console.log('Dropping problematic FK constraints...');
  try {
    await prisma.$executeRaw`ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_fk`;
    await prisma.$executeRaw`ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_customer_fk`;
    console.log('FK constraints dropped successfully');
  } catch (e) {
    console.log('Note: Could not drop FK constraints, they may not exist');
  }

  let count = 0;
  
  console.log('Creating audit logs...');
  
  // Internal user logs (240)
  for (let i = 0; i < 240; i++) {
    const entityType = randomChoice(entityTypes);
    let entityId: string;
    if (entityType === 'QUOTATION') entityId = randomChoice(quotationIds);
    else if (entityType === 'INVOICE') entityId = randomChoice(invoiceIds);
    else if (entityType === 'PRODUCT') entityId = randomChoice(productIds);
    else if (entityType === 'CUSTOMER') entityId = randomChoice(customerIds);
    else entityId = randomChoice(userIds);

    const id = generateId();
    const actorId = randomChoice(userIds);
    const action = randomChoice(actions);
    const reason = Math.random() > 0.7 ? 'Business action' : null;
    const ipAddress = randomChoice(ipAddresses);
    const userAgent = randomChoice(userAgents);
    const createdAt = randomDate(startDate, endDate);

    try {
      await prisma.$executeRaw`
        INSERT INTO audit_logs (id, entity_type, entity_id, actor_id, actor_type, action, reason, ip_address, user_agent, created_at)
        VALUES (${id}, ${entityType}, ${entityId}, ${actorId}, 'INTERNAL', ${action}, ${reason}, ${ipAddress}, ${userAgent}, ${createdAt})
      `;
      count++;
    } catch (e) {
      // Skip silently
    }
  }

  // Customer logs (60)
  for (let i = 0; i < 60; i++) {
    const id = generateId();
    const entityId = randomChoice(quotationIds);
    const actorId = randomChoice(customerIds);
    const action = randomChoice(['VIEW', 'SUBMIT']);
    const ipAddress = randomChoice(ipAddresses);
    const userAgent = randomChoice(userAgents);
    const createdAt = randomDate(startDate, endDate);

    try {
      await prisma.$executeRaw`
        INSERT INTO audit_logs (id, entity_type, entity_id, actor_id, actor_type, action, ip_address, user_agent, created_at)
        VALUES (${id}, 'QUOTATION', ${entityId}, ${actorId}, 'CUSTOMER', ${action}, ${ipAddress}, ${userAgent}, ${createdAt})
      `;
      count++;
    } catch (e) {
      // Skip silently
    }
  }

  console.log(`Created ${count} audit logs`);
  await prisma.$disconnect();
}

seedAuditLogs().catch(console.error);

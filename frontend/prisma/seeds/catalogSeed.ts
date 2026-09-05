// ===========================================
// DealFlow360 - Catalog Seed Data
// ===========================================
// DEV B's FILE: Products, Warehouses, Price Lists
// Add your catalog seed data here.
// ===========================================

import { PrismaClient } from '@prisma/client';

export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  // ===========================================
  // WAREHOUSES
  // ===========================================
  
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Warehouse',
      code: 'MAIN',
      address: '100 Warehouse Blvd, Dallas, TX 75201',
      shippingCostWeight: 1.0,
      isActive: true,
    },
  });
  console.log(`  Created warehouse: ${mainWarehouse.name}`);

  const eastWarehouse = await prisma.warehouse.upsert({
    where: { code: 'EAST' },
    update: {},
    create: {
      name: 'East Coast Depot',
      code: 'EAST',
      address: '200 Distribution Way, Atlanta, GA 30301',
      shippingCostWeight: 1.2,
      isActive: true,
    },
  });
  console.log(`  Created warehouse: ${eastWarehouse.name}`);

  const westWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WEST' },
    update: {},
    create: {
      name: 'West Coast Depot',
      code: 'WEST',
      address: '300 Pacific Drive, Los Angeles, CA 90001',
      shippingCostWeight: 1.3,
      isActive: true,
    },
  });
  console.log(`  Created warehouse: ${westWarehouse.name}`);

  // ===========================================
  // PRODUCTS - HARDWARE
  // ===========================================

  const laptop = await prisma.product.upsert({
    where: { sku: 'HW-LAPTOP-PRO' },
    update: {},
    create: {
      name: 'ProBook Laptop 15"',
      sku: 'HW-LAPTOP-PRO',
      category: 'HARDWARE',
      costPrice: 800.00,
      salePrice: 1299.00,
      unit: 'unit',
      taxPct: 8.25,
      description: 'Professional laptop with 16GB RAM, 512GB SSD',
      isActive: true,
    },
  });
  console.log(`  Created product: ${laptop.name}`);

  const monitor = await prisma.product.upsert({
    where: { sku: 'HW-MON-27' },
    update: {},
    create: {
      name: '27" 4K Monitor',
      sku: 'HW-MON-27',
      category: 'HARDWARE',
      costPrice: 250.00,
      salePrice: 449.00,
      unit: 'unit',
      taxPct: 8.25,
      description: '27-inch 4K UHD monitor with USB-C',
      isActive: true,
    },
  });
  console.log(`  Created product: ${monitor.name}`);

  const keyboard = await prisma.product.upsert({
    where: { sku: 'HW-KB-MECH' },
    update: {},
    create: {
      name: 'Mechanical Keyboard',
      sku: 'HW-KB-MECH',
      category: 'HARDWARE',
      costPrice: 45.00,
      salePrice: 89.99,
      unit: 'unit',
      taxPct: 8.25,
      description: 'RGB mechanical keyboard with Cherry MX switches',
      isActive: true,
    },
  });
  console.log(`  Created product: ${keyboard.name}`);

  // ===========================================
  // PRODUCTS - SERVICES
  // ===========================================

  const setupService = await prisma.product.upsert({
    where: { sku: 'SVC-SETUP' },
    update: {},
    create: {
      name: 'Professional Setup Service',
      sku: 'SVC-SETUP',
      category: 'SERVICE',
      costPrice: 50.00,
      salePrice: 149.00,
      unit: 'hour',
      taxPct: 0,
      description: 'On-site hardware setup and configuration',
      isActive: true,
    },
  });
  console.log(`  Created product: ${setupService.name}`);

  const trainingService = await prisma.product.upsert({
    where: { sku: 'SVC-TRAINING' },
    update: {},
    create: {
      name: 'User Training Session',
      sku: 'SVC-TRAINING',
      category: 'SERVICE',
      costPrice: 75.00,
      salePrice: 199.00,
      unit: 'session',
      taxPct: 0,
      description: '2-hour training session for up to 10 users',
      isActive: true,
    },
  });
  console.log(`  Created product: ${trainingService.name}`);

  const supportService = await prisma.product.upsert({
    where: { sku: 'SVC-SUPPORT' },
    update: {},
    create: {
      name: 'Priority Support',
      sku: 'SVC-SUPPORT',
      category: 'SERVICE',
      costPrice: 30.00,
      salePrice: 99.00,
      unit: 'incident',
      taxPct: 0,
      description: 'Priority technical support incident',
      isActive: true,
    },
  });
  console.log(`  Created product: ${supportService.name}`);

  // ===========================================
  // PRODUCTS - SUBSCRIPTIONS
  // ===========================================

  const cloudBasic = await prisma.product.upsert({
    where: { sku: 'SUB-CLOUD-BASIC' },
    update: {},
    create: {
      name: 'Cloud Storage Basic',
      sku: 'SUB-CLOUD-BASIC',
      category: 'SUBSCRIPTION',
      costPrice: 5.00,
      salePrice: 9.99,
      unit: 'month',
      taxPct: 0,
      description: '100GB cloud storage with basic features',
      isActive: true,
    },
  });
  console.log(`  Created product: ${cloudBasic.name}`);

  const cloudPro = await prisma.product.upsert({
    where: { sku: 'SUB-CLOUD-PRO' },
    update: {},
    create: {
      name: 'Cloud Storage Pro',
      sku: 'SUB-CLOUD-PRO',
      category: 'SUBSCRIPTION',
      costPrice: 15.00,
      salePrice: 29.99,
      unit: 'month',
      taxPct: 0,
      description: '1TB cloud storage with advanced features',
      isActive: true,
    },
  });
  console.log(`  Created product: ${cloudPro.name}`);

  const securitySuite = await prisma.product.upsert({
    where: { sku: 'SUB-SECURITY' },
    update: {},
    create: {
      name: 'Enterprise Security Suite',
      sku: 'SUB-SECURITY',
      category: 'SUBSCRIPTION',
      costPrice: 25.00,
      salePrice: 49.99,
      unit: 'month',
      taxPct: 0,
      description: 'Complete security solution with antivirus, firewall, and monitoring',
      isActive: true,
    },
  });
  console.log(`  Created product: ${securitySuite.name}`);

  // ===========================================
  // STOCK LEVELS
  // ===========================================

  // Main warehouse stock
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: mainWarehouse.id, productId: laptop.id } },
    update: { quantityAvailable: 50 },
    create: { warehouseId: mainWarehouse.id, productId: laptop.id, quantityAvailable: 50, reorderPoint: 10 },
  });
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: mainWarehouse.id, productId: monitor.id } },
    update: { quantityAvailable: 100 },
    create: { warehouseId: mainWarehouse.id, productId: monitor.id, quantityAvailable: 100, reorderPoint: 20 },
  });
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: mainWarehouse.id, productId: keyboard.id } },
    update: { quantityAvailable: 200 },
    create: { warehouseId: mainWarehouse.id, productId: keyboard.id, quantityAvailable: 200, reorderPoint: 50 },
  });

  // East warehouse stock
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: eastWarehouse.id, productId: laptop.id } },
    update: { quantityAvailable: 30 },
    create: { warehouseId: eastWarehouse.id, productId: laptop.id, quantityAvailable: 30, reorderPoint: 5 },
  });
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: eastWarehouse.id, productId: monitor.id } },
    update: { quantityAvailable: 60 },
    create: { warehouseId: eastWarehouse.id, productId: monitor.id, quantityAvailable: 60, reorderPoint: 10 },
  });

  // West warehouse stock
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: westWarehouse.id, productId: laptop.id } },
    update: { quantityAvailable: 25 },
    create: { warehouseId: westWarehouse.id, productId: laptop.id, quantityAvailable: 25, reorderPoint: 5 },
  });
  await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: westWarehouse.id, productId: keyboard.id } },
    update: { quantityAvailable: 150 },
    create: { warehouseId: westWarehouse.id, productId: keyboard.id, quantityAvailable: 150, reorderPoint: 30 },
  });

  console.log(`  Created stock levels for all warehouses`);

  // ===========================================
  // SUBSCRIPTION PLANS
  // ===========================================

  await prisma.subscriptionPlan.upsert({
    where: { productId: cloudBasic.id },
    update: {},
    create: {
      productId: cloudBasic.id,
      name: 'Cloud Basic Monthly',
      frequency: 'MONTHLY',
      prorationRule: 'DAILY',
      trialDays: 14,
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { productId: cloudPro.id },
    update: {},
    create: {
      productId: cloudPro.id,
      name: 'Cloud Pro Monthly',
      frequency: 'MONTHLY',
      prorationRule: 'DAILY',
      trialDays: 14,
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { productId: securitySuite.id },
    update: {},
    create: {
      productId: securitySuite.id,
      name: 'Security Suite Annual',
      frequency: 'YEARLY',
      prorationRule: 'DAILY',
      trialDays: 30,
      isActive: true,
    },
  });

  console.log(`  Created subscription plans`);

  // ===========================================
  // PRODUCT PAIRINGS (Upsell/Cross-sell)
  // ===========================================

  await prisma.productPairing.upsert({
    where: { productId_suggestedProductId: { productId: laptop.id, suggestedProductId: monitor.id } },
    update: {},
    create: { productId: laptop.id, suggestedProductId: monitor.id, weight: 0.9, isPromoted: true },
  });

  await prisma.productPairing.upsert({
    where: { productId_suggestedProductId: { productId: laptop.id, suggestedProductId: keyboard.id } },
    update: {},
    create: { productId: laptop.id, suggestedProductId: keyboard.id, weight: 0.8, isPromoted: false },
  });

  await prisma.productPairing.upsert({
    where: { productId_suggestedProductId: { productId: laptop.id, suggestedProductId: setupService.id } },
    update: {},
    create: { productId: laptop.id, suggestedProductId: setupService.id, weight: 0.7, isPromoted: true },
  });

  await prisma.productPairing.upsert({
    where: { productId_suggestedProductId: { productId: cloudBasic.id, suggestedProductId: cloudPro.id } },
    update: {},
    create: { productId: cloudBasic.id, suggestedProductId: cloudPro.id, weight: 0.85, isPromoted: true },
  });

  await prisma.productPairing.upsert({
    where: { productId_suggestedProductId: { productId: cloudPro.id, suggestedProductId: securitySuite.id } },
    update: {},
    create: { productId: cloudPro.id, suggestedProductId: securitySuite.id, weight: 0.75, isPromoted: false },
  });

  console.log(`  Created product pairings for upsell suggestions`);

  // ===========================================
  // PRICE LISTS
  // ===========================================

  const defaultPriceList = await prisma.priceList.upsert({
    where: { id: 'default-pricelist' },
    update: {},
    create: {
      id: 'default-pricelist',
      name: 'Standard Price List',
      currency: 'USD',
      isDefault: true,
      isActive: true,
    },
  });
  console.log(`  Created price list: ${defaultPriceList.name}`);

  // Gold tier gets better pricing
  const goldPriceList = await prisma.priceList.upsert({
    where: { id: 'gold-pricelist' },
    update: {},
    create: {
      id: 'gold-pricelist',
      name: 'Gold Tier Pricing',
      customerTier: 'GOLD',
      currency: 'USD',
      isDefault: false,
      isActive: true,
    },
  });

  // Add gold pricing (5% lower than standard)
  await prisma.priceListItem.upsert({
    where: { priceListId_productId: { priceListId: goldPriceList.id, productId: laptop.id } },
    update: {},
    create: { priceListId: goldPriceList.id, productId: laptop.id, price: 1234.05 },
  });
  await prisma.priceListItem.upsert({
    where: { priceListId_productId: { priceListId: goldPriceList.id, productId: monitor.id } },
    update: {},
    create: { priceListId: goldPriceList.id, productId: monitor.id, price: 426.55 },
  });

  console.log(`  Created Gold tier price list`);
}

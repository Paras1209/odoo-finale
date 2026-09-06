// ===========================================
// DealFlow360 - Add Missing Product Pairings
// ===========================================
// This script adds cross-sell and upsell pairings for
// SERVICE and SUBSCRIPTION products that were missing
// in the original massive seed.
// 
// Run with: npx ts-node prisma/seeds/addMissingPairings.ts
// ===========================================

import { PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

function randomDecimal(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('===========================================');
  console.log('Adding Missing Product Pairings');
  console.log('===========================================\n');

  // Get existing pairings to avoid duplicates
  const existingPairings = await prisma.productPairing.findMany({
    select: { productId: true, suggestedProductId: true },
  });
  const existingKeys = new Set(
    existingPairings.map(p => `${p.productId}-${p.suggestedProductId}`)
  );
  console.log(`Existing pairings: ${existingKeys.size}`);

  // Get products by category
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, category: true },
  });

  const productsByCategory: Record<ProductCategory, string[]> = {
    HARDWARE: [],
    SERVICE: [],
    SUBSCRIPTION: [],
  };

  products.forEach(p => {
    productsByCategory[p.category].push(p.id);
  });

  console.log(`Hardware products: ${productsByCategory.HARDWARE.length}`);
  console.log(`Service products: ${productsByCategory.SERVICE.length}`);
  console.log(`Subscription products: ${productsByCategory.SUBSCRIPTION.length}`);

  const newPairings: {
    productId: string;
    suggestedProductId: string;
    weight: number;
    isPromoted: boolean;
  }[] = [];

  const addPairing = (fromId: string, toId: string, weight: number, isPromoted: boolean) => {
    const key = `${fromId}-${toId}`;
    if (fromId !== toId && !existingKeys.has(key)) {
      existingKeys.add(key); // Prevent duplicates within this run
      newPairings.push({
        productId: fromId,
        suggestedProductId: toId,
        weight,
        isPromoted,
      });
    }
  };

  // Cross-sell: hardware to subscriptions (warranty, cloud storage, security)
  console.log('\nAdding Hardware -> Subscription pairings...');
  for (const hwId of productsByCategory.HARDWARE.slice(0, 50)) {
    const subId = randomChoice(productsByCategory.SUBSCRIPTION);
    addPairing(hwId, subId, randomDecimal(0.5, 0.8), Math.random() > 0.5);
  }

  // Upsell: service to service (basic -> pro, individual -> group training)
  console.log('Adding Service -> Service pairings...');
  for (let i = 0; i < productsByCategory.SERVICE.length - 1; i++) {
    const suggestCount = randomInt(1, 3);
    for (let j = 0; j < suggestCount; j++) {
      const suggestedIdx = (i + j + 1) % productsByCategory.SERVICE.length;
      addPairing(
        productsByCategory.SERVICE[i],
        productsByCategory.SERVICE[suggestedIdx],
        randomDecimal(0.6, 0.95),
        Math.random() > 0.6
      );
    }
  }

  // Cross-sell: service to subscription (setup -> cloud storage, training -> collaboration suite)
  console.log('Adding Service -> Subscription pairings...');
  for (const svcId of productsByCategory.SERVICE.slice(0, 30)) {
    const subId = randomChoice(productsByCategory.SUBSCRIPTION);
    addPairing(svcId, subId, randomDecimal(0.5, 0.85), Math.random() > 0.5);
  }

  // Cross-sell: service to hardware (installation -> hardware accessories)
  console.log('Adding Service -> Hardware pairings...');
  for (const svcId of productsByCategory.SERVICE.slice(0, 25)) {
    const hwId = randomChoice(productsByCategory.HARDWARE);
    addPairing(svcId, hwId, randomDecimal(0.4, 0.7), false);
  }

  // Upsell: subscription to subscription (basic -> pro -> enterprise tiers)
  console.log('Adding Subscription -> Subscription pairings...');
  for (let i = 0; i < productsByCategory.SUBSCRIPTION.length - 1; i++) {
    const suggestCount = randomInt(1, 3);
    for (let j = 0; j < suggestCount; j++) {
      const suggestedIdx = (i + j + 1) % productsByCategory.SUBSCRIPTION.length;
      addPairing(
        productsByCategory.SUBSCRIPTION[i],
        productsByCategory.SUBSCRIPTION[suggestedIdx],
        randomDecimal(0.7, 1.0),
        true // Subscription upsells are always promoted
      );
    }
  }

  // Cross-sell: subscription to service (subscription -> support, training)
  console.log('Adding Subscription -> Service pairings...');
  for (const subId of productsByCategory.SUBSCRIPTION.slice(0, 40)) {
    const svcId = randomChoice(productsByCategory.SERVICE);
    addPairing(subId, svcId, randomDecimal(0.5, 0.8), Math.random() > 0.5);
  }

  // Cross-sell: subscription to hardware (cloud storage -> external drives for backup)
  console.log('Adding Subscription -> Hardware pairings...');
  for (const subId of productsByCategory.SUBSCRIPTION.slice(0, 25)) {
    const hwId = randomChoice(productsByCategory.HARDWARE);
    addPairing(subId, hwId, randomDecimal(0.3, 0.6), false);
  }

  // Insert new pairings
  if (newPairings.length > 0) {
    console.log(`\nInserting ${newPairings.length} new pairings...`);
    await prisma.productPairing.createMany({
      data: newPairings,
      skipDuplicates: true,
    });
    console.log('Done!');
  } else {
    console.log('\nNo new pairings to add.');
  }

  // Final count
  const totalPairings = await prisma.productPairing.count();
  console.log(`\nTotal pairings in database: ${totalPairings}`);

  // Verify coverage
  const productsWithPairings = await prisma.product.count({
    where: { pairingsFrom: { some: {} } },
  });
  console.log(`Products with at least one pairing: ${productsWithPairings} / ${products.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

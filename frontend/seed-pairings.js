const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPairings() {
  const products = await prisma.product.findMany();
  if (products.length < 2) return;

  console.log(`Found ${products.length} products. Adding some random pairings...`);
  
  // Clear old ones just in case
  await prisma.productPairing.deleteMany();

  let added = 0;
  for (let i = 0; i < products.length; i++) {
    const p1 = products[i];
    // Pick 2 random products to suggest
    for (let j = 0; j < 2; j++) {
      const p2 = products[Math.floor(Math.random() * products.length)];
      if (p1.id !== p2.id) {
        try {
          await prisma.productPairing.upsert({
            where: {
              productId_suggestedProductId: {
                productId: p1.id,
                suggestedProductId: p2.id
              }
            },
            update: {},
            create: {
              productId: p1.id,
              suggestedProductId: p2.id,
              weight: Math.random() * 5 + 1
            }
          });
          added++;
        } catch(e) {}
      }
    }
  }
  
  console.log(`Added ${added} product pairings!`);
}

seedPairings().catch(console.error).finally(() => prisma.$disconnect());

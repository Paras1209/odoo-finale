const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const qs = await prisma.quotation.findMany({
    select: { id: true, quotationNumber: true, status: true, lines: { select: { product: { select: { category: true } } } } }
  });
  console.log(JSON.stringify(qs, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());

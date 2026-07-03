const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ log: ['query'] });
  console.log("Initialized OK");
} catch (e) {
  console.error("Error:", e);
}

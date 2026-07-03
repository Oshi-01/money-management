const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  console.log("Initialized OK");
} catch (e) {
  console.error("Error:", e);
}

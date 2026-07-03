const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL });
  console.log("Initialized OK");
} catch (e) {
  console.error("Error:", e);
}

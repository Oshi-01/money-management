process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient();
  console.log("Initialized OK");
} catch (e) {
  console.error("Error:", e);
}

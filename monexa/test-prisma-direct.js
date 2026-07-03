const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({
    datasourceUrl: "postgres://postgres:postgres@localhost:51214/template1",
  });
  console.log("Initialized OK");
} catch (e) {
  console.error("Error:", e);
}

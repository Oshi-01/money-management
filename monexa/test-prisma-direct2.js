const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable",
      },
    },
  });
  console.log("Initialized OK");
} catch (e) {
  console.error("Error:", e);
}

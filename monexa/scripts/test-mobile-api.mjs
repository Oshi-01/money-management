// Creates and removes its own database on LOCAL PostgreSQL. Never uses DATABASE_URL.
import { randomBytes } from "node:crypto";
import { userInfo } from "node:os";
import { spawn } from "node:child_process";
import pg from "pg";

const adminUrl = new URL(process.env.MONEXA_TEST_PG_URL ?? `postgresql://${encodeURIComponent(userInfo().username)}@localhost:5432/postgres`);
if (!["localhost", "127.0.0.1", "[::1]"].includes(adminUrl.hostname)) throw new Error("Mobile integration tests require a local PostgreSQL server.");
const database = `monexa_mobile_test_${randomBytes(6).toString("hex")}`;
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
let created = false;
try {
  await admin.query(`CREATE DATABASE "${database}"`);
  created = true;
  const testUrl = new URL(adminUrl);
  testUrl.pathname = `/${database}`;
  const env = { ...process.env, DATABASE_URL: testUrl.toString(), MONEXA_MOBILE_TEST_DATABASE_URL: testUrl.toString() };
  for (const args of [["prisma", "migrate", "deploy"], ["vitest", "run", "tests/mobile-api.integration.test.ts"]]) {
    await new Promise((resolve, reject) => {
      const child = spawn("npx", args, { env, stdio: "inherit" });
      child.on("error", reject);
      child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Test command failed (${code})`)));
    });
  }
} finally {
  if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
}

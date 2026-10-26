import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const testUrl = process.env.MONEXA_MOBILE_TEST_DATABASE_URL;
const enabled = !!testUrl && /^monexa_mobile_test_[a-f0-9]+$/.test(new URL(testUrl).pathname.slice(1));
describe.skipIf(!enabled)("mobile API against isolated PostgreSQL", () => {
  let prisma: typeof import("@/lib/prisma").default;
  let handlers: typeof import("@/app/api/mobile/[...path]/route");
  let token: string;
  let otherToken: string;
  let userId: string;
  let otherId: string;
  let expenseCategory: string;
  let incomeCategory: string;
  let otherCategory: string;
  let accountId: string;
  let otherAccount: string;
  const email = "mobile-test@example.com";
  const password = "MobileTest2026!";

  async function call(path: string, method = "GET", body?: unknown, auth = token) {
    const req = new Request(`http://localhost/api/mobile/${path}`, {
      method, headers: { ...(auth ? { authorization: `Bearer ${auth}` } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const handler = handlers[method as "GET" | "POST" | "PUT" | "DELETE"];
    const response = await handler(req, { params: Promise.resolve({ path: path.split("?")[0].split("/") }) });
    return { status: response.status, headers: response.headers, body: await response.json() };
  }
  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    prisma = (await import("@/lib/prisma")).default;
    handlers = await import("@/app/api/mobile/[...path]/route");
    const { hashPassword } = await import("@/lib/user-auth");
    const hash = await hashPassword(password);
    userId = (await prisma.user.create({ data: { email, password: hash, currency: "BDT" } })).id;
    otherId = (await prisma.user.create({ data: { email: "other-mobile@example.com", password: hash } })).id;
    expenseCategory = (await prisma.category.create({ data: { userId, name: "Food", type: "EXPENSE" } })).id;
    incomeCategory = (await prisma.category.create({ data: { userId, name: "Salary", type: "INCOME" } })).id;
    otherCategory = (await prisma.category.create({ data: { userId: otherId, name: "Private", type: "EXPENSE" } })).id;
    accountId = (await prisma.account.create({ data: { userId, name: "Cash", type: "Primary", balance: 1000 } })).id;
    otherAccount = (await prisma.account.create({ data: { userId: otherId, name: "Private account", type: "Primary", balance: 50 } })).id;
    token = (await call("login", "POST", { email, password }, "")).body.token;
    otherToken = (await call("login", "POST", { email: "other-mobile@example.com", password }, "")).body.token;
  }, 30000);
  afterAll(async () => { await prisma?.$disconnect(); });

  it("requires bearer authentication, rejects bad credentials, and stores only token hashes", async () => {
    expect((await call("bootstrap", "GET", undefined, "")).status).toBe(401);
    expect((await call("login", "POST", { email, password: "wrong" }, "")).status).toBe(401);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const stored = await prisma.mobileSession.findUniqueOrThrow({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
    expect(stored.tokenHash).not.toBe(token);
    const result = await call("bootstrap");
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.body.user).toEqual({ id: userId, name: null, email, currency: "BDT" });
  });

  it("authenticates AI interpretation and prepares a draft without mutating money records", async () => {
    const request = { text: "গতকাল বাজারে পাঁচশ টাকা খরচ করেছি", today: "2026-10-27" };
    const fetcher = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify({ action: "create", entity: "transaction", title: "বাজার", amount: 500, type: "EXPENSE", date: "2026-10-26", category: null, question: null }) } }] }));
    vi.stubGlobal("fetch", fetcher); vi.stubEnv("VOICE_AI_PROVIDER", "groq"); vi.stubEnv("GROQ_API_KEY", "test-only");
    try {
      expect((await call("voice/interpret", "POST", request, "")).status).toBe(401);
      expect(fetcher).not.toHaveBeenCalled();
      const before = await prisma.transaction.count({ where: { userId } });
      const result = await call("voice/interpret", "POST", request);
      expect(result.status).toBe(200);
      expect(result.headers.get("cache-control")).toBe("no-store");
      expect(result.body).toMatchObject({ source: "groq", command: { title: "বাজার", amount: 500, type: "EXPENSE" } });
      expect(await prisma.transaction.count({ where: { userId } })).toBe(before);
      expect((await call("voice/interpret", "POST", { ...request, today: "2026-02-30" })).status).toBe(400);
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
  });

  it("creates, lists, renames, and removes categories with ownership and duplicate checks", async () => {
    expect((await call("categories", "GET", undefined, "")).status).toBe(401);
    expect((await call("categories", "POST", { name: " ", type: "EXPENSE" })).status).toBe(400);
    expect((await call("categories", "POST", { name: "x".repeat(41), type: "EXPENSE" })).status).toBe(400);
    expect((await call("categories", "POST", { name: "Hidden owner", type: "EXPENSE", userId: otherId })).status).toBe(400);
    const input = { name: "  Mobile custom  ", type: "EXPENSE" };
    const result = await call("categories", "POST", input);
    expect(result.status).toBe(201);
    const id = result.body.category.id;
    expect(result.body.category.name).toBe("Mobile custom");
    expect((await call("categories", "POST", { ...input, name: "Mobile custom" })).status).toBe(409);
    expect((await call("categories")).body.categories.some((category: { id: string }) => category.id === id)).toBe(true);
    expect((await call("bootstrap")).body.categories.some((category: { id: string }) => category.id === id)).toBe(true);
    expect((await call(`categories/${id}`, "GET", undefined, otherToken)).status).toBe(404);
    expect((await call(`categories/${id}`, "PUT", input, otherToken)).status).toBe(404);
    expect((await call(`categories/${id}`, "DELETE", undefined, otherToken)).status).toBe(404);
    expect((await call(`categories/${id}`, "PUT", { name: "Mobile renamed", type: "INCOME" })).status).toBe(200);
    expect((await call(`categories/${id}`)).body).toMatchObject({ name: "Mobile renamed", type: "INCOME", isSystem: false, transactions: 0, budgets: 0 });
    expect((await call(`categories/${id}`, "DELETE")).status).toBe(200);
    expect(await prisma.category.findUnique({ where: { id } })).toBeNull();
  });

  it("keeps system categories read-only", async () => {
    const category = await prisma.category.create({ data: { name: "System shared test", type: "EXPENSE", userId: null } });
    expect((await call(`categories/${category.id}`)).body.isSystem).toBe(true);
    expect((await call(`categories/${category.id}`, "PUT", { name: "Override", type: "EXPENSE" })).status).toBe(403);
    expect((await call(`categories/${category.id}`, "DELETE")).status).toBe(403);
    await prisma.category.delete({ where: { id: category.id } });
  });

  it("moves used category data without losing transactions or changing wallet balances", async () => {
    const source = (await call("categories", "POST", { name: "Move source", type: "EXPENSE" })).body.category;
    const target = (await call("categories", "POST", { name: "Move target", type: "EXPENSE" })).body.category;
    await prisma.budget.createMany({ data: [{ userId, categoryId: source.id, month: "2026-10", amount: 200, showOnDashboard: true }, { userId, categoryId: target.id, month: "2026-10", amount: 300, showOnDashboard: false }] });
    expect((await call("transactions", "POST", { description: "Category move purchase", amount: 50, type: "EXPENSE", categoryId: source.id, accountId, date: "2026-10-27" })).status).toBe(201);
    const transaction = await prisma.transaction.findFirstOrThrow({ where: { userId, description: "Category move purchase" } });
    const before = (await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance;
    expect((await call(`categories/${source.id}`)).body).toMatchObject({ transactions: 1, budgets: 1 });
    expect((await call(`categories/${source.id}`, "PUT", { name: "Wrong type", type: "INCOME" })).status).toBe(409);
    expect((await call(`categories/${source.id}`, "DELETE")).status).toBe(409);
    expect((await call(`categories/${source.id}?moveToId=${incomeCategory}`, "DELETE")).status).toBe(400);
    expect((await call(`categories/${source.id}?moveToId=${otherCategory}`, "DELETE")).status).toBe(400);
    expect((await call(`categories/${source.id}?moveToId=${target.id}`, "DELETE")).status).toBe(200);
    expect((await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })).categoryId).toBe(target.id);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(before);
    expect(await prisma.budget.findUniqueOrThrow({ where: { userId_categoryId_month: { userId, categoryId: target.id, month: "2026-10" } } })).toMatchObject({ amount: 500, showOnDashboard: true });
    await call(`transactions/${transaction.id}`, "DELETE");
    await prisma.budget.deleteMany({ where: { userId, categoryId: target.id } });
    await call(`categories/${target.id}`, "DELETE");
  });

  it("seeds defaults for a newly signed-in mobile user", async () => {
    const { hashPassword } = await import("@/lib/user-auth");
    const fresh = await prisma.user.create({ data: { email: "fresh-categories@example.com", password: await hashPassword(password) } });
    const freshToken = (await call("login", "POST", { email: fresh.email, password }, "")).body.token;
    const first = await call("bootstrap", "GET", undefined, freshToken);
    expect(first.body.categories).toHaveLength(12);
    await call("bootstrap", "GET", undefined, freshToken);
    expect(await prisma.category.count({ where: { userId: fresh.id } })).toBe(12);
    await prisma.user.delete({ where: { id: fresh.id } });
  });

  it("tracks all requested wallet types and isolates accounts between users", async () => {
    expect((await call("accounts", "GET", undefined, "")).status).toBe(401);
    expect((await call("accounts", "POST", { name: "Unsafe", type: "VISA_DEBIT", last4: "4111111111111111", amount: 100 })).status).toBe(400);
    for (const type of ["BKASH", "NAGAD", "ROCKET", "VISA_DEBIT", "VISA_CREDIT"]) {
      const input = { name: `Test ${type}`, type, last4: "1234", amount: 2000 };
      const created = await call("accounts", "POST", input);
      expect(created.status).toBe(201);
      const wallet = created.body;
      expect(wallet.prefix).toBe("•••• 1234");
      expect(wallet.balance).toBe(type === "VISA_CREDIT" ? -2000 : 2000);
      expect((await call(`accounts/${wallet.id}`, "GET", undefined, otherToken)).status).toBe(404);
      const update = { ...input, amount: 1000, updatedAt: wallet.updatedAt, previousBalance: wallet.balance };
      expect((await call(`accounts/${wallet.id}`, "PUT", update, otherToken)).status).toBe(404);
      const changed = await call(`accounts/${wallet.id}`, "PUT", update);
      expect(changed.status).toBe(200);
      expect(changed.body.balance).toBe(type === "VISA_CREDIT" ? -1000 : 1000);
      expect((await call(`accounts/${wallet.id}`, "PUT", update)).status).toBe(409);
    }
    const result = await call("accounts");
    expect(result.body.wallets.some((wallet: { id: string }) => wallet.id === otherAccount)).toBe(false);
    expect(result.body.wallets.filter((wallet: { name: string }) => wallet.name.startsWith("Test "))).toHaveLength(5);
  });

  it("updates Visa debt with linked purchases and protects balance corrections from stale edits", async () => {
    const wallet = (await call("accounts", "POST", { name: "Visa debt test", type: "VISA_CREDIT", last4: "5678", amount: 1000 })).body;
    const input = { description: "Card purchase", amount: 100, type: "EXPENSE", categoryId: expenseCategory, accountId: wallet.id, date: "2026-10-27" };
    expect((await call("transactions", "POST", input)).status).toBe(201);
    expect((await call(`accounts/${wallet.id}`)).body.balance).toBe(-1100);
    expect((await call(`accounts/${wallet.id}`, "PUT", { name: wallet.name, type: wallet.type, last4: "5678", amount: 900, updatedAt: wallet.updatedAt, previousBalance: wallet.balance })).status).toBe(409);
    const transaction = await prisma.transaction.findFirstOrThrow({ where: { userId, description: "Card purchase" } });
    expect((await call(`transactions/${transaction.id}`, "PUT", { ...input, amount: 80 })).status).toBe(200);
    expect((await call(`accounts/${wallet.id}`)).body.balance).toBe(-1080);
    expect((await call(`transactions/${transaction.id}`, "DELETE")).status).toBe(200);
    expect((await call(`accounts/${wallet.id}`)).body.balance).toBe(-1000);
  });

  it("creates, edits, and deletes a transaction while maintaining the linked balance", async () => {
    const input = { description: "Lunch", amount: 100, type: "EXPENSE", categoryId: expenseCategory, accountId, date: "2026-10-26", notes: "Integration" };
    expect((await call("transactions", "POST", input)).status).toBe(201);
    const transaction = await prisma.transaction.findFirstOrThrow({ where: { userId, description: "Lunch" } });
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(900);
    expect((await call(`transactions/${transaction.id}`, "PUT", { ...input, amount: 150 })).status).toBe(200);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(850);
    expect((await call(`transactions/${transaction.id}`, "PUT", { ...input, amount: 200, type: "INCOME", categoryId: incomeCategory })).status).toBe(200);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
    expect((await call(`transactions/${transaction.id}`, "GET", undefined, otherToken)).status).toBe(404);
    expect((await call(`transactions/${transaction.id}`, "PUT", input, otherToken)).status).toBe(404);
    expect((await call(`transactions/${transaction.id}`, "DELETE", undefined, otherToken)).status).toBe(404);
    expect((await call("transactions?q=Lunch")).body.totalCount).toBe(1);
    expect((await call("transactions", "GET", undefined, otherToken)).body.totalCount).toBe(0);
    expect((await call(`transactions/${transaction.id}`, "DELETE")).status).toBe(200);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1000);
  });

  it("rejects foreign accounts/categories, mismatched types, and invalid input without changing balances", async () => {
    const input = { description: "Invalid", amount: 100, type: "EXPENSE", categoryId: expenseCategory, accountId, date: "2026-10-26" };
    expect((await call("transactions", "POST", { ...input, accountId: otherAccount })).status).toBe(404);
    expect((await call("transactions", "POST", { ...input, categoryId: otherCategory })).status).toBe(404);
    expect((await call("transactions", "POST", { ...input, categoryId: incomeCategory })).status).toBe(400);
    for (const override of [{ date: "2026-02-30" }, { amount: -1 }, { amount: "100" }]) expect((await call("transactions", "POST", { ...input, ...override })).status).toBe(400);
    expect((await call("transactions?page=0")).status).toBe(400);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: otherAccount } })).balance).toBe(50);
  });

  it("keeps loan principal, outstanding balance, repayments, history, and dashboard totals consistent", async () => {
    const input = { personName: "Rahim", principalAmount: 500, loanType: "BORROWED", startDate: "2026-10-26", dueDate: "", notes: "", includeInTotal: true };
    expect((await call("loans", "POST", input)).status).toBe(201);
    const loan = await prisma.loan.findFirstOrThrow({ where: { userId } });
    expect((await call(`loans/${loan.id}`, "GET", undefined, otherToken)).status).toBe(404);
    expect((await call(`loans/${loan.id}`, "PUT", input, otherToken)).status).toBe(404);
    expect((await call(`loans/${loan.id}`, "DELETE", undefined, otherToken)).status).toBe(404);
    expect((await call(`loans/${loan.id}/repayments`, "POST", { amount: 100, date: "2026-10-26" }, otherToken)).status).toBe(404);
    expect((await call(`loans/${loan.id}/repayments`, "POST", { amount: 100, date: "2026-10-26" })).status).toBe(201);
    expect((await call(`loans/${loan.id}/repayments`, "POST", { amount: 401, date: "2026-10-26" })).status).toBe(400);
    expect((await call(`loans/${loan.id}`, "PUT", { ...input, principalAmount: 50 })).status).toBe(400);
    expect((await call(`loans/${loan.id}`, "PUT", { ...input, principalAmount: 600 })).status).toBe(200);
    expect((await call(`loans/${loan.id}/additions`, "POST", { amount: 50, date: "2026-10-26" })).status).toBe(201);
    const current = await prisma.loan.findUniqueOrThrow({ where: { id: loan.id }, include: { activities: true, repayments: true } });
    expect(current.principalAmount).toBe(650);
    expect(current.balance).toBe(550);
    expect(current.repayments).toHaveLength(1);
    expect(current.activities.map(a => a.type).sort()).toEqual(["ADDITION", "ADJUSTMENT", "CREATED"]);
    expect((await call("bootstrap")).body.dashboard.balance).toBe(550);
    expect((await call(`loans/${loan.id}/repayments`, "POST", { amount: 550, date: "2026-10-26" })).status).toBe(201);
    expect((await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } })).status).toBe("PAID");
    expect((await call(`loans/${loan.id}`, "DELETE")).status).toBe(200);
    expect(await prisma.repayment.count({ where: { loanId: loan.id } })).toBe(0);
    expect(await prisma.loanActivity.count({ where: { loanId: loan.id } })).toBe(0);
  });

  it("expires and revokes sessions, including password-reset invalidation", async () => {
    const temporary = (await call("login", "POST", { email, password }, "")).body.token;
    expect((await call("logout", "POST", undefined, temporary)).status).toBe(200);
    expect((await call("bootstrap", "GET", undefined, temporary)).status).toBe(401);
    const expired = (await call("login", "POST", { email, password }, "")).body.token;
    await prisma.mobileSession.updateMany({ where: { tokenHash: createHash("sha256").update(expired).digest("hex") }, data: { expiresAt: new Date(0) } });
    expect((await call("bootstrap", "GET", undefined, expired)).status).toBe(401);
    await prisma.user.update({ where: { id: otherId }, data: { sessionVersion: { increment: 1 } } });
    expect((await call("bootstrap", "GET", undefined, otherToken)).status).toBe(401);
  });

  it("protects balances when web/mobile clients edit a transaction concurrently", async () => {
    const input = { description: "Concurrent edit", amount: 100, type: "EXPENSE", categoryId: expenseCategory, accountId, date: "2026-10-26" };
    await call("transactions", "POST", input);
    const item = await prisma.transaction.findFirstOrThrow({ where: { userId, description: input.description } });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let results;
    try { results = await Promise.all([call(`transactions/${item.id}`, "PUT", { ...input, amount: 150 }), call(`transactions/${item.id}`, "PUT", { ...input, amount: 200 })]); }
    finally { errors.mockRestore(); }
    expect(results.some(result => result.status === 200)).toBe(true);
    expect(results.every(result => [200, 500].includes(result.status))).toBe(true);
    const latest = await prisma.transaction.findUniqueOrThrow({ where: { id: item.id } });
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1000 - latest.amount);
    await call(`transactions/${item.id}`, "DELETE");
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1000);
  });

  it("does not accept simultaneous repayments that would overdraw a loan", async () => {
    await call("loans", "POST", { personName: "Concurrent repay", principalAmount: 100, loanType: "LENT", startDate: "2026-10-26", includeInTotal: true });
    const loan = await prisma.loan.findFirstOrThrow({ where: { userId, personName: "Concurrent repay" } });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let results;
    try { results = await Promise.all([call(`loans/${loan.id}/repayments`, "POST", { amount: 80, date: "2026-10-26" }), call(`loans/${loan.id}/repayments`, "POST", { amount: 80, date: "2026-10-26" })]); }
    finally { errors.mockRestore(); }
    expect(results.filter(result => result.status === 201)).toHaveLength(1);
    expect((await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } })).balance).toBe(20);
    expect(await prisma.repayment.count({ where: { loanId: loan.id } })).toBe(1);
  });
});

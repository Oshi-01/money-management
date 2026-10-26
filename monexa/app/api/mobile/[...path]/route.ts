import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { emailSchema, loginPasswordSchema } from "@/lib/auth-validation";
import { findUserByEmail, verifyPassword } from "@/lib/user-auth";
import { authenticateMobile, issueMobileSession, mobileUserSelect } from "@/lib/mobile-auth";
import { consumeRateLimit, clearRateLimit, LOGIN_EMAIL_LIMIT, LOGIN_IP_LIMIT, LOGIN_WINDOW, getClientIp } from "@/lib/rate-limit";
import { MobileApiError, mobileJson, readMobileJson, transactionInput, loanInput, loanPaymentInput, asFormData, actionResponse } from "@/lib/mobile-http";
import * as transactions from "@/lib/services/transactions";
import * as loans from "@/lib/services/loans";
import { interpretVoice } from "@/lib/voice-ai";
import * as wallets from "@/lib/services/wallets";

export const runtime = "nodejs";
const credentials = z.object({ email: emailSchema, password: loginPasswordSchema });
type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context): Promise<Response> {
  try {
    const { path } = await context.params;
    const method = request.method;
    const endpoint = path.join("/");
    if (endpoint === "login" && method === "POST") {
      const input = credentials.parse(await readMobileJson(request));
      const emailKey = `login:email:${input.email}`;
      const limits = await Promise.all([
        consumeRateLimit(emailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW),
        consumeRateLimit(`login:ip:${await getClientIp()}`, LOGIN_IP_LIMIT, LOGIN_WINDOW),
      ]);
      const blocked = limits.find(limit => !limit.allowed);
      if (blocked) return mobileJson({ error: "Too many login attempts. Try again later." }, 429, { "Retry-After": String(blocked.retryAfterSec) });
      const user = await findUserByEmail(input.email);
      if (!await verifyPassword(input.password, user?.password) || !user) throw new MobileApiError("Invalid email or password", 401);
      await clearRateLimit(emailKey);
      const session = await issueMobileSession(user.id, user.sessionVersion);
      const publicUser = { id: user.id, name: user.name, email: user.email, currency: user.currency };
      return mobileJson({ ...session, user: publicUser });
    }

    const session = await authenticateMobile(request);
    if (!session) throw new MobileApiError("Your session has expired. Please sign in again.", 401);
    const userId = session.user.id;
    if (endpoint === "accounts" && method === "GET") return mobileJson({ wallets: await wallets.getWallets(userId) });
    if (endpoint === "accounts" && method === "POST") {
      const wallet = await wallets.createWallet(userId, await readMobileJson(request));
      revalidatePath("/dashboard", "layout");
      return mobileJson(wallet, 201);
    }
    if (path[0] === "accounts" && path.length === 2 && method === "GET") return mobileJson(await wallets.getWallet(userId, path[1]));
    if (path[0] === "accounts" && path.length === 2 && method === "PUT") {
      const wallet = await wallets.updateWallet(userId, path[1], await readMobileJson(request));
      revalidatePath("/dashboard", "layout");
      return mobileJson(wallet);
    }
    if (endpoint === "voice/interpret" && method === "POST") {
      const limit = await consumeRateLimit(`voice:${userId}`, 15, 60000);
      if (!limit.allowed) return mobileJson({ error: "Too many AI requests. Try again in a minute." }, 429);
      const input = await readMobileJson(request);
      try { return mobileJson(await interpretVoice(input, true)); }
      catch (error) { return mobileJson({ error: error instanceof Error ? error.message : "Could not understand this command." }, 400); }
    }
    if (endpoint === "logout" && method === "POST") {
      await prisma.mobileSession.deleteMany({ where: { id: session.sessionId, userId } });
      return mobileJson({ message: "Signed out" });
    }
    if (endpoint === "bootstrap" && method === "GET") {
      const [user, categories, accounts, totals, activeLoans] = await Promise.all([
        prisma.user.findUniqueOrThrow({ where: { id: userId }, select: mobileUserSelect }),
        prisma.category.findMany({ where: { OR: [{ userId }, { userId: null }] }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
        prisma.account.findMany({ where: { userId }, select: { id: true, name: true, balance: true }, orderBy: { createdAt: "asc" } }),
        prisma.transaction.groupBy({ by: ["type"], where: { userId }, _sum: { amount: true } }),
        prisma.loan.groupBy({ by: ["loanType"], where: { userId, includeInTotal: true }, _sum: { balance: true } }),
      ]);
      const income = totals.find(t => t.type === "INCOME")?._sum.amount ?? 0;
      const expense = totals.find(t => t.type === "EXPENSE")?._sum.amount ?? 0;
      const borrowed = activeLoans.find(l => l.loanType === "BORROWED")?._sum.balance ?? 0;
      const lent = activeLoans.find(l => l.loanType === "LENT")?._sum.balance ?? 0;
      return mobileJson({ user, categories, accounts, dashboard: { income, expense, borrowed, lent, balance: income + borrowed - expense - lent } });
    }
    if (endpoint === "transactions" && method === "GET") {
      const url = new URL(request.url);
      const page = z.coerce.number().int().min(1).max(100000).parse(url.searchParams.get("page") ?? 1);
      const search = z.string().max(200).parse(url.searchParams.get("q") ?? "");
      return mobileJson(await transactions.getTransactions(userId, page, 25, { search }));
    }
    if (endpoint === "loans" && method === "GET") return mobileJson({ loans: await loans.getLoans(userId) });
    if (path.length === 2 && method === "GET" && path[0] === "transactions") {
      const transaction = await prisma.transaction.findFirst({ where: { id: path[1], userId }, include: { category: true } });
      if (!transaction) throw new MobileApiError("Transaction not found", 404);
      return mobileJson(transaction);
    }
    if (path.length === 2 && method === "GET" && path[0] === "loans") {
      const loan = await prisma.loan.findFirst({ where: { id: path[1], userId }, include: { repayments: { orderBy: { paymentDate: "desc" } }, activities: { orderBy: { activityDate: "desc" } } } });
      if (!loan) throw new MobileApiError("Loan not found", 404);
      return mobileJson(loan);
    }

    let result: { error?: string; success?: string };
    let created = false;
    if (path[0] === "transactions" && path.length <= 2) {
      if (path.length === 1 && method === "POST") {
        result = await transactions.createTransaction(userId, asFormData(transactionInput.parse(await readMobileJson(request))));
        created = true;
      } else if (path.length === 2 && method === "PUT") {
        result = await transactions.updateTransaction(userId, path[1], asFormData(transactionInput.parse(await readMobileJson(request))));
      } else if (path.length === 2 && method === "DELETE") result = await transactions.deleteTransaction(userId, path[1]);
      else throw new MobileApiError("Method not allowed", 405);
    } else if (path[0] === "loans" && path.length <= 3) {
      if (path.length === 1 && method === "POST") {
        result = await loans.createLoan(userId, asFormData(loanInput.parse(await readMobileJson(request))));
        created = true;
      } else if (path.length === 2 && method === "PUT") {
        result = await loans.updateLoan(userId, path[1], asFormData(loanInput.parse(await readMobileJson(request))));
      } else if (path.length === 2 && method === "DELETE") result = await loans.deleteLoan(userId, path[1]);
      else if (path.length === 3 && method === "POST" && ["repayments", "additions"].includes(path[2])) {
        const input = loanPaymentInput.parse(await readMobileJson(request));
        const data = asFormData({ loanId: path[1], amount: input.amount, notes: input.notes, [path[2] === "repayments" ? "paymentDate" : "activityDate"]: input.date });
        result = path[2] === "repayments" ? await loans.addRepayment(userId, data) : await loans.addLoanAmount(userId, data);
        created = true;
      } else throw new MobileApiError("Method not allowed", 405);
    } else throw new MobileApiError("Endpoint not found", 404);
    if (result.success) revalidatePath("/dashboard", "layout");
    return actionResponse(result, created ? 201 : 200);
  } catch (error) {
    if (error instanceof wallets.WalletError) return mobileJson({ error: error.message }, error.status);
    if (error instanceof MobileApiError) return mobileJson({ error: error.message }, error.status);
    if (error instanceof z.ZodError) return mobileJson({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
    console.error("Mobile API request failed", error);
    return mobileJson({ error: "Unable to complete the request. Please try again." }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;

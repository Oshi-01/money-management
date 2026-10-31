import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addMonths, getCalendarDate, monthOrCurrent, resolveTimeZone, TIME_ZONE_COOKIE } from "@/lib/dates";
import { getUserCalendar } from "@/lib/user-calendar";
import { carryOverBudgets } from "@/lib/budget-carry-over";

const request = vi.hoisted(() => ({ timeZone: undefined as string | undefined, header: null as string | null }));
const db = vi.hoisted(() => ({
  budgetMonthState: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  budget: { count: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), createMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => name === TIME_ZONE_COOKIE && request.timeZone ? { value: request.timeZone } : undefined }),
  headers: async () => new Headers(request.header ? { "x-vercel-ip-timezone": request.header } : {}),
}));
vi.mock("@/lib/prisma", () => ({ default: db }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-31T18:34:00Z"));
  request.timeZone = "Asia/Dhaka";
  request.header = null;
});

afterEach(() => vi.useRealTimers());

describe("user calendar", () => {
  it("selects November at Bangladesh midnight while UTC is still in October", async () => {
    expect(await getUserCalendar()).toEqual({ timeZone: "Asia/Dhaka", today: "2026-11-01", currentMonth: "2026-11", daysLeft: 30 });
    expect(getCalendarDate("UTC")).toEqual({ today: "2026-10-31", currentMonth: "2026-10", daysLeft: 1 });
  });

  it("rolls over at local midnight, not UTC midnight", () => {
    expect(getCalendarDate("Asia/Dhaka", new Date("2026-10-31T17:59:59Z")).currentMonth).toBe("2026-10");
    expect(getCalendarDate("Asia/Dhaka", new Date("2026-10-31T18:00:00Z")).currentMonth).toBe("2026-11");
  });

  it("preserves a previous month west of UTC, including the year boundary", () => {
    expect(getCalendarDate("America/Los_Angeles", new Date("2027-01-01T01:00:00Z"))).toEqual({ today: "2026-12-31", currentMonth: "2026-12", daysLeft: 1 });
    expect(getCalendarDate("Asia/Dhaka", new Date("2026-12-31T18:00:00Z")).currentMonth).toBe("2027-01");
  });

  it("counts calendar days across leap years and daylight saving changes", () => {
    expect(getCalendarDate("Asia/Dhaka", new Date("2028-02-28T18:00:00Z")).daysLeft).toBe(1);
    expect(getCalendarDate("America/New_York", new Date("2026-11-01T05:30:00Z"))).toEqual(getCalendarDate("America/New_York", new Date("2026-11-01T06:30:00Z")));
  });

  it("prefers the browser timezone to the visitor header", async () => {
    request.header = "America/Los_Angeles";
    expect((await getUserCalendar()).currentMonth).toBe("2026-11");
  });

  it.each([undefined, "invalid/timezone"])("uses the visitor header when the cookie is %s", async value => {
    request.timeZone = value;
    request.header = "Asia/Dhaka";
    expect((await getUserCalendar()).currentMonth).toBe("2026-11");
  });

  it("falls back to UTC for missing or invalid timezone information", async () => {
    request.timeZone = "invalid";
    request.header = "invalid";
    expect((await getUserCalendar()).timeZone).toBe("UTC");
    expect(resolveTimeZone(null, undefined, "")).toBe("UTC");
  });

  it("keeps explicit historical months and uses the user's month for invalid URLs", () => {
    expect(monthOrCurrent("2026-09", "2026-11")).toBe("2026-09");
    for (const value of [undefined, "2026-13", ["2026-10"]]) {
      expect(monthOrCurrent(value, "2026-11")).toBe("2026-11");
    }
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
  });
});

describe("budget carry-over in the user's month", () => {
  it("copies October limits into November before the UTC server reaches November", async () => {
    db.budgetMonthState.findUnique.mockResolvedValue(null);
    db.budget.count.mockResolvedValue(0);
    db.budget.findFirst.mockResolvedValue({ month: "2026-10" });
    db.budget.findMany.mockResolvedValue([{ categoryId: "housing", amount: 11300, showOnDashboard: true }]);

    await carryOverBudgets("user-1", "2026-11");

    expect(db.budget.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user-1", categoryId: "housing", amount: 11300, month: "2026-11", showOnDashboard: true }],
      skipDuplicates: true,
    });
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("still refuses to initialize a future month", async () => {
    await carryOverBudgets("user-1", "2026-12");
    expect(db.budgetMonthState.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not overwrite a month that was already initialized", async () => {
    db.budgetMonthState.findUnique.mockResolvedValue({ id: "state-1" });
    await carryOverBudgets("user-1", "2026-11");
    expect(db.budget.createMany).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

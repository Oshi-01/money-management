/**
 * Date helpers shared by server actions and client forms.
 *
 * Date-only values from <input type="date"> ("YYYY-MM-DD") are stored at
 * 12:00 UTC. That instant falls on the same calendar day in every timezone
 * from UTC-12 to UTC+12, so a transaction dated the 1st is never counted
 * in the previous month, whichever timezone the server or user is in.
 */

/** "YYYY-MM-DD" (or a full ISO string) -> Date at 12:00 UTC of that day. */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return new Date(value);
  const [, y, m, d] = match.map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Local calendar date as "YYYY-MM-DD" - for default values of date inputs. */
export function toDateInputValue(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local month as "YYYY-MM". */
export function toMonthStr(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** True for a real "YYYY-MM" month string (e.g. "2026-09", not "2026-13"). */
export function isValidMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Use a month from the URL if it is valid, otherwise the current month. */
export function monthOrCurrent(value: unknown): string {
  return isValidMonth(value) ? value : toMonthStr();
}

/** "YYYY-MM" -> local Date on the 1st of that month. */
export function monthToDate(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** Move a "YYYY-MM" month forwards (or backwards with a negative number). */
export function addMonths(month: string, delta: number): string {
  const d = monthToDate(month);
  return toMonthStr(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}

/** "2026-09" -> "September 2026". */
export function formatMonthLabel(month: string): string {
  return monthToDate(month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

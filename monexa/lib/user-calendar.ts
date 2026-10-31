import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getCalendarDate, resolveTimeZone, TIME_ZONE_COOKIE } from "@/lib/dates";

/** Browser timezone wins; Vercel's visitor timezone covers the first visit. */
export const getUserCalendar = cache(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const timeZone = resolveTimeZone(
    cookieStore.get(TIME_ZONE_COOKIE)?.value,
    requestHeaders.get("x-vercel-ip-timezone"),
  );
  return { timeZone, ...getCalendarDate(timeZone) };
});

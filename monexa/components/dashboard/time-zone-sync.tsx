"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIME_ZONE_COOKIE, toDateInputValue } from "@/lib/dates";

/** Share the browser's calendar with Server Components and Server Actions. */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    let lastDay = toDateInputValue();
    const sync = () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cookie = `${TIME_ZONE_COOKIE}=${timeZone}`;
      const hasCookie = () => document.cookie.split(";").some(value => value.trim() === cookie);
      const needsTimeZone = !hasCookie();
      if (needsTimeZone) {
        document.cookie = `${cookie}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      }
      const today = toDateInputValue();
      // Also update an open dashboard after local midnight. If cookies are
      // blocked, avoid repeatedly refreshing a timezone we cannot persist.
      if ((needsTimeZone && hasCookie()) || today !== lastDay) router.refresh();
      lastDay = today;
    };

    sync();
    const interval = window.setInterval(sync, 60_000);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", sync);
    };
  }, [router]);

  return null;
}

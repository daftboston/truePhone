"use client";

/**
 * @file thread-refresh-poller.tsx
 * @description ThreadRefreshPoller component for the messages feature.tsx.
 * @dependencies react, next/navigation
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 15_000;

/** Light refresh while a thread is open and the tab is visible (Realtime later). */
export function ThreadRefreshPoller() {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    };

    const id = window.setInterval(tick, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}

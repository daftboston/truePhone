"use client";

/**
 * @file thread-live-subscriber.tsx
 * @description Refreshes message RSC trees from Realtime, with a 15s poll fallback.
 * @dependencies react, next/navigation, @/lib/supabase/client
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const POLL_MS = 15_000;

type ThreadLiveSubscriberProps = {
  /** When set, listen to one listing thread. Omit for the inbox unread list. */
  listingId?: string;
};

/**
 * ThreadLiveSubscriber
 *
 * Subscribes to `messages` postgres_changes and calls `router.refresh()`.
 * The Server Component remains the source of truth — no client message store.
 * Realtime is the fast path. The 15s visible-tab poll starts only if subscribe
 * fails, times out, or does not reach SUBSCRIBED within POLL_MS.
 *
 * @param props.listingId - Optional listing filter for an open thread.
 * @returns null (side-effect only).
 * @calledBy MessageThreadPage, MessagesInboxPage
 */
export function ThreadLiveSubscriber({ listingId }: ThreadLiveSubscriberProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channelName = listingId
      ? `messages:listing:${listingId}`
      : "messages:inbox";

    const onChange = () => {
      router.refresh();
    };

    // Filter by listing when possible. RLS still restricts rows to participants.
    const channel = listingId
      ? supabase.channel(channelName).on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `listingId=eq.${listingId}`,
          },
          onChange,
        )
      : supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            onChange,
          );

    let pollId: number | undefined;
    let subscribed = false;

    /**
     * tick
     *
     * Polls while the tab is visible if Realtime misses an event.
     */
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    };

    /**
     * startPoll
     *
     * Starts the visible-tab fallback once. No-ops if already polling.
     */
    const startPoll = () => {
      if (pollId != null) return;
      pollId = window.setInterval(tick, POLL_MS);
    };

    /**
     * stopPoll
     *
     * Clears the fallback interval when Realtime is healthy.
     */
    const stopPoll = () => {
      if (pollId == null) return;
      window.clearInterval(pollId);
      pollId = undefined;
    };

    const fallbackTimer = window.setTimeout(() => {
      if (!subscribed) startPoll();
    }, POLL_MS);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        subscribed = true;
        window.clearTimeout(fallbackTimer);
        stopPoll();
        return;
      }
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        startPoll();
      }
    });

    /**
     * onVisibility
     *
     * Refreshes as soon as the tab is visible again.
     */
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(fallbackTimer);
      stopPoll();
      void supabase.removeChannel(channel);
    };
  }, [listingId, router]);

  return null;
}

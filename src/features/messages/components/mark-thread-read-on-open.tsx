"use client";

/**
 * @file mark-thread-read-on-open.tsx
 * @description MarkThreadReadOnOpen component for the messages feature.tsx.
 * @dependencies react, next/navigation, @/features/messages/actions/messages
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { markThreadReadAction } from "@/features/messages/actions/messages";

type MarkThreadReadOnOpenProps = {
  listingId: string;
  otherUserId: string;
};

/** Marks the thread read via Server Action so unread badges revalidate. */
export function MarkThreadReadOnOpen({
  listingId,
  otherUserId,
}: MarkThreadReadOnOpenProps) {
  const router = useRouter();
  const ranForKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${listingId}:${otherUserId}`;
    if (ranForKey.current === key) return;
    ranForKey.current = key;
    void markThreadReadAction(listingId, otherUserId).then((result) => {
      if (result?.ok) router.refresh();
    });
  }, [listingId, otherUserId, router]);

  return null;
}

/**
 * @file page.tsx
 * @description Message thread for a specific listing conversation.
 * @dependencies Messages thread components and loaders
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MarkThreadReadOnOpen } from "@/features/messages/components/mark-thread-read-on-open";
import { ThreadRefreshPoller } from "@/features/messages/components/thread-refresh-poller";
import { ThreadView } from "@/features/messages/components/thread-view";
import {
  canAccessReviewPortal,
  requireCurrentProfile,
} from "@/lib/auth/session";
import {
  areMessagingBlocked,
  canSendInListingThread,
  canViewListingThread,
  getListingForThread,
  getProfileCard,
  getThreadMessages,
  isUserBlockedBy,
  listingHrefForThreadViewer,
  resolveThreadCounterpart,
} from "@/lib/messages";

type PageProps = {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getListingForThread(listingId);
  return {
    title: listing ? `Chat · ${listing.title}` : "Chat",
  };
}

/**
 * MessageThreadPage
 *
 * Loads and renders the chat thread between buyer and seller for a listing.
 *
 * @returns Message thread UI.
 */
export default async function MessageThreadPage({
  params,
  searchParams,
}: PageProps) {
  const { listingId } = await params;
  const query = await searchParams;
  const conRaw = query.con;
  const otherFromQuery = typeof conRaw === "string" ? conRaw : null;

  const current = await requireCurrentProfile(`/mensajes/${listingId}`);
  const listing = await getListingForThread(listingId);
  if (!listing) notFound();

  const counterpart = resolveThreadCounterpart(
    listing,
    current.profile.id,
    otherFromQuery,
  );

  if (!counterpart.ok) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/mensajes">← Mensajes</Link>
        </Button>
        <div className="border-border space-y-2 rounded-xl border p-6 text-center">
          <h1 className="text-foreground text-lg font-semibold">
            No se pudo abrir el chat
          </h1>
          <p className="text-muted-foreground text-sm">{counterpart.error}</p>
          <Button asChild variant="outline">
            <Link href="/mensajes">Volver a mensajes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const viewAccess = await canViewListingThread(
    listing,
    current.profile.id,
    counterpart.otherUserId,
  );

  if (!viewAccess.ok) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/mensajes">← Mensajes</Link>
        </Button>
        <div className="border-border space-y-2 rounded-xl border p-6 text-center">
          <h1 className="text-foreground text-lg font-semibold">Sin acceso</h1>
          <p className="text-muted-foreground text-sm">{viewAccess.error}</p>
        </div>
      </div>
    );
  }

  const otherUser = await getProfileCard(counterpart.otherUserId);
  if (!otherUser) notFound();

  const messages = await getThreadMessages(
    listing.id,
    current.profile.id,
    counterpart.otherUserId,
  );

  const sendAccess = await canSendInListingThread(
    listing,
    current.profile.id,
    counterpart.otherUserId,
  );
  const [blocked, blockedByMe] = await Promise.all([
    areMessagingBlocked(current.profile.id, counterpart.otherUserId),
    isUserBlockedBy(current.profile.id, counterpart.otherUserId),
  ]);

  const messagingDisabled = blocked || !sendAccess.ok;
  const disabledReason = blocked
    ? "Hay un bloqueo entre ustedes. No se pueden enviar mensajes."
    : !sendAccess.ok
      ? sendAccess.error
      : undefined;

  const listingJump = listingHrefForThreadViewer({
    listing,
    viewerId: current.profile.id,
    viewerCanReview: canAccessReviewPortal(current.profile.role),
  });

  return (
    <div className="space-y-4">
      <MarkThreadReadOnOpen
        listingId={listing.id}
        otherUserId={counterpart.otherUserId}
      />
      <ThreadRefreshPoller />
      <Button asChild variant="outline" size="sm">
        <Link href="/mensajes">← Mensajes</Link>
      </Button>
      <ThreadView
        listingId={listing.id}
        listingTitle={listing.title}
        listingStatus={listing.status}
        listingHref={listingJump?.href}
        listingImageUrl={listing.images[0]?.imageUrl ?? null}
        listingPrice={listing.finalPrice ?? listing.price}
        currentUserId={current.profile.id}
        otherUser={otherUser}
        messages={messages}
        messagingDisabled={messagingDisabled}
        disabledReason={disabledReason}
        initiallyBlockedByMe={blockedByMe}
      />
    </div>
  );
}

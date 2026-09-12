/**
 * @file page.tsx
 * @description Message thread for a specific listing conversation.
 * @dependencies Messages thread components and loaders
 * @changelog 2026-09-11 — Messenger chrome; EmptyState on denied/unresolved access.
 * @changelog 2026-09-11 — Live thread refresh via Realtime with poll fallback.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { MarkThreadReadOnOpen } from "@/features/messages/components/mark-thread-read-on-open";
import { ThreadLiveSubscriber } from "@/features/messages/components/thread-live-subscriber";
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
  marketplaceSellerDisplayName,
  resolveThreadCounterpart,
} from "@/lib/messages";

type PageProps = {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * ThreadAccessEmpty
 *
 * Explains why a thread cannot open and offers a next action.
 *
 * @param props.title - Empty heading.
 * @param props.description - Server-provided reason.
 * @returns Centered empty state with inbox and explore CTAs.
 * @calledBy MessageThreadPage
 */
function ThreadAccessEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <EmptyState
        title={title}
        description={description}
        action={
          <Button asChild>
            <Link href="/mensajes">Volver a mensajes</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="ghost" size="sm">
            <Link href="/explorar">Explorar iPhones</Link>
          </Button>
        }
      />
    </div>
  );
}

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
      <ThreadAccessEmpty
        title="No se pudo abrir el chat"
        description={counterpart.error}
      />
    );
  }

  const viewAccess = await canViewListingThread(
    listing,
    current.profile.id,
    counterpart.otherUserId,
  );

  if (!viewAccess.ok) {
    return (
      <ThreadAccessEmpty title="Sin acceso" description={viewAccess.error} />
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
    <div className="flex min-h-[calc(100dvh-11.5rem)] flex-col gap-3 md:min-h-[calc(100dvh-7rem)]">
      <MarkThreadReadOnOpen
        listingId={listing.id}
        otherUserId={counterpart.otherUserId}
      />
      <ThreadLiveSubscriber listingId={listing.id} />
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="shrink-0 px-2">
          <Link href="/mensajes">← Mensajes</Link>
        </Button>
        <h1 className="text-foreground min-w-0 truncate text-lg font-semibold tracking-tight">
          {marketplaceSellerDisplayName(otherUser)}
        </h1>
      </div>
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

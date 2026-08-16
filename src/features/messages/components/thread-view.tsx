/**
 * @file thread-view.tsx
 * @description Thread view with listing jump card, messages, composer, and safety actions.
 * @dependencies MessageListingCard, MessageComposer, ThreadSafetyActions, @/lib/messages
 */

import { MessageComposer } from "@/features/messages/components/message-composer";
import { MessageListingCard } from "@/features/messages/components/message-listing-card";
import { ThreadSafetyActions } from "@/features/messages/components/thread-safety-actions";
import type { MessageProfileCard, ThreadMessage } from "@/lib/messages";
import { marketplaceSellerDisplayName } from "@/lib/messages";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "@prisma/client";

type ThreadViewProps = {
  listingId: string;
  listingTitle: string;
  listingStatus: ListingStatus;
  listingHref?: string | null;
  listingImageUrl?: string | null;
  listingPrice?: number | null;
  currentUserId: string;
  otherUser: MessageProfileCard;
  messages: ThreadMessage[];
  messagingDisabled?: boolean;
  disabledReason?: string;
  initiallyBlockedByMe?: boolean;
};

/**
 * formatTime
 *
 * Formats a display value for messages UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy messages UI and related modules
 */
function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * ThreadView
 *
 * Renders a listing-scoped chat: jump card, safety actions, history, composer.
 *
 * @param props.listingId - Listing this thread belongs to.
 * @param props.listingTitle - Listing title for the jump card.
 * @param props.listingStatus - Listing status badge.
 * @param props.listingHref - Role-aware Ver anuncio destination.
 * @param props.listingImageUrl - Gallery thumbnail, if any.
 * @param props.listingPrice - Equipment price in COP.
 * @param props.currentUserId - Viewer profile id for bubble alignment.
 * @param props.otherUser - Counterpart profile card.
 * @returns Thread view React element.
 * @calledBy MessageThreadPage
 */
export function ThreadView({
  listingId,
  listingTitle,
  listingStatus,
  listingHref,
  listingImageUrl,
  listingPrice,
  currentUserId,
  otherUser,
  messages,
  messagingDisabled = false,
  disabledReason,
  initiallyBlockedByMe = false,
}: ThreadViewProps) {
  const otherName = marketplaceSellerDisplayName(otherUser);

  return (
    <div className="flex min-h-[28rem] flex-col gap-4">
      <MessageListingCard
        title={listingTitle}
        status={listingStatus}
        imageUrl={listingImageUrl}
        price={listingPrice}
        counterpartName={otherName}
        href={listingHref}
      />

      <ThreadSafetyActions
        listingId={listingId}
        otherUserId={otherUser.id}
        initiallyBlockedByMe={initiallyBlockedByMe}
      />

      <div className="border-border bg-muted/30 flex flex-1 flex-col gap-3 rounded-xl border p-3">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            Escribe para iniciar la conversación.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <li
                  key={message.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] space-y-1 rounded-2xl px-3 py-2 text-sm",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card text-card-foreground border-border rounded-bl-md border",
                    )}
                  >
                    <p className="break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <time
                      className={cn(
                        "block text-[10px]",
                        mine
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                      dateTime={message.createdAt.toISOString()}
                    >
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {messagingDisabled ? (
        <p className="text-muted-foreground text-center text-sm">
          {disabledReason ?? "No puedes enviar mensajes en esta conversación."}
        </p>
      ) : (
        <MessageComposer listingId={listingId} receiverId={otherUser.id} />
      )}
    </div>
  );
}

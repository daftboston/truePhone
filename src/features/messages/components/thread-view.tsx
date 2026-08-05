/**
 * @file thread-view.tsx
 * @description ThreadView component for the messages feature.tsx.
 * @dependencies next/link, @/components/ui/avatar, @/features/messages/components/message-composer, @/features/messages/components/thread-safety-actions, @/lib/messages
 */

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageComposer } from "@/features/messages/components/message-composer";
import { ThreadSafetyActions } from "@/features/messages/components/thread-safety-actions";
import type { MessageProfileCard, ThreadMessage } from "@/lib/messages";
import { marketplaceSellerDisplayName } from "@/lib/messages";
import { cn } from "@/lib/utils";

type ThreadViewProps = {
  listingId: string;
  listingTitle: string;
  listingHref?: string | null;
  currentUserId: string;
  otherUser: MessageProfileCard;
  messages: ThreadMessage[];
  messagingDisabled?: boolean;
  disabledReason?: string;
  initiallyBlockedByMe?: boolean;
};

/**
 * initials
 *
 * Derives up to two uppercase initials from a display name.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy messages UI and related modules
 */
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

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
 * Renders the Thread View UI for messages.
 *
 * @param props - ThreadView props.
 * @returns ThreadView React element.
 * @calledBy messages pages and parent components
 */
export function ThreadView({
  listingId,
  listingTitle,
  listingHref,
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
      <div className="border-border flex items-center gap-3 rounded-xl border p-3">
        <Avatar className="size-10">
          {otherUser.avatarUrl ? (
            <AvatarImage src={otherUser.avatarUrl} alt={otherName} />
          ) : null}
          <AvatarFallback>{initials(otherName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {otherName}
          </p>
          {listingHref ? (
            <Link
              href={listingHref}
              className="text-muted-foreground hover:text-foreground truncate text-xs underline-offset-2 hover:underline"
            >
              {listingTitle}
            </Link>
          ) : (
            <p className="text-muted-foreground truncate text-xs">
              {listingTitle}
            </p>
          )}
        </div>
      </div>

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

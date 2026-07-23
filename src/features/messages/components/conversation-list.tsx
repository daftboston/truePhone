import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationSummary } from "@/lib/messages";
import { marketplaceSellerDisplayName, publicThreadPath } from "@/lib/messages";
import { cn } from "@/lib/utils";

type ConversationListProps = {
  conversations: ConversationSummary[];
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function ConversationList({
  conversations,
  className,
}: ConversationListProps) {
  return (
    <ul
      className={cn(
        "divide-border border-border divide-y rounded-xl border",
        className,
      )}
    >
      {conversations.map((conversation) => {
        const name = marketplaceSellerDisplayName(conversation.otherUser);
        const href = publicThreadPath(
          conversation.listingId,
          conversation.otherUser.id,
        );
        const preview =
          conversation.lastMessage.content.length > 80
            ? `${conversation.lastMessage.content.slice(0, 80)}…`
            : conversation.lastMessage.content;

        return (
          <li key={`${conversation.listingId}:${conversation.otherUser.id}`}>
            <Link
              href={href}
              className="hover:bg-muted/60 flex gap-3 px-3 py-3 transition-colors"
            >
              <Avatar className="size-11">
                {conversation.otherUser.avatarUrl ? (
                  <AvatarImage
                    src={conversation.otherUser.avatarUrl}
                    alt={name}
                  />
                ) : null}
                <AvatarFallback>{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {name}
                  </p>
                  <time
                    className="text-muted-foreground shrink-0 text-[11px]"
                    dateTime={conversation.lastMessage.createdAt.toISOString()}
                  >
                    {formatTime(conversation.lastMessage.createdAt)}
                  </time>
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {conversation.listingTitle}
                </p>
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      conversation.unreadCount > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {preview}
                  </p>
                  {conversation.unreadCount > 0 ? (
                    <span className="bg-primary text-primary-foreground ml-auto flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                      {conversation.unreadCount > 9
                        ? "9+"
                        : conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

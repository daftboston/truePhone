/**
 * @file conversation-list.tsx
 * @description Inbox list of listing-scoped conversations with a Ver anuncio jump.
 * @dependencies next/image, next/link, Avatar, listingHrefForThreadViewer
 */

import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationSummary } from "@/lib/messages";
import {
  listingHrefForThreadViewer,
  marketplaceSellerDisplayName,
  publicThreadPath,
} from "@/lib/messages";
import { cn } from "@/lib/utils";

type ConversationListProps = {
  conversations: ConversationSummary[];
  viewerId: string;
  viewerCanReview: boolean;
  className?: string;
};

/**
 * initials
 *
 * Derives up to two uppercase initials from a display name.
 *
 * @param name - Display name.
 * @returns Initials string.
 * @calledBy ConversationList
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
 * Formats inbox timestamps in Colombian Spanish.
 *
 * @param date - Message time.
 * @returns Short date and time.
 * @calledBy ConversationList
 */
function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * ConversationList
 *
 * Renders inbox rows. The main row opens the chat; the listing thumbnail and
 * Ver anuncio link jump to the publication without nesting <a> tags.
 *
 * @param props.conversations - Inbox summaries.
 * @param props.viewerId - Current profile UUID for listing hrefs.
 * @param props.viewerCanReview - Whether the viewer is reviewer/admin.
 * @param props.className - Optional list className.
 * @returns Conversation list.
 * @calledBy MessagesInboxPage
 */
export function ConversationList({
  conversations,
  viewerId,
  viewerCanReview,
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
        const threadHref = publicThreadPath(
          conversation.listingId,
          conversation.otherUser.id,
        );
        const listingJump = listingHrefForThreadViewer({
          listing: {
            id: conversation.listingId,
            slug: conversation.listingSlug,
            status: conversation.listingStatus,
            sellerId: conversation.listingSellerId,
          },
          viewerId,
          viewerCanReview,
        });
        const preview =
          conversation.lastMessage.content.length > 80
            ? `${conversation.lastMessage.content.slice(0, 80)}…`
            : conversation.lastMessage.content;

        return (
          <li
            key={`${conversation.listingId}:${conversation.otherUser.id}`}
            className="hover:bg-muted/60 flex items-stretch"
          >
            {conversation.listingImageUrl ? (
              listingJump ? (
                <Link
                  href={listingJump.href}
                  className="shrink-0 self-center py-3 pl-3"
                  aria-label={`${listingJump.label}: ${conversation.listingTitle}`}
                >
                  <span className="bg-muted relative block size-14 overflow-hidden rounded-lg">
                    <Image
                      src={conversation.listingImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </span>
                </Link>
              ) : (
                <div className="flex shrink-0 items-center py-3 pl-3">
                  <span className="bg-muted relative block size-14 overflow-hidden rounded-lg">
                    <Image
                      src={conversation.listingImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </span>
                </div>
              )
            ) : (
              <div className="flex shrink-0 items-center py-3 pl-3">
                <Avatar className="size-11">
                  {conversation.otherUser.avatarUrl ? (
                    <AvatarImage
                      src={conversation.otherUser.avatarUrl}
                      alt={name}
                    />
                  ) : null}
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
              </div>
            )}
            <Link
              href={threadHref}
              className="flex min-w-0 flex-1 gap-3 px-3 py-3"
            >
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
            {listingJump ? (
              <Link
                href={listingJump.href}
                className="text-trust hover:text-trust/80 flex shrink-0 items-center px-3 text-xs font-medium whitespace-nowrap"
              >
                {listingJump.label}
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

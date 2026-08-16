/**
 * @file page.tsx
 * @description Messaging inbox of listing conversation threads.
 * @dependencies Messages feature helpers
 */

import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/features/messages/components/conversation-list";
import {
  canAccessReviewPortal,
  requireCurrentProfile,
} from "@/lib/auth/session";
import { listConversationsForUser } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Mensajes",
  description: "Tus conversaciones en TruePhone.",
};

/**
 * MessagesInboxPage
 *
 * Lists conversation threads for the signed-in user.
 *
 * @returns Inbox list UI.
 */
export default async function MessagesInboxPage() {
  const current = await requireCurrentProfile("/mensajes");
  const conversations = await listConversationsForUser(current.profile.id);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Mensajes
        </h1>
        <p className="text-muted-foreground text-sm">
          Chats sobre anuncios con compradores, vendedores o revisores.
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title="Aún no tienes mensajes"
          description="Cuando contactes a un vendedor o te escriban sobre un anuncio, aparecerá aquí."
          action={
            <Button asChild>
              <Link href="/explorar">Explorar iPhones</Link>
            </Button>
          }
        />
      ) : (
        <ConversationList
          conversations={conversations}
          viewerId={current.profile.id}
          viewerCanReview={canAccessReviewPortal(current.profile.role)}
        />
      )}
    </>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessageAction } from "@/features/messages/actions/messages";
import type { MessageActionState } from "@/features/messages/schemas/message";
import { MESSAGE_CONTENT_MAX } from "@/features/messages/schemas/message";

type MessageComposerProps = {
  listingId: string;
  receiverId: string;
};

const initialState: MessageActionState = null;

export function MessageComposer({
  listingId,
  receiverId,
}: MessageComposerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    sendMessageAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="receiverId" value={receiverId} />
      <label className="sr-only" htmlFor="message-content">
        Mensaje
      </label>
      <Textarea
        id="message-content"
        name="content"
        placeholder="Escribe un mensaje…"
        maxLength={MESSAGE_CONTENT_MAX}
        required
        className="min-h-20"
        disabled={pending}
      />
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.fieldErrors?.content?.[0] ?? state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Enviar
        </Button>
      </div>
    </form>
  );
}

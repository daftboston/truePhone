"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  dismissReviewReportsAction,
  hideReviewAction,
} from "@/features/reviews/actions/reviews";
import type { ReviewActionState } from "@/features/reviews/schemas/review";

type ReviewModerationActionsProps = {
  reviewId: string;
};

const initial: ReviewActionState = null;

export function ReviewModerationActions({
  reviewId,
}: ReviewModerationActionsProps) {
  const router = useRouter();
  const [hideState, hideAction, hidePending] = useActionState(
    hideReviewAction,
    initial,
  );
  const [dismissState, dismissAction, dismissPending] = useActionState(
    dismissReviewReportsAction,
    initial,
  );

  useEffect(() => {
    if (hideState?.ok || dismissState?.ok) {
      router.refresh();
    }
  }, [hideState, dismissState, router]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={hideAction}>
          <input type="hidden" name="reviewId" value={reviewId} />
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            loading={hidePending}
          >
            Ocultar reseña
          </Button>
        </form>
        <form action={dismissAction}>
          <input type="hidden" name="reviewId" value={reviewId} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            loading={dismissPending}
          >
            Descartar reportes
          </Button>
        </form>
      </div>
      {hideState && !hideState.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {hideState.error}
        </p>
      ) : null}
      {dismissState && !dismissState.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {dismissState.error}
        </p>
      ) : null}
      {hideState?.ok || dismissState?.ok ? (
        <p className="text-muted-foreground text-sm" role="status">
          {hideState?.ok
            ? hideState.message
            : dismissState?.ok
              ? dismissState.message
              : null}
        </p>
      ) : null}
    </div>
  );
}

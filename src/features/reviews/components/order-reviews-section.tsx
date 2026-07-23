import { ReviewCard } from "@/components/review-card";
import { ReportReviewButton } from "@/features/reviews/components/report-review-button";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { reviewAuthorName } from "@/lib/reviews";

type OrderReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewerId: string;
  reviewer: {
    id: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};

type OrderReviewsSectionProps = {
  orderId: string;
  orderStatus: string;
  completedAt: Date | null;
  perspective: "buyer" | "seller";
  currentUserId: string;
  reviews: OrderReview[];
};

export function OrderReviewsSection({
  orderId,
  orderStatus,
  completedAt,
  perspective,
  currentUserId,
  reviews,
}: OrderReviewsSectionProps) {
  if (orderStatus !== "COMPLETED") {
    return null;
  }

  const counterpartLabel =
    perspective === "buyer" ? "el vendedor" : "el comprador";
  const alreadyReviewed = reviews.some(
    (review) => review.reviewerId === currentUserId,
  );
  const canReport = (review: OrderReview) =>
    review.reviewerId !== currentUserId;

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div className="space-y-1">
        <h2 className="text-foreground text-sm font-semibold">Reseñas</h2>
        <p className="text-muted-foreground text-sm">
          Después de una venta completada, ambas partes pueden calificarse.
        </p>
      </div>

      {reviews.length > 0 ? (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard
                reviewerName={reviewAuthorName(review.reviewer)}
                reviewerAvatarUrl={review.reviewer.avatarUrl}
                rating={review.rating}
                comment={review.comment}
                transactionDate={completedAt ?? review.createdAt}
                footer={
                  canReport(review) ? (
                    <ReportReviewButton reviewId={review.id} />
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Aún no hay reseñas en este pedido.
        </p>
      )}

      {alreadyReviewed ? (
        <p className="text-muted-foreground text-sm" role="status">
          Ya publicaste tu reseña para este pedido.
        </p>
      ) : (
        <div className="border-border space-y-3 border-t pt-4">
          <h3 className="text-foreground text-sm font-medium">
            Deja tu reseña
          </h3>
          <ReviewForm orderId={orderId} counterpartLabel={counterpartLabel} />
        </div>
      )}
    </section>
  );
}

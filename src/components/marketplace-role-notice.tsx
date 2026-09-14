/**
 * @file marketplace-role-notice.tsx
 * @description Lawyer-approved copy clarifying TruePhone vs seller roles near buy/pay CTAs.
 * @dependencies @/lib/utils
 */

import { cn } from "@/lib/utils";

type MarketplaceRoleNoticeProps = {
  className?: string;
};

/** Exact Priority A Spanish UX line for marketplace role disclosure. */
export const MARKETPLACE_ROLE_NOTICE_COPY =
  "TruePhone es el marketplace. El vendedor es quien vende el iPhone. TruePhone retiene el pago hasta que el pedido se complete.";

/**
 * MarketplaceRoleNotice
 *
 * Shows the standard marketplace-role disclosure near purchase actions.
 *
 * @param props.className - Optional wrapper className.
 * @returns Paragraph with role disclosure copy.
 * @calledBy Public listing page, OrderDetailView checkout section
 */
export function MarketplaceRoleNotice({
  className,
}: MarketplaceRoleNoticeProps) {
  return (
    <p
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
    >
      {MARKETPLACE_ROLE_NOTICE_COPY}
    </p>
  );
}

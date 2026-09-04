/**
 * @file index.ts
 * @description Public barrel for TruePhone notifications (Phase 12).
 * @dependencies notifications modules
 */

export { createNotification } from "@/lib/notifications/create";
export type {
  CreateNotificationInput,
  CreateNotificationResult,
} from "@/lib/notifications/create";
export { sendNotificationEmail } from "@/lib/notifications/email";
export {
  getNotificationPreferences,
  upsertNotificationPreferences,
  wantsEmailOrderUpdates,
  wantsInAppOrderUpdates,
} from "@/lib/notifications/preferences";
export type { NotificationPrefs } from "@/lib/notifications/preferences";
export {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/queries";
export type { NotificationListItem } from "@/lib/notifications/queries";
export {
  CONFIRM_REMINDER_LEAD_HOURS,
  buyerConfirmReminderDedupeKey,
  buyerReceivedDedupeKey,
  formatDeadlineEsCo,
  isOrderEligibleForConfirmReminder,
  notifyBuyerReceivedConfirm,
  processSettlementReminders,
} from "@/lib/notifications/settlement";
export {
  notifyBuyerShippingMethodChosen,
  notifyBuyerTrackingUploaded,
  notifyIdentityReviewed,
  notifyListingReviewed,
  notifyAskerQuestionAnswered,
  notifyNewMessage,
  notifySellerNewListingQuestion,
  notifySellerOrderPaid,
  notifySellerPayoutSent,
  safeNotify,
} from "@/lib/notifications/marketplace";

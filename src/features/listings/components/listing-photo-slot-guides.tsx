/**
 * @file listing-photo-slot-guides.tsx
 * @description Line-art guide illustrations for empty listing photo slots.
 * @dependencies react, @/features/listings/types, @/lib/utils
 */

import type { ReactElement } from "react";

import type { ListingPhotoSlotId } from "@/features/listings/types";
import { cn } from "@/lib/utils";

type GuideProps = {
  className?: string;
};

/**
 * PhoneFrame
 *
 * Shared iPhone silhouette used by angle-specific guides.
 *
 * @param props.className - Optional SVG class names.
 * @returns Base phone outline.
 * @calledBy ListingPhotoSlotGuide variants
 */
function PhoneFrame({ className }: GuideProps) {
  return (
    <rect
      x="18"
      y="8"
      width="28"
      height="48"
      rx="5"
      className={cn("fill-none stroke-current", className)}
      strokeWidth="1.75"
    />
  );
}

/**
 * GuideFront
 *
 * Front-facing phone with notch and home indicator.
 *
 * @returns SVG guide for the front slot.
 */
function GuideFront({ className }: GuideProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <PhoneFrame />
      <rect x="26" y="11" width="12" height="3" rx="1.5" fill="currentColor" />
      <rect
        x="28"
        y="48"
        width="8"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  );
}

/**
 * GuideBack
 *
 * Rear camera island silhouette.
 *
 * @returns SVG guide for the back slot.
 */
function GuideBack({ className }: GuideProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <PhoneFrame />
      <rect
        x="22"
        y="14"
        width="14"
        height="14"
        rx="3.5"
        className="fill-none stroke-current"
        strokeWidth="1.5"
      />
      <circle cx="27" cy="19" r="2.25" fill="currentColor" />
      <circle cx="33" cy="19" r="2.25" fill="currentColor" />
      <circle cx="27" cy="25" r="2.25" fill="currentColor" />
    </svg>
  );
}

/**
 * GuideSideProfile
 *
 * Side profile with volume / power buttons, optionally mirrored so the left and
 * right slots read as opposite edges of the same device.
 *
 * @param props.className - Optional SVG class names.
 * @param props.mirrored - Flip horizontally for the right-hand profile.
 * @returns SVG guide for a side slot.
 * @calledBy GuideLeft, GuideRight
 */
function GuideSideProfile({
  className,
  mirrored,
}: GuideProps & { mirrored?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <g transform={mirrored ? "translate(64,0) scale(-1,1)" : undefined}>
        <rect
          x="26"
          y="8"
          width="12"
          height="48"
          rx="3"
          className="fill-none stroke-current"
          strokeWidth="1.75"
        />
        <path
          d="M26 18h-2.5M26 24h-2.5M38 22h2.5"
          className="stroke-current"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * GuideLeft
 *
 * Left profile — volume buttons face the viewer.
 *
 * @param props.className - Optional SVG class names.
 * @returns SVG guide for the left slot.
 */
function GuideLeft({ className }: GuideProps) {
  return <GuideSideProfile className={className} />;
}

/**
 * GuideRight
 *
 * Right profile — mirrored so the side button faces the viewer.
 *
 * @param props.className - Optional SVG class names.
 * @returns SVG guide for the right slot.
 */
function GuideRight({ className }: GuideProps) {
  return <GuideSideProfile className={className} mirrored />;
}

/**
 * GuideBottom
 *
 * Bottom edge seen head-on: charging port between speaker grilles.
 *
 * @param props.className - Optional SVG class names.
 * @returns SVG guide for the bottom slot.
 */
function GuideBottom({ className }: GuideProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <rect
        x="14"
        y="26"
        width="36"
        height="12"
        rx="4"
        className="fill-none stroke-current"
        strokeWidth="1.75"
      />
      <rect
        x="28"
        y="30.25"
        width="8"
        height="3.5"
        rx="1.75"
        fill="currentColor"
      />
      <path
        d="M20 32h3M24 32h0.5M41 32h3M39 32h0.5"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * GuideScreen
 *
 * Lit screen with simple wallpaper bars.
 *
 * @returns SVG guide for the screen-on slot.
 */
function GuideScreen({ className }: GuideProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <PhoneFrame />
      <rect
        x="21"
        y="16"
        width="22"
        height="32"
        rx="2"
        fill="currentColor"
        opacity="0.12"
      />
      <rect
        x="24"
        y="20"
        width="16"
        height="2.5"
        rx="1"
        fill="currentColor"
        opacity="0.55"
      />
      <rect
        x="24"
        y="26"
        width="12"
        height="2.5"
        rx="1"
        fill="currentColor"
        opacity="0.35"
      />
      <rect
        x="24"
        y="32"
        width="14"
        height="2.5"
        rx="1"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

/**
 * GuideBattery
 *
 * Settings-style battery health cue inside the phone.
 *
 * @returns SVG guide for the battery slot.
 */
function GuideBattery({ className }: GuideProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <PhoneFrame />
      <rect
        x="23"
        y="24"
        width="16"
        height="10"
        rx="2"
        className="fill-none stroke-current"
        strokeWidth="1.5"
      />
      <rect x="39" y="27" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect
        x="25"
        y="26.5"
        width="10"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.45"
      />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        className="fill-current"
        style={{ fontSize: "7px", fontWeight: 600 }}
      >
        %
      </text>
    </svg>
  );
}

/**
 * GuideImei
 *
 * Settings info rows suggesting the IMEI screen.
 *
 * @returns SVG guide for the IMEI slot.
 */
function GuideImei({ className }: GuideProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-full", className)}
    >
      <PhoneFrame />
      <rect
        x="22"
        y="18"
        width="20"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="22"
        y="26"
        width="20"
        height="2.5"
        rx="1"
        fill="currentColor"
        opacity="0.28"
      />
      <rect
        x="22"
        y="32"
        width="20"
        height="2.5"
        rx="1"
        fill="currentColor"
        opacity="0.28"
      />
      <rect
        x="22"
        y="38"
        width="14"
        height="2.5"
        rx="1"
        fill="currentColor"
        opacity="0.55"
      />
      <text
        x="32"
        y="50"
        textAnchor="middle"
        className="fill-current"
        style={{ fontSize: "6px", fontWeight: 600, letterSpacing: "0.04em" }}
      >
        IMEI
      </text>
    </svg>
  );
}

const GUIDES: Record<ListingPhotoSlotId, (props: GuideProps) => ReactElement> =
  {
    front: GuideFront,
    back: GuideBack,
    left: GuideLeft,
    right: GuideRight,
    bottom: GuideBottom,
    screen: GuideScreen,
    battery: GuideBattery,
    imei: GuideImei,
  };

type ListingPhotoSlotGuideProps = {
  slotId: ListingPhotoSlotId;
  className?: string;
};

/**
 * ListingPhotoSlotGuide
 *
 * Renders the empty-slot illustration for a guided listing photo.
 *
 * @param props.slotId - Slot id from LISTING_PHOTO_SLOTS.
 * @param props.className - Optional class on the root SVG.
 * @returns Angle-specific guide illustration.
 * @calledBy GalleryUploadForm empty slots
 */
export function ListingPhotoSlotGuide({
  slotId,
  className,
}: ListingPhotoSlotGuideProps) {
  const Guide = GUIDES[slotId];
  return <Guide className={className} />;
}

"use client";

import { useEffect } from "react";

import { recordRecentlyViewed } from "@/lib/recently-viewed";

type RecordRecentlyViewedProps = {
  slug: string;
  title: string;
};

/** Records a listing visit in localStorage for the home “recently viewed” strip. */
export function RecordRecentlyViewed({
  slug,
  title,
}: RecordRecentlyViewedProps) {
  useEffect(() => {
    recordRecentlyViewed(slug, title);
  }, [slug, title]);

  return null;
}

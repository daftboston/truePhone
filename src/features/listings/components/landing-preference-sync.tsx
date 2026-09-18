"use client";

/**
 * @file landing-preference-sync.tsx
 * @description Client-only landing preference restore/record (post-mount).
 * @dependencies next/navigation, landing preference helpers/actions
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { updateLandingPreferenceAction } from "@/features/listings/actions/landing-preference";
import {
  readLandingPreference,
  writeLandingPreference,
  type LandingPreference,
} from "@/lib/landing-preference";

type HomeLandingPreferenceProps = {
  signedInPreference?: LandingPreference | null;
  isAuthenticated?: boolean;
  /** True when the user explicitly opened marketing home (e.g. «Inicio»). */
  explicitHome?: boolean;
};

/**
 * HomeLandingPreference
 *
 * On `/`, restores ANUNCIOS preference after mount unless the visit is explicit
 * Inicio navigation. Always records HOME when the user stays on marketing home.
 *
 * @param props.signedInPreference - Profile preference for signed-in users.
 * @param props.isAuthenticated - Whether to mirror preference on Profile.
 * @param props.explicitHome - Skip restore when the user chose Inicio.
 */
export function HomeLandingPreference({
  signedInPreference = null,
  isAuthenticated = false,
  explicitHome = false,
}: HomeLandingPreferenceProps) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (explicitHome) {
      writeLandingPreference("HOME");
      if (isAuthenticated) {
        void updateLandingPreferenceAction("HOME");
      }
      return;
    }

    const stored = readLandingPreference();
    const preference = signedInPreference ?? stored;
    if (preference === "ANUNCIOS") {
      router.replace("/anuncios");
      return;
    }

    writeLandingPreference("HOME");
    if (isAuthenticated) {
      void updateLandingPreferenceAction("HOME");
    }
  }, [router, signedInPreference, isAuthenticated, explicitHome]);

  return null;
}

type LandingPreferenceRecorderProps = {
  preference: LandingPreference;
  isAuthenticated?: boolean;
};

/**
 * LandingPreferenceRecorder
 *
 * Records HOME or ANUNCIOS after visiting the matching route.
 *
 * @param props.preference - Preference to persist for this route.
 * @param props.isAuthenticated - Whether to mirror preference on Profile.
 */
export function LandingPreferenceRecorder({
  preference,
  isAuthenticated = false,
}: LandingPreferenceRecorderProps) {
  const lastRecorded = useRef<LandingPreference | null>(null);

  useEffect(() => {
    if (lastRecorded.current === preference) return;
    lastRecorded.current = preference;
    writeLandingPreference(preference);
    if (isAuthenticated) {
      void updateLandingPreferenceAction(preference);
    }
  }, [preference, isAuthenticated]);

  return null;
}

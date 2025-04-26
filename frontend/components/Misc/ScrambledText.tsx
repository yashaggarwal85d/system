"use client";

import React, { useMemo } from "react";
import { MorphingText } from "@/components/common/morphing-text";
import useDashboardStore from "@/store/dashboardStore";
import { cn } from "@/lib/utils/commonUtils";

const ScrambledText = () => {
  const { player, isLoading, error, currentTheme } = useDashboardStore();

  const phrases = useMemo(() => {
    if (player?.description) {
      return player.description
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return ["Loading Player Data..."];
  }, [player?.description]);

  if (isLoading && !player)
    return (
      <div className={`mb-12 text-center min-h-[6rem] max-h-[6rem]`}>
        Loading Player...
      </div>
    );
  if (error && !player)
    return (
      <div className={`mb-12 text-center min-h-[6rem] max-h-[6rem]`}>
        Error: {error}
      </div>
    );

  const morphingTextClassName = cn(
    "text-primary",
    "text-[22px]",
    "leading-tight",
    "whitespace-nowrap",
    "[filter:url(#threshold)_blur(0.6px)]"
  );

  return (
    <div
      className={`mt-2 text-center min-h-[2.5rem] max-h-[2.5rem] overflow-hidden mb-[-1.75rem]`}
    >
      <MorphingText texts={phrases} className={morphingTextClassName} />
    </div>
  );
};

export default ScrambledText;

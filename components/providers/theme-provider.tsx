"use client";

import * as React from "react";
import useDashboardStore from "@/store/dashboardStore";
import { ColorTheme } from "@/lib/utils/colors"; // Import ColorTheme type

// Helper function to convert HEX to HSL string (e.g., "207 90% 61%")
function hexToHslString(hex: string): string {
  hex = hex.replace(/^#/, "");
  const bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

// Helper to apply theme colors as CSS variables
function applyTheme(theme: ColorTheme) {
  const root = document.documentElement;
  if (!root) return;

  // Map theme object to CSS variables
  Object.entries(theme).forEach(([key, value]) => {
    if (typeof value === "string") {
      // Simple color value (e.g., background, border)
      // Convert key from camelCase to kebab-case (e.g., swirlBackground -> --swirl-background)
      const cssVarName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVarName, hexToHslString(value));
    } else if (
      typeof value === "object" &&
      value !== null &&
      "DEFAULT" in value
    ) {
      // Complex color value with DEFAULT and foreground (e.g., primary, card)
      const baseName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--${baseName}`, hexToHslString(value.DEFAULT));
      if ("foreground" in value && typeof value.foreground === "string") {
        root.style.setProperty(
          `--${baseName}-foreground`,
          hexToHslString(value.foreground)
        );
      }
    }
    // Handle swirlParticle specific properties if needed as CSS vars
    if (key === "swirlParticleBaseHue") {
      root.style.setProperty("--swirl-particle-base-hue", String(value));
    }
    if (key === "swirlParticleHueRange") {
      root.style.setProperty("--swirl-particle-hue-range", String(value));
    }
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = useDashboardStore((state) => state.currentTheme);

  React.useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]); // Re-apply theme when it changes in the store

  // We no longer need NextThemesProvider for this dynamic theming approach
  return <>{children}</>;
}

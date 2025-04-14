"use client";

import Script from "next/script";
import { useEffect } from "react";
import { createNoise3D } from "simplex-noise";
import { colors } from "@/lib/utils/colors";

class SimplexNoiseWrapper {
  private _noise3D;
  constructor() {
    this._noise3D = createNoise3D();
  }
  noise3D(x: number, y: number, z: number): number {
    return this._noise3D(x, y, z);
  }
}

declare global {
  interface Window {
    setup?: () => void;
    resize?: () => void;
    SimplexNoise?: typeof SimplexNoiseWrapper;
  }
}

// Set the global variable immediately when the module loads on the client-side
if (typeof window !== "undefined") {
  window.SimplexNoise = SimplexNoiseWrapper;
}

declare global {
  interface Window {
    setup?: () => void;
    resize?: () => void;
    SimplexNoise?: typeof SimplexNoiseWrapper;
  }
}

export default function SwirlBackground() {
  // Removed assignment from here

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--swirl-background-color",
        colors.swirlBackground
      );

      document.documentElement.style.setProperty(
        "--swirl-particle-base-hue",
        String(colors.swirlParticleBaseHue)
      );
      document.documentElement.style.setProperty(
        "--swirl-particle-hue-range",
        String(colors.swirlParticleHueRange)
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        if (window.setup) {
          window.removeEventListener("load", window.setup);
        }
        if (window.resize) {
          window.removeEventListener("resize", window.resize);
        }

        const container = document.querySelector(".content--canvas canvas");
        container?.remove();
      }
    };
  }, []);

  const handleScriptLoad = () => {
    if (typeof window !== "undefined" && window.setup) {
      console.log("Swirl script loaded, calling setup()...");
      window.setup();
    } else {
      console.error(
        "Swirl script loaded, but setup() function not found on window."
      );
    }
  };

  return (
    <>
      <div className="content--canvas fixed inset-0 -z-10"></div>
      <Script
        src="/swirl.js"
        strategy="afterInteractive" // Changed strategy
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error("Error loading swirl.js script:", e);
        }}
      />
    </>
  );
}

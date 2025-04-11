"use client";

import Script from "next/script";
import { useEffect } from "react";
import { createNoise3D } from "simplex-noise"; // Import the noise function
import { colors } from "@/lib/utils/colors"; // Import theme colors

// Wrapper class to mimic the original script's expectation
class SimplexNoiseWrapper {
  private _noise3D; // Renamed private property
  constructor() {
    this._noise3D = createNoise3D(); // Use renamed property
  }
  noise3D(x: number, y: number, z: number): number {
    // Public method
    return this._noise3D(x, y, z); // Use renamed property
  }
}

// Extend the Window interface
declare global {
  interface Window {
    setup?: () => void;
    resize?: () => void;
    SimplexNoise?: typeof SimplexNoiseWrapper; // Add the wrapper class type
  }
}

export default function SwirlBackground() {
  // Assign the wrapper to the window object on the client side
  if (typeof window !== "undefined") {
    window.SimplexNoise = SimplexNoiseWrapper;
  }

  useEffect(() => {
    // Set CSS custom properties on mount
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--swirl-background-color",
        colors.swirlBackground
      );
      // Convert numbers to string for setProperty
      document.documentElement.style.setProperty(
        "--swirl-particle-base-hue",
        String(colors.swirlParticleBaseHue)
      );
      document.documentElement.style.setProperty(
        "--swirl-particle-hue-range",
        String(colors.swirlParticleHueRange)
      );
    }

    // Cleanup function to remove event listeners added by the script
    return () => {
      if (typeof window !== "undefined") {
        // Attempt to remove listeners if they exist
        if (window.setup) {
          window.removeEventListener("load", window.setup);
        }
        if (window.resize) {
          window.removeEventListener("resize", window.resize);
        }
        // Also remove the canvas container if it exists to prevent duplicates on HMR
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
      {/* This div is the target container for the script's canvas */}
      <div className="content--canvas fixed inset-0 -z-10"></div>
      <Script
        src="/swirl.js"
        strategy="lazyOnload" // Load after page is interactive
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error("Error loading swirl.js script:", e);
        }}
      />
    </>
  );
}

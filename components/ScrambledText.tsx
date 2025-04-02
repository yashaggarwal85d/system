"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useScrambleStore from "@/store/scrambleStore";
import { useSession } from "next-auth/react";
import { TextScramble } from "@/lib/utils/scrambled";

const ScrambledText = () => {
  const { status } = useSession();
  const { getNextPhrase, fetchPhrases, isLoading, error, phrases } =
    useScrambleStore();
  const textRef = useRef<HTMLDivElement>(null); // Ref for the text element
  const scrambleInstance = useRef<TextScramble | null>(null); // Ref for the TextScramble instance
  const [isInitialized, setIsInitialized] = useState(false); // Track if TextScramble is ready

  // Effect 1: Initialize TextScramble
  useEffect(() => {
    if (textRef.current && !scrambleInstance.current) {
      scrambleInstance.current = new TextScramble(textRef.current);
      scrambleInstance.current.setText("Initializing...").then(() => {
        setIsInitialized(true); // Mark as ready after initial text is set
      });
    }
    // No specific cleanup needed here as TextScramble manages its animation frames
  }, []); // Run only once on mount

  // Effect 2: Fetch phrases when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      // Trigger fetch only if needed (store handles avoiding refetch)
      fetchPhrases();
    }
    // Optional: Reset state if status becomes unauthenticated?
    // else if (status === "unauthenticated") {
    //   // Reset local state if needed
    //   setCurrentText("Initializing...");
    // }
  }, [status, fetchPhrases]);

  // Effect 2: Update displayed text and manage interval based on auth and store state
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // Ensure the scramble instance is ready before trying to set text
    if (scrambleInstance.current && isInitialized) {
      if (status === "authenticated") {
        if (isLoading) {
          scrambleInstance.current.setText("Loading Phrases...");
        } else if (error) {
          scrambleInstance.current.setText(`Error: ${error}`); // Display specific error
        } else if (phrases.length > 0) {
          // Ensure phrases are loaded
          // Authenticated, not loading, no error, phrases available: Start the cycle
          const initialPhrase = getNextPhrase(); // Get first/next phrase
          scrambleInstance.current.setText(initialPhrase);

          intervalId = setInterval(() => {
            if (scrambleInstance.current) {
              // Check again inside interval
              scrambleInstance.current.setText(getNextPhrase());
            }
          }, 5000); // Change phrase every 5 seconds
        } else {
          // Authenticated, but no phrases yet (might be initial fetch)
          scrambleInstance.current.setText("Fetching data...");
        }
      } else {
        // Not authenticated or session loading
        scrambleInstance.current.setText("Initializing...");
      }
    } else if (!isInitialized && textRef.current) {
      // If not initialized yet but ref exists, ensure initial text is set
      // This might be redundant if Effect 1 handles it, but acts as a fallback
      if (!scrambleInstance.current) {
        scrambleInstance.current = new TextScramble(textRef.current);
      }
      scrambleInstance.current.setText("Initializing...");
    }

    // Cleanup function for the interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // Rerun when auth status, loading, error, phrases, or initialization status change
  }, [status, isLoading, error, phrases, getNextPhrase, isInitialized]);

  return (
    <div className="absolute top-4 left-4 z-10 p-2 bg-black/30 backdrop-blur-sm rounded">
      {/* Use a standard div with the ref, TextScramble handles the content and animation */}
      <div
        ref={textRef}
        className="text-sm text-[#4ADEF6] font-mono min-h-[1.2em]" // Added min-height to prevent layout shift
      >
        {/* Content is managed by TextScramble */}
      </div>
    </div>
  );
};

export default ScrambledText;

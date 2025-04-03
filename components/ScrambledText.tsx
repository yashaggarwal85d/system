"use client";

import React, { useState, useEffect, useRef } from "react";
import useScrambleStore from "@/store/scrambleStore";
import { useSession } from "next-auth/react";
import { TextScramble } from "@/lib/utils/scrambled";

const ScrambledText: React.FC = () => {
  const elementRef = useRef<HTMLHeadingElement>(null);
  const scramblerRef = useRef<TextScramble | null>(null);
  const [mounted, setMounted] = useState(false);
  useSession();

  const { getNextPhrase, fetchPhrases, isLoading, error } = useScrambleStore();

  useEffect(() => {
    if (elementRef.current && !scramblerRef.current) {
      scramblerRef.current = new TextScramble(elementRef.current);
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  useEffect(() => {
    if (mounted && scramblerRef.current && !isLoading && !error) {
      const next = () => {
        if (scramblerRef.current) {
          const phrase = getNextPhrase();
          scramblerRef.current.setText(phrase).then(() => {
            setTimeout(next, 2000);
          });
        }
      };
      next();
    }
  }, [mounted, isLoading, error, getNextPhrase]);

  let displayText = "SYSTEM INITIALIZING...";
  if (isLoading) {
    displayText = "LOADING PHRASES...";
  } else if (error) {
    displayText = "ERROR LOADING DATA";
  }

  return (
    <div className="mb-12 text-center">
      <h1
        ref={elementRef}
        className="text-[#4ADEF6] text-4xl font-bold tracking-wider text-center animate-glow"
      >
        {displayText}
      </h1>
    </div>
  );
};

export default ScrambledText;

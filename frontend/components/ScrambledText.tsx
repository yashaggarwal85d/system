"use client";

import React, { useState, useEffect, useRef } from "react";
import useScrambleStore from "@/store/scrambleStore";
import { TextScramble } from "@/lib/utils/scrambledClass";

interface ScrambledTextProps {
  className?: string;
}

const ScrambledText: React.FC<ScrambledTextProps> = ({ className }) => {
  const elementRef = useRef<HTMLHeadingElement>(null);
  const scramblerRef = useRef<TextScramble | null>(null);
  const [mounted, setMounted] = useState(false);

  const { getNextPhrase, isLoading, error, phrases } = useScrambleStore();

  useEffect(() => {
    if (elementRef.current && !scramblerRef.current) {
      scramblerRef.current = new TextScramble(elementRef.current);
      setMounted(true);
    }
  }, []);

  useEffect(() => {}, [phrases]);

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
    <div className={`mb-12 text-center min-h-[6rem] max-h-[6rem] ${className}`}>
      <h1
        ref={elementRef}
        className="text-primary text-4xl font-bold tracking-wider text-center animate-glow"
      >
        {displayText}
      </h1>
    </div>
  );
};

export default ScrambledText;

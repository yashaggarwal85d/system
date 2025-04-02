'use client'

import { useState, useEffect, useCallback } from 'react';
import { createCharacters, updateCharacterPositions, generateActiveIndices } from '../utils/character';

export const useCharacters = (count: number = 150) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  
  const initializeCharacters = useCallback(() => {
    setCharacters(createCharacters(count));
  }, [count]);

  useEffect(() => {
    initializeCharacters();
  }, [initializeCharacters]);

  return { characters, setCharacters };
};

export const useCharacterAnimation = (characters: Character[], setCharacters: React.Dispatch<React.SetStateAction<Character[]>>) => {
  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      setCharacters((prevChars) => updateCharacterPositions(prevChars));
      animationFrameId = requestAnimationFrame(updatePositions);
    };

    animationFrameId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrameId);
  }, [setCharacters]);
};

export const useActiveIndices = (charactersLength: number) => {
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const updateActiveIndices = () => {
      setActiveIndices(generateActiveIndices(charactersLength));
    };

    const flickerInterval = setInterval(updateActiveIndices, 100);
    return () => clearInterval(flickerInterval);
  }, [charactersLength]);

  return activeIndices;
};
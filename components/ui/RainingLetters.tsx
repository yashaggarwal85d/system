"use client";

import React from "react";
import CharacterSpan from "./character-span";
import {
  useCharacters,
  useCharacterAnimation,
  useActiveIndices,
} from "../../lib/hooks/character-animation";

const RainingLetters: React.FC = () => {
  const { characters, setCharacters } = useCharacters(150);
  const activeIndices = useActiveIndices(characters.length);

  useCharacterAnimation(characters, setCharacters);

  return (
    <div className="fixed inset-0 bg-[#000810]/95 overflow-hidden -z-10">
      {characters.map((char, index) => (
        <CharacterSpan
          key={index}
          character={char}
          index={index}
          isActive={activeIndices.has(index)}
        />
      ))}
    </div>
  );
};

export default RainingLetters;

import React from "react";
import { Character } from "@/lib/utils/interfaces";

interface SimplifiedCharacterSpanProps {
  character: Character;
  index: number;
}

const CharacterSpan: React.FC<SimplifiedCharacterSpanProps> = ({
  character,
  index,
}) => {
  return (
    <span
      key={index}
      className="absolute font-mono text-[#4ADEF6]/50"
      style={{
        left: `${character.x}%`,
        top: `${character.y}%`,
        transform: `translate(-50%, -50%)`,
        opacity: 0.6,
        willChange: "transform, top",
        fontSize: "1.4rem",
      }}
    >
      {character.char}
    </span>
  );
};

export default React.memo(CharacterSpan);

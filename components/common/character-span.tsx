import React from "react";
import { Character } from "@/lib/utils/interfaces"; // Import Character type

// Define props directly here or import if defined elsewhere
interface SimplifiedCharacterSpanProps {
  character: Character;
  index: number;
  // isActive prop removed
}

const CharacterSpan: React.FC<SimplifiedCharacterSpanProps> = ({
  character,
  index,
}) => {
  return (
    <span
      key={index}
      className="absolute font-mono text-[#4ADEF6]/50" // Simplified base class
      style={{
        left: `${character.x}%`,
        top: `${character.y}%`,
        transform: `translate(-50%, -50%)`, // Simplified transform
        opacity: 0.6, // Simplified opacity
        willChange: "transform, top", // Keep will-change
        fontSize: "1.4rem", // Keep font size
        // Removed transition, textShadow, conditional scale
      }}
    >
      {character.char}
    </span>
  );
};

// Still memoize for performance, though props are simpler now
export default React.memo(CharacterSpan);

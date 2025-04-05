
import React from 'react';

const CharacterSpan: React.FC<CharacterSpanProps> = ({ character, index, isActive }) => {
  return (
    <span
      key={index}
      className={`absolute font-mono transition-all duration-200 ${
        isActive
          ? "text-[#4ADEF6] scale-150 z-10 font-bold animate-pulse"
          : "text-[#4ADEF6]/30"
      }`}
      style={{
        left: `${character.x}%`,
        top: `${character.y}%`,
        transform: `translate(-50%, -50%) ${isActive ? "scale(1.5)" : "scale(1)"}`,
        textShadow: isActive
          ? "0 0 8px rgba(74, 222, 246, 0.8), 0 0 12px rgba(74, 222, 246, 0.4)"
          : "0 0 4px rgba(74, 222, 246, 0.2)",
        opacity: isActive ? 1 : 0.4,
        transition: "all 0.2s ease-out",
        willChange: "transform, top",
        fontSize: "1.4rem",
      }}
    >
      {character.char}
    </span>
  );
};

export default React.memo(CharacterSpan);
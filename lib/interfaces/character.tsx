interface Character {
  char: string;
  x: number;
  y: number;
  speed: number;
}

interface CharacterSpanProps {
  character: Character;
  index: number;
  isActive: boolean;
}

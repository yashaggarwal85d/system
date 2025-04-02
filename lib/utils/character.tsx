// utils/characterUtils.ts
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const getRandomCharacter = (): string => {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
};

export const createCharacters = (count: number = 150): Character[] => {
  const newCharacters: Character[] = [];

  for (let i = 0; i < count; i++) {
    newCharacters.push({
      char: getRandomCharacter(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.3 + Math.random() * 0.9,
    });
  }

  return newCharacters;
};

export const updateCharacterPositions = (
  characters: Character[]
): Character[] => {
  return characters.map((char) => ({
    ...char,
    y: char.y + char.speed,
    ...(char.y >= 100 && {
      y: -5,
      x: Math.random() * 100,
      char: getRandomCharacter(),
    }),
  }));
};

export const generateActiveIndices = (total: number): Set<number> => {
  const newActiveIndices = new Set<number>();
  const numActive = Math.floor(Math.random() * 5) + 3; // 3-7 characters

  for (let i = 0; i < numActive; i++) {
    newActiveIndices.add(Math.floor(Math.random() * total));
  }

  return newActiveIndices;
};

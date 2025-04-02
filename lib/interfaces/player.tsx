export interface Player {
  id: string; // Added from Prisma model
  name?: string; // Made optional, might come from User model later
  level: number;
  aura: number; // Use number (covers Float)
  auraToNextLevel: number; // Use number (covers Float)
  title: string;
  createdAt: Date; // Added missing field
  updatedAt: Date; // Added missing field
  userId: string; // Added from Prisma model
}

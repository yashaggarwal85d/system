-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL DEFAULT 1,
    "aura" REAL NOT NULL DEFAULT 0,
    "auraToNextLevel" REAL NOT NULL DEFAULT 100,
    "title" TEXT NOT NULL DEFAULT 'Initiate',
    "playerDescription" TEXT NOT NULL DEFAULT 'You are weak',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("aura", "auraToNextLevel", "createdAt", "id", "level", "title", "updatedAt", "userId") SELECT "aura", "auraToNextLevel", "createdAt", "id", "level", "title", "updatedAt", "userId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

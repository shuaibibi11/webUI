-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "apiKey" TEXT,
    "modelName" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'openai',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 8192,
    "topP" REAL NOT NULL DEFAULT 0.9,
    "contextLength" INTEGER NOT NULL DEFAULT 4096,
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "ModelConfig_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ModelConfig" ("apiKey", "createdAt", "createdBy", "enabled", "endpoint", "id", "maxTokens", "modelName", "protocol", "provider", "tag", "temperature", "topP", "updatedAt") SELECT "apiKey", "createdAt", "createdBy", "enabled", "endpoint", "id", "maxTokens", "modelName", "protocol", "provider", "tag", "temperature", "topP", "updatedAt" FROM "ModelConfig";
DROP TABLE "ModelConfig";
ALTER TABLE "new_ModelConfig" RENAME TO "ModelConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

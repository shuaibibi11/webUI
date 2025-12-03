-- CreateTable
CREATE TABLE "BishengConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggerType" TEXT,
    "triggerExpr" TEXT,
    "paramMap" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

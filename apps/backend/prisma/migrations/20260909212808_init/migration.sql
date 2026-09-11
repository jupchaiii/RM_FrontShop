-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT,
    "material" TEXT NOT NULL,
    "infill" INTEGER NOT NULL DEFAULT 20,
    "layerHeight" REAL NOT NULL DEFAULT 0.2,
    "supportType" TEXT NOT NULL DEFAULT 'None',
    "estimatedTime" INTEGER NOT NULL,
    "estimatedCost" REAL NOT NULL,
    "actualCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'QUOTED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "purpose" TEXT,
    "notes" TEXT,
    "quotedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderedAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "pickupAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "projectId" TEXT,
    "material" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QueueStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "machinesActive" INTEGER NOT NULL DEFAULT 2,
    "statusMessage" TEXT,
    "lastUpdated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseCostPerHour" REAL NOT NULL DEFAULT 100,
    "materialCosts" TEXT NOT NULL DEFAULT '{"PLA":50,"PETG":75,"ABS":100,"TPU":120}',
    "minOrder" REAL NOT NULL DEFAULT 50,
    "rushFee" REAL NOT NULL DEFAULT 0.3,
    "maxFileSize" INTEGER NOT NULL DEFAULT 104857600,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

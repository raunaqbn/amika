-- AlterTable
ALTER TABLE "Friend" ADD COLUMN "customProfileImage" TEXT;
ALTER TABLE "Friend" ADD COLUMN "email" TEXT;
ALTER TABLE "Friend" ADD COLUMN "interests" TEXT;
ALTER TABLE "Friend" ADD COLUMN "linkedUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "interests" TEXT;

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserConnection_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedByUserId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedItem_sharedByUserId_fkey" FOREIGN KEY ("sharedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedItem_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "price" TEXT,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "location" TEXT,
    "locationDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripCollaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'collaborator',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripCollaborator_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripCollaborator_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripDailyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATETIME,
    CONSTRAINT "TripDailyPlan_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "category" TEXT,
    "externalUrl" TEXT,
    "estimatedCost" REAL,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripEvent_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "TripDailyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "collaboratorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "confirmationNum" TEXT,
    "departureTime" DATETIME,
    "arrivalTime" DATETIME,
    "location" TEXT,
    "cost" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "url" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripTicket_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT,
    "context" TEXT NOT NULL DEFAULT 'general',
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripMessage_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripPoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "TripPoll_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripPollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TripPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "TripPoll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripPollVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionId" TEXT NOT NULL,
    "visitorId" TEXT,
    "friendId" TEXT,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "TripPollOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripGoalProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    CONSTRAINT "TripGoalProgress_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAccount_userId_key" ON "GoogleAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_requesterId_addresseeId_key" ON "UserConnection"("requesterId", "addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedItem_sharedByUserId_sharedWithUserId_itemType_itemId_key" ON "SharedItem"("sharedByUserId", "sharedWithUserId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "TripSession_userId_idx" ON "TripSession"("userId");

-- CreateIndex
CREATE INDEX "TripCollaborator_tripId_idx" ON "TripCollaborator"("tripId");

-- CreateIndex
CREATE INDEX "TripCollaborator_userId_idx" ON "TripCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripCollaborator_tripId_friendId_key" ON "TripCollaborator"("tripId", "friendId");

-- CreateIndex
CREATE INDEX "TripDailyPlan_tripId_idx" ON "TripDailyPlan"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripDailyPlan_tripId_dayNumber_key" ON "TripDailyPlan"("tripId", "dayNumber");

-- CreateIndex
CREATE INDEX "TripEvent_dailyPlanId_idx" ON "TripEvent"("dailyPlanId");

-- CreateIndex
CREATE INDEX "TripTicket_tripId_idx" ON "TripTicket"("tripId");

-- CreateIndex
CREATE INDEX "TripTicket_collaboratorId_idx" ON "TripTicket"("collaboratorId");

-- CreateIndex
CREATE INDEX "TripMessage_tripId_context_idx" ON "TripMessage"("tripId", "context");

-- CreateIndex
CREATE INDEX "TripMessage_tripId_createdAt_idx" ON "TripMessage"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "TripPoll_tripId_context_idx" ON "TripPoll"("tripId", "context");

-- CreateIndex
CREATE INDEX "TripPollOption_pollId_idx" ON "TripPollOption"("pollId");

-- CreateIndex
CREATE INDEX "TripPollVote_optionId_idx" ON "TripPollVote"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "TripPollVote_optionId_visitorId_key" ON "TripPollVote"("optionId", "visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "TripPollVote_optionId_friendId_key" ON "TripPollVote"("optionId", "friendId");

-- CreateIndex
CREATE INDEX "TripGoalProgress_tripId_idx" ON "TripGoalProgress"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripGoalProgress_tripId_goalType_key" ON "TripGoalProgress"("tripId", "goalType");

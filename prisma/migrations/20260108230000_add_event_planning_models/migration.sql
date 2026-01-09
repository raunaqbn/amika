-- CreateTable
CREATE TABLE "event_plan_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "eventDate" DATETIME,
    "eventTime" TEXT,
    "selectedEventId" TEXT,
    "shareToken" TEXT,
    "joinToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "event_plan_collaborators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventPlanId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'collaborator',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_plan_collaborators_eventPlanId_fkey" FOREIGN KEY ("eventPlanId") REFERENCES "event_plan_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_plan_collaborators_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "friends" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_plan_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "category" TEXT,
    "externalUrl" TEXT,
    "imageUrl" TEXT,
    "eventDate" DATETIME,
    "eventTime" TEXT,
    "estimatedCost" REAL,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "event_plan_candidates_eventPlanId_fkey" FOREIGN KEY ("eventPlanId") REFERENCES "event_plan_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_plan_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventPlanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT,
    "context" TEXT NOT NULL DEFAULT 'general',
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "event_plan_polls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventPlanId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "event_plan_polls_eventPlanId_fkey" FOREIGN KEY ("eventPlanId") REFERENCES "event_plan_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_plan_poll_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "event_plan_poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "event_plan_polls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_plan_poll_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionId" TEXT NOT NULL,
    "visitorId" TEXT,
    "friendId" TEXT,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_plan_poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "event_plan_poll_options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_plan_goal_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventPlanId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    CONSTRAINT "event_plan_goal_progress_eventPlanId_fkey" FOREIGN KEY ("eventPlanId") REFERENCES "event_plan_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_plan_presence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventPlanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'general',
    "isTyping" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "event_plan_sessions_userId_idx" ON "event_plan_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_sessions_shareToken_key" ON "event_plan_sessions"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_sessions_joinToken_key" ON "event_plan_sessions"("joinToken");

-- CreateIndex
CREATE INDEX "event_plan_collaborators_eventPlanId_idx" ON "event_plan_collaborators"("eventPlanId");

-- CreateIndex
CREATE INDEX "event_plan_collaborators_userId_idx" ON "event_plan_collaborators"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_collaborators_eventPlanId_friendId_key" ON "event_plan_collaborators"("eventPlanId", "friendId");

-- CreateIndex
CREATE INDEX "event_plan_candidates_eventPlanId_idx" ON "event_plan_candidates"("eventPlanId");

-- CreateIndex
CREATE INDEX "event_plan_messages_eventPlanId_context_idx" ON "event_plan_messages"("eventPlanId", "context");

-- CreateIndex
CREATE INDEX "event_plan_messages_eventPlanId_createdAt_idx" ON "event_plan_messages"("eventPlanId", "createdAt");

-- CreateIndex
CREATE INDEX "event_plan_polls_eventPlanId_context_idx" ON "event_plan_polls"("eventPlanId", "context");

-- CreateIndex
CREATE INDEX "event_plan_poll_options_pollId_idx" ON "event_plan_poll_options"("pollId");

-- CreateIndex
CREATE INDEX "event_plan_poll_votes_optionId_idx" ON "event_plan_poll_votes"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_poll_votes_optionId_visitorId_key" ON "event_plan_poll_votes"("optionId", "visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_poll_votes_optionId_friendId_key" ON "event_plan_poll_votes"("optionId", "friendId");

-- CreateIndex
CREATE INDEX "event_plan_goal_progress_eventPlanId_idx" ON "event_plan_goal_progress"("eventPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_goal_progress_eventPlanId_goalType_key" ON "event_plan_goal_progress"("eventPlanId", "goalType");

-- CreateIndex
CREATE UNIQUE INDEX "event_plan_presence_eventPlanId_userId_key" ON "event_plan_presence"("eventPlanId", "userId");

-- CreateIndex
CREATE INDEX "event_plan_presence_eventPlanId_idx" ON "event_plan_presence"("eventPlanId");

-- CreateIndex
CREATE INDEX "event_plan_presence_lastSeen_idx" ON "event_plan_presence"("lastSeen");

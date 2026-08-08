CREATE TABLE "group_conversations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_conversations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "group_conversation_members" (
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReadAt" DATETIME,
  PRIMARY KEY ("conversationId", "userId"),
  CONSTRAINT "group_conversation_members_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "group_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "group_conversation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "group_messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "group_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "group_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "group_conversation_members_userId_conversationId_idx" ON "group_conversation_members"("userId", "conversationId");
CREATE INDEX "group_messages_conversationId_createdAt_idx" ON "group_messages"("conversationId", "createdAt");
CREATE INDEX "group_messages_senderId_createdAt_idx" ON "group_messages"("senderId", "createdAt");

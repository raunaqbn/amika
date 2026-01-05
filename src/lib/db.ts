import { randomUUID } from "crypto";

type Friend = {
  id: string;
  name: string;
  birthday: Date | null;
  howWeMet: string | null;
  notes: string | null;
  lastContact: Date | null;
  createdAt: Date;
};

type Memory = {
  id: string;
  friendId: string;
  content: string;
  createdAt: Date;
};

const friends: Friend[] = [];
const memories: Memory[] = [];

export const prisma = {
  friend: {
    findMany: async (_args?: unknown) => {
      return friends
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((friend) => ({
          ...friend,
          memories: memories
            .filter((memory) => memory.friendId === friend.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        }));
    },
    create: async ({ data }: { data: Partial<Friend> }) => {
      const newFriend: Friend = {
        id: randomUUID(),
        name: data.name ?? "",
        birthday: data.birthday ?? null,
        howWeMet: data.howWeMet ?? null,
        notes: data.notes ?? null,
        lastContact: data.lastContact ?? null,
        createdAt: new Date(),
      };
      friends.push(newFriend);
      return newFriend;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<Friend> }) => {
      const friendIndex = friends.findIndex((friend) => friend.id === where.id);
      if (friendIndex === -1) {
        throw new Error("Friend not found");
      }
      const existing = friends[friendIndex];
      const updated: Friend = {
        ...existing,
        ...data,
      };
      friends[friendIndex] = updated;
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const friendIndex = friends.findIndex((friend) => friend.id === where.id);
      if (friendIndex === -1) {
        throw new Error("Friend not found");
      }
      friends.splice(friendIndex, 1);
      for (let i = memories.length - 1; i >= 0; i -= 1) {
        if (memories[i].friendId === where.id) {
          memories.splice(i, 1);
        }
      }
      return { success: true };
    },
  },
  memory: {
    create: async ({ data }: { data: { friendId: string; content: string } }) => {
      const friendExists = friends.some((friend) => friend.id === data.friendId);
      if (!friendExists) {
        throw new Error("Friend not found");
      }
      const memory: Memory = {
        id: randomUUID(),
        friendId: data.friendId,
        content: data.content,
        createdAt: new Date(),
      };
      memories.push(memory);
      return memory;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const memoryIndex = memories.findIndex((memory) => memory.id === where.id);
      if (memoryIndex === -1) {
        throw new Error("Memory not found");
      }
      memories.splice(memoryIndex, 1);
      return { success: true };
    },
  },
};

export type User = {
  id: string;
  email: string;
  name: string;
  profileImage?: string | null;
  birthday?: string | null;
  interests?: string[];
  statusText?: string | null;
};

export type Friend = {
  id: string;
  name: string;
  email?: string | null;
  profileImage?: string | null;
  customProfileImage?: string | null;
  linkedUserId?: string | null;
  memoriesCount?: number;
  notesCount?: number;
  howWeMet?: string | null;
  birthday?: string | null;
  notes?: string | null;
  interests?: string | null;
  statusText?: string | null;
  lastContact?: string | null;
};

export type DiscoverableUser = {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
};

export type Connection = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  otherUser: DiscoverableUser | null;
};

export type Memory = {
  id: string;
  userId: string;
  friendId?: string | null;
  content: string;
  imageUrl?: string | null;
  visibility: 'private' | 'friends' | 'public';
  memoryDate: string;
  createdAt: string;
  author?: { id: string; name: string; profileImage?: string | null };
  friend?: { id: string; name: string; profileImage?: string | null } | null;
  audienceCount?: number;
  reactionCount?: number;
  commentCount?: number;
  reactedByMe?: boolean;
  isOwn?: boolean;
};

export type Thread = {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  kind: 'direct' | 'group';
  memberCount?: number;
  members?: DiscoverableUser[];
};

export type Message = {
  id: string;
  senderId: string;
  recipientId: string | null;
  threadId?: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  sender?: { id: string; name: string; profileImage?: string | null };
};

export type SharedItem = {
  id: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  itemType: 'memory' | 'note';
  itemId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string | null;
  createdAt: string;
  sharedBy: { id: string; name: string; email: string; profileImage?: string | null };
  item?: { id: string; title?: string | null; content?: string; imageUrl?: string | null; memoryDate?: string; createdAt?: string } | null;
};

export type NotificationCounts = {
  connectionRequests: number;
  sharedItems: number;
  chatNotifications: number;
};

export type JournalNote = {
  id: string;
  title?: string | null;
  content: string;
  imageUrl?: string | null;
  analysis?: string | null;
  createdAt: string;
  friends?: Array<{ id: string; name: string }>;
};

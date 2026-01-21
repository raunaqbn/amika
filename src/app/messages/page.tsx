'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle, Plus, Users } from 'lucide-react';
import { useMessagesPageData, Conversation, revalidateConversations } from '@/hooks/use-data';
import { NewConversationDialog } from '@/components/new-conversation-dialog';
import { formatDistanceToNow } from 'date-fns';

function getConversationDisplayName(conversation: Conversation, currentUserId: string): string {
  if (conversation.isGroup && conversation.name) {
    return conversation.name;
  }

  // For 1:1 conversations, show the other person's name
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  return otherParticipant?.user.name || 'Unknown';
}

function getConversationImage(conversation: Conversation, currentUserId: string): string | null {
  if (conversation.isGroup) {
    return null; // Group chats don't have a single image
  }

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  return otherParticipant?.user.profileImage || null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MessagesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    conversations,
    friends,
    isLoading: loading,
    refreshConversations,
  } = useMessagesPageData();

  // Get current user ID from the first conversation (or null if no conversations)
  const currentUserId = useMemo(() => {
    if (conversations.length > 0 && conversations[0].participants.length > 0) {
      // Find the user who created the conversation or is a participant
      return conversations[0].createdById;
    }
    return null;
  }, [conversations]);

  const handleConversationClick = useCallback((conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  }, [router]);

  const handleNewConversation = useCallback(async (conversation: Conversation) => {
    setDialogOpen(false);
    revalidateConversations();
    router.push(`/messages/${conversation.id}`);
  }, [router]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter((conv) => {
      const displayName = getConversationDisplayName(conv, currentUserId || '');
      return displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, currentUserId]);

  // Separate conversations with unread messages
  const { unreadConversations, readConversations } = useMemo(() => {
    return {
      unreadConversations: filteredConversations.filter(c => c.unreadCount > 0),
      readConversations: filteredConversations.filter(c => c.unreadCount === 0),
    };
  }, [filteredConversations]);

  // Get connected friends for new conversation dialog
  const connectedFriends = useMemo(() => {
    return friends.filter(f => f.linkedUserId);
  }, [friends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto pt-14 md:pt-16 pb-20 md:pb-8">
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#A8C5A8] hover:bg-[#97B897] text-white"
            disabled={connectedFriends.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>

        {conversations.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#A8C5A8]/30 focus:border-[#A8C5A8] focus:ring-[#A8C5A8]"
            />
          </div>
        )}

        {conversations.length === 0 ? (
          <Card className="p-8 text-center border-[#A8C5A8]/20">
            <MessageCircle className="w-12 h-12 text-[#A8C5A8] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-4">
              {connectedFriends.length > 0
                ? 'Start a conversation with one of your friends on Amika!'
                : 'Connect with friends on Amika to start messaging.'}
            </p>
            {connectedFriends.length > 0 && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[#A8C5A8] hover:bg-[#97B897] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start a conversation
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Unread conversations */}
            {unreadConversations.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Unread
                </h2>
                {unreadConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={currentUserId || ''}
                    onClick={() => handleConversationClick(conversation.id)}
                  />
                ))}
              </div>
            )}

            {/* Read conversations */}
            {readConversations.length > 0 && (
              <div>
                {unreadConversations.length > 0 && (
                  <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    All messages
                  </h2>
                )}
                {readConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={currentUserId || ''}
                    onClick={() => handleConversationClick(conversation.id)}
                  />
                ))}
              </div>
            )}

            {filteredConversations.length === 0 && searchQuery && (
              <Card className="p-6 text-center border-[#A8C5A8]/20">
                <p className="text-gray-600">No conversations match your search.</p>
              </Card>
            )}
          </div>
        )}
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        friends={connectedFriends}
        onConversationCreated={handleNewConversation}
      />
    </div>
  );
}

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onClick: () => void;
}

function ConversationCard({ conversation, currentUserId, onClick }: ConversationCardProps) {
  const displayName = getConversationDisplayName(conversation, currentUserId);
  const profileImage = getConversationImage(conversation, currentUserId);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Card
      className={`p-4 mb-2 cursor-pointer transition-colors hover:bg-gray-50 border-[#A8C5A8]/20 ${
        hasUnread ? 'bg-[#A8C5A8]/5 border-[#A8C5A8]/40' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {conversation.isGroup ? (
            <div className="w-12 h-12 rounded-full bg-[#A8C5A8]/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#A8C5A8]" />
            </div>
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarImage src={profileImage || undefined} alt={displayName} />
              <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          )}
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4A5A5] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {displayName}
            </h3>
            {conversation.lastMessageAt && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {conversation.lastMessage.senderId === currentUserId && (
                <span className="text-gray-400">You: </span>
              )}
              {conversation.lastMessage.content}
            </p>
          )}
          {conversation.isGroup && (
            <p className="text-xs text-gray-400 mt-1">
              {conversation.participants.length} members
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

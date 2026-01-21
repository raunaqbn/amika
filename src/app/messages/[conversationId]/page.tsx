'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Users, MoreVertical, UserPlus, LogOut } from 'lucide-react';
import { useMessages, DirectMessage, revalidateConversations, revalidateMessageUnreadCount } from '@/hooks/use-data';
import { useAuth } from '@/lib/auth-context';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'h:mm a');
  }
  return format(date, 'MMM d, h:mm a');
}

function formatDateDivider(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'EEEE, MMMM d');
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversation,
    messages,
    isLoading: loading,
    refresh: refreshMessages,
  } = useMessages(conversationId, {
    refreshInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Mark conversation as read when viewing
  useEffect(() => {
    if (conversationId) {
      fetch(`/api/messages/${conversationId}/read`, { method: 'POST' })
        .then(() => {
          revalidateConversations();
          revalidateMessageUnreadCount();
        })
        .catch(console.error);
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        setNewMessage('');
        refreshMessages();
        revalidateConversations();
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, [conversationId, newMessage, sending, refreshMessages]);

  const handleLeaveConversation = useCallback(async () => {
    if (!user || !conversation?.isGroup) return;

    try {
      const response = await fetch(
        `/api/messages/${conversationId}/participants?userId=${user.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        revalidateConversations();
        router.push('/messages');
      }
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  }, [conversationId, user, conversation?.isGroup, router]);

  // Get display name for conversation
  const displayName = useMemo(() => {
    if (!conversation) return '';
    if (conversation.isGroup && conversation.name) {
      return conversation.name;
    }
    const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
    return otherParticipant?.user.name || 'Unknown';
  }, [conversation, user?.id]);

  // Get profile image for 1:1 conversations
  const profileImage = useMemo(() => {
    if (!conversation || conversation.isGroup) return null;
    const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
    return otherParticipant?.user.profileImage || null;
  }, [conversation, user?.id]);

  // Group messages by date for dividers
  const messagesWithDividers = useMemo(() => {
    const result: { type: 'divider' | 'message'; date?: Date; message?: DirectMessage }[] = [];
    let lastDate: Date | null = null;

    for (const message of messages) {
      const messageDate = new Date(message.createdAt);
      if (!lastDate || !isSameDay(lastDate, messageDate)) {
        result.push({ type: 'divider', date: messageDate });
        lastDate = messageDate;
      }
      result.push({ type: 'message', message });
    }

    return result;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <p className="text-gray-600 mb-4">Conversation not found</p>
        <Button
          onClick={() => router.push('/messages')}
          variant="outline"
          className="border-[#A8C5A8] text-[#A8C5A8]"
        >
          Back to Messages
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/messages')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          {conversation.isGroup ? (
            <div className="w-10 h-10 rounded-full bg-[#A8C5A8]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#A8C5A8]" />
            </div>
          ) : (
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={profileImage || undefined} alt={displayName} />
              <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{displayName}</h1>
            {conversation.isGroup && (
              <p className="text-xs text-gray-500">
                {conversation.participants.length} members
              </p>
            )}
          </div>
        </div>

        {conversation.isGroup && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleLeaveConversation}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#A8C5A8]/20 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-[#A8C5A8]" />
            </div>
            <p className="text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messagesWithDividers.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
                      {formatDateDivider(item.date!)}
                    </div>
                  </div>
                );
              }

              const message = item.message!;
              const isOwnMessage = message.senderId === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage
                          src={message.sender.profileImage || undefined}
                          alt={message.sender.name}
                        />
                        <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-xs">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {!isOwnMessage && conversation.isGroup && (
                        <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender.name}</p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-[#A8C5A8] text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <p
                        className={`text-xs text-gray-400 mt-1 ${
                          isOwnMessage ? 'text-right mr-1' : 'ml-1'
                        }`}
                      >
                        {formatMessageDate(new Date(message.createdAt))}
                        {message.editedAt && ' (edited)'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border-[#A8C5A8]/30 focus:border-[#A8C5A8] focus:ring-[#A8C5A8]"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-[#A8C5A8] hover:bg-[#97B897] text-white px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

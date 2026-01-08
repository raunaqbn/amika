'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, Loader2, Sparkles, Circle } from 'lucide-react';

interface Message {
  id: string;
  tripId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  createdAt: Date;
  senderName?: string;
  senderImage?: string;
}

interface Collaborator {
  id: string;
  tripId: string;
  friendId: string;
  userId: string | null;
  role: string;
  joinedAt: Date;
  friendName: string;
  profileImage: string | null;
  linkedUserId: string | null;
}

interface CurrentUser {
  id: string;
  name: string;
  profileImage: string | null;
}

interface TypingUser {
  id: string;
  name: string;
}

interface ActiveUser {
  id: string;
  name: string;
  profileImage: string | null;
  lastSeen: Date;
}

interface TripChatProps {
  tripId: string;
  context: string;
  messages: Message[];
  currentUser: CurrentUser;
  collaborators: Collaborator[];
  tripOwnerId: string;
  onNewMessage?: (message: Message) => void;
  typingUsers?: TypingUser[];
  activeUsers?: ActiveUser[];
}

export function TripChat({
  tripId,
  context,
  messages,
  currentUser,
  collaborators,
  tripOwnerId,
  onNewMessage,
  typingUsers = [],
  activeUsers = [],
}: TripChatProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevLastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only scroll when a NEW message is actually added, not on every render
    // This prevents scrolling when polls are updated (which refreshes data but doesn't add messages)
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id || null;
    const messageCount = messages.length;

    const hasNewMessage = messageCount > prevMessageCountRef.current ||
                          (lastMessageId !== prevLastMessageIdRef.current && lastMessageId !== null);

    if (hasNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    prevMessageCountRef.current = messageCount;
    prevLastMessageIdRef.current = lastMessageId;
  }, [messages]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (typing: boolean) => {
    try {
      await fetch(`/api/trips/${tripId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typing, context }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [tripId, context]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    sendTypingIndicator(false);

    setSending(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input.trim(),
          context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInput('');
        if (onNewMessage && data.userMessage) {
          onNewMessage(data.userMessage);
        }
        if (onNewMessage && data.aiMessage) {
          onNewMessage(data.aiMessage);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get sender info for a message
  const getSenderInfo = (msg: Message) => {
    // AI assistant message
    if (msg.role === 'assistant') {
      return {
        name: 'Amika',
        image: null,
        isCurrentUser: false,
        isAssistant: true,
      };
    }

    // Current user's message
    if (msg.userId === currentUser.id) {
      return {
        name: currentUser.name,
        image: currentUser.profileImage,
        isCurrentUser: true,
        isAssistant: false,
      };
    }

    // Trip owner's message (if not current user)
    if (msg.userId === tripOwnerId && tripOwnerId !== currentUser.id) {
      // Find owner info from collaborators or use default
      const ownerCollab = collaborators.find(c => c.linkedUserId === tripOwnerId || c.userId === tripOwnerId);
      return {
        name: ownerCollab?.friendName || 'Trip Owner',
        image: ownerCollab?.profileImage || null,
        isCurrentUser: false,
        isAssistant: false,
      };
    }

    // Other collaborator's message
    const collaborator = collaborators.find(
      c => c.linkedUserId === msg.userId || c.userId === msg.userId
    );

    if (collaborator) {
      return {
        name: collaborator.friendName,
        image: collaborator.profileImage,
        isCurrentUser: false,
        isAssistant: false,
      };
    }

    // Fallback
    return {
      name: msg.senderName || 'User',
      image: msg.senderImage || null,
      isCurrentUser: false,
      isAssistant: false,
    };
  };

  // Filter out current user from typing users
  const othersTyping = typingUsers.filter(u => u.id !== currentUser.id);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-medium text-sm">Discussion</h4>
        {/* Active users indicator */}
        {activeUsers.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {activeUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="relative">
                  <Avatar className="h-5 w-5 border border-white">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback className="text-[8px] bg-gray-200">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="absolute -bottom-0.5 -right-0.5 w-2 h-2 fill-green-500 text-green-500" />
                </div>
              ))}
            </div>
            {activeUsers.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{activeUsers.length - 3}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-1">active</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="max-h-[500px] overflow-y-auto mb-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet. Start the discussion!
            <br />
            <span className="text-xs">Mention @amika for AI suggestions</span>
          </p>
        ) : (
          messages.map((msg) => {
            const sender = getSenderInfo(msg);

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  sender.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  {sender.isAssistant ? (
                    <AvatarFallback className="bg-[#A8C5A8] text-white">
                      <Sparkles className="w-3 h-3" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={sender.image || undefined} />
                      <AvatarFallback
                        className={`text-white text-xs ${
                          sender.isCurrentUser ? 'bg-[#7BA4C7]' : 'bg-[#D4A5A5]'
                        }`}
                      >
                        {sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`flex-1 min-w-0 max-w-[80%] ${
                    sender.isCurrentUser ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block rounded-lg p-2 ${
                      sender.isAssistant
                        ? 'bg-[#A8C5A8]/10 text-left'
                        : sender.isCurrentUser
                        ? 'bg-[#7BA4C7]/10'
                        : 'bg-gray-100'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-0.5 ${
                      sender.isCurrentUser ? 'text-[#7BA4C7]' : sender.isAssistant ? 'text-[#A8C5A8]' : 'text-gray-700'
                    }`}>
                      {sender.isCurrentUser ? 'You' : sender.name}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words text-left">
                      {msg.content}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {othersTyping.length > 0 && (
          <div className="flex gap-2 items-center">
            <div className="flex -space-x-1">
              {othersTyping.slice(0, 2).map((user) => (
                <Avatar key={user.id} className="h-5 w-5 border border-white">
                  <AvatarFallback className="text-[8px] bg-[#D4A5A5] text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-1">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-muted-foreground ml-1">
                {othersTyping.length === 1
                  ? `${othersTyping[0].name} is typing...`
                  : `${othersTyping.length} people typing...`}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (mention @amika for AI help)"
          rows={1}
          className="resize-none"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          size="sm"
          className="bg-[#A8C5A8] hover:bg-[#97b497]"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}

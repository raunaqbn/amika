'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, Loader2, Sparkles, Circle } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
}

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
  context?: string;
  messages: Message[];
  currentUser: CurrentUser;
  collaborators: Collaborator[];
  tripOwnerId: string;
  tripOwnerName?: string | null;
  tripOwnerProfileImage?: string | null;
  onNewMessage?: (message: Message) => void;
  typingUsers?: TypingUser[];
  activeUsers?: ActiveUser[];
  friends?: Friend[];
}

// Component to render text with highlighted @mentions
function HighlightMentions({ text, isUser, mentionNames }: { text: string; isUser: boolean; mentionNames: string[] }) {
  const allNames = ['amika', ...mentionNames];
  if (allNames.length === 0) return <>{text}</>;

  const escapedNames = allNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(@(?:${escapedNames.join('|')}))(?=\\s|$|[.,!?])`, 'gi');

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isAmikaMention = part.toLowerCase() === '@amika';
        const isMention = part.startsWith('@') && mentionNames.some(
          name => part.toLowerCase() === `@${name.toLowerCase()}`
        );

        if (isAmikaMention) {
          return (
            <span
              key={index}
              className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-medium text-xs ${
                isUser
                  ? 'bg-white/30 text-white'
                  : 'bg-[#A8C5A8]/20 text-[#A8C5A8]'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {part}
            </span>
          );
        }

        if (isMention) {
          return (
            <span
              key={index}
              className={`px-1 py-0.5 rounded font-medium text-xs ${
                isUser
                  ? 'bg-white/40 text-[#3d5c6e]'
                  : 'bg-[#D4A5A5]/20 text-[#D4A5A5]'
              }`}
            >
              {part}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function TripChat({
  tripId,
  context = 'general',
  messages,
  currentUser,
  collaborators,
  tripOwnerId,
  tripOwnerName,
  tripOwnerProfileImage,
  onNewMessage,
  typingUsers = [],
  activeUsers = [],
  friends = [],
}: TripChatProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Get all mentionable names (collaborators + friends)
  const allMentionableNames = useMemo(() => {
    const names = new Set<string>();
    // Add collaborator names
    collaborators.forEach(c => names.add(c.friendName));
    // Add friend names
    friends.forEach(f => names.add(f.name));
    return Array.from(names);
  }, [collaborators, friends]);

  // Amika as a special mention option
  const amikaOption = { id: 'amika', name: 'amika', isAmika: true, profileImage: null };

  // Combined list of mention options
  const mentionOptions = useMemo(() => {
    const search = mentionSearch.toLowerCase();

    // Filter collaborators by search
    const filteredCollaborators = collaborators.filter(c =>
      !mentionSearch || c.friendName.toLowerCase().includes(search)
    );

    // Filter friends by search (exclude those already in collaborators)
    const collaboratorNames = new Set(collaborators.map(c => c.friendName.toLowerCase()));
    const filteredFriends = friends.filter(f =>
      (!mentionSearch || f.name.toLowerCase().includes(search)) &&
      !collaboratorNames.has(f.name.toLowerCase())
    );

    // Check if 'amika' matches the search
    const amikaMatches = !mentionSearch || 'amika'.includes(search);

    return [
      ...(amikaMatches ? [amikaOption] : []),
      ...filteredCollaborators.map(c => ({
        id: c.friendId,
        name: c.friendName,
        isAmika: false,
        profileImage: c.profileImage,
      })),
      ...filteredFriends.map(f => ({
        id: f.id,
        name: f.name,
        isAmika: false,
        profileImage: null,
      })),
    ];
  }, [collaborators, friends, mentionSearch]);

  const handleMentionSelect = (optionName: string) => {
    const beforeMention = input.slice(0, mentionPosition);
    const afterMention = input.slice(mentionPosition + mentionSearch.length);
    const newValue = beforeMention + optionName + ' ' + afterMention;

    setInput(newValue);
    setShowMentions(false);
    setMentionSearch('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

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

  // Handle input change with typing indicator and mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setInput(value);

    if (!isTyping && value.trim()) {
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

    // Check for @ mentions
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === cursorPosition - 1) {
      // @ just typed
      setShowMentions(true);
      setMentionPosition(lastAtIndex + 1);
      setMentionSearch('');
      setSelectedMentionIndex(0);
    } else if (lastAtIndex !== -1) {
      // Check if we're still in a mention
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!/\s/.test(textAfterAt)) {
        // No space after @, still in mention
        setShowMentions(true);
        setMentionPosition(lastAtIndex + 1);
        setMentionSearch(textAfterAt);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Extract tagged friend IDs from the message
  const extractTaggedFriendIds = (text: string): string[] => {
    const taggedIds: string[] = [];
    // Check collaborators
    for (const c of collaborators) {
      const pattern = new RegExp(`@${c.friendName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|[.,!?])`, 'i');
      if (pattern.test(text)) {
        taggedIds.push(c.friendId);
      }
    }
    // Check friends
    for (const f of friends) {
      const pattern = new RegExp(`@${f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|[.,!?])`, 'i');
      if (pattern.test(text) && !taggedIds.includes(f.id)) {
        taggedIds.push(f.id);
      }
    }
    return taggedIds;
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    sendTypingIndicator(false);

    // Extract tagged friend IDs
    const taggedFriendIds = extractTaggedFriendIds(input);

    // Check if @amika is mentioned
    const mentionsAmika = /@amika(?=\s|$|[.,!?])/i.test(input);

    // Build chat transcript if @amika is tagged
    const chatTranscript = mentionsAmika ? messages.map(m => ({
      role: m.role,
      content: m.content,
    })) : undefined;

    setSending(true);
    setShowMentions(false);
    try {
      const response = await fetch(`/api/trips/${tripId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input.trim(),
          context,
          taggedFriendIds,
          chatTranscript,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle escape to close mentions dropdown
    if (showMentions && e.key === 'Escape') {
      e.preventDefault();
      setShowMentions(false);
      return;
    }

    // Handle navigation and selection when mentions are shown
    if (showMentions && mentionOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < mentionOptions.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedOption = mentionOptions[selectedMentionIndex];
        if (selectedOption) {
          handleMentionSelect(selectedOption.name);
        }
        return;
      }
    }

    // Handle Enter to send message (when not selecting a mention)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setShowMentions(false);
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
      const ownerDisplayName = ownerCollab?.friendName || tripOwnerName || 'Trip Owner';
      return {
        name: `${ownerDisplayName} (Trip Owner)`,
        image: tripOwnerProfileImage || ownerCollab?.profileImage || null,
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
    <Card className="p-4 flex flex-col h-full min-h-[500px] max-h-[600px] lg:min-h-[600px] lg:max-h-[calc(100vh-180px)]">
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
      <div className="flex-1 overflow-y-auto mb-3 space-y-3 min-h-0">
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
                      <HighlightMentions
                        text={msg.content}
                        isUser={sender.isCurrentUser}
                        mentionNames={allMentionableNames}
                      />
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
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @amika or @friend name)"
            rows={1}
            className="resize-none"
            disabled={sending}
          />
          {/* Mentions dropdown */}
          {showMentions && (
            <div className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-white border border-[#A8C5A8]/30 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
              {mentionOptions.length > 0 ? (
                mentionOptions.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleMentionSelect(option.name)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#A8C5A8]/10 transition-colors flex items-center gap-2 ${
                      index === selectedMentionIndex ? 'bg-[#A8C5A8]/20' : ''
                    }`}
                  >
                    {option.isAmika ? (
                      <>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#A8C5A8]/20">
                          <Sparkles className="w-3 h-3 text-[#A8C5A8]" />
                        </span>
                        <span className="font-medium text-[#A8C5A8] text-sm">amika</span>
                        <span className="text-xs text-gray-400">AI</span>
                      </>
                    ) : (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={option.profileImage || undefined} />
                          <AvatarFallback className="text-[8px] bg-[#D4A5A5]/20 text-[#D4A5A5]">
                            {option.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900 text-sm">{option.name}</span>
                      </>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500">
                  No matches for &quot;{mentionSearch}&quot;
                </div>
              )}
            </div>
          )}
        </div>
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

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, Loader2, Sparkles, Circle, Calendar, MapPin, Star, ExternalLink, Ticket, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import React from 'react';
import { EmojiPickerButton } from '../ui/emoji-picker';

interface Message {
  id: string;
  eventPlanId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  toolResults?: string | null;
  createdAt: Date;
  senderName?: string;
  senderImage?: string;
}

interface Collaborator {
  id: string;
  eventPlanId: string;
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

interface EventPlanChatProps {
  eventPlanId: string;
  context?: string;
  messages: Message[];
  currentUser: CurrentUser;
  collaborators: Collaborator[];
  eventPlanOwnerId: string;
  onNewMessage?: (message: Message) => void;
  typingUsers?: TypingUser[];
  activeUsers?: ActiveUser[];
}

// Component to render text with highlighted @mentions
function HighlightMentions({ text, isAssistant }: { text: string; isAssistant: boolean }) {
  const pattern = /@amika/gi;
  const parts = text.split(pattern);
  const matches = text.match(pattern) || [];

  if (matches.length === 0) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < matches.length && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium ${
                isAssistant
                  ? 'bg-[#A8C5A8]/20 text-[#A8C5A8]'
                  : 'bg-[#1877F2]/20 text-[#1877F2]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {matches[index]}
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

// Component to render tool results as cards
function ToolResultCards({ toolResultsJson }: { toolResultsJson: string }) {
  let toolResults: any[] = [];
  try {
    toolResults = JSON.parse(toolResultsJson);
  } catch {
    return null;
  }

  if (!toolResults || toolResults.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {toolResults.map((tool, idx) => {
        const result = tool.result;

        // Render events
        if (tool.toolName === 'searchEvents' && result?.events?.length > 0) {
          return (
            <div key={idx} className="space-y-2">
              {result.events.slice(0, 5).map((event: any, i: number) => (
                <Card key={i} className="p-3 bg-white border-[#D4A5A5]/30 hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">{event.title}</h4>
                      {event.date && (
                        <p className="text-xs text-[#D4A5A5] flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" />
                          {event.date}
                        </p>
                      )}
                      {(event.address || event.location) && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" />
                          {event.address || event.location}
                        </p>
                      )}
                      {event.venue && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3" />
                          {event.venue}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{event.description}</p>
                      )}
                      {event.link && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#A8C5A8] hover:underline mt-2"
                        >
                          <Ticket className="w-3 h-3" />
                          Get Tickets
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        }

        // Render movies
        if (tool.toolName === 'searchMovies' && result?.movies?.length > 0) {
          return (
            <div key={idx} className="space-y-2">
              {result.movies.slice(0, 5).map((movie: any, i: number) => (
                <Card key={i} className="p-3 bg-white border-[#D4A5A5]/30 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">{movie.name}</h4>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    {movie.duration && <span>{movie.duration}</span>}
                    {movie.genre && <span>• {movie.genre}</span>}
                    {movie.rating && <span>• {movie.rating}</span>}
                  </div>
                  {movie.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{movie.description}</p>
                  )}
                  {movie.theaters?.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {movie.theaters.slice(0, 2).map((theater: any, j: number) => (
                        <div key={j} className="text-xs bg-gray-50 p-2 rounded">
                          <p className="font-medium text-gray-700">{theater.name}</p>
                          {theater.showtimes?.length > 0 && (
                            <p className="text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {theater.showtimes.slice(0, 4).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          );
        }

        // Render places
        if (tool.toolName === 'searchPlaces' && result?.places?.length > 0) {
          return (
            <div key={idx} className="space-y-2">
              {result.places.slice(0, 5).map((place: any, i: number) => (
                <Card key={i} className="p-3 bg-white border-[#A8C5A8]/30 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900 text-sm">{place.title || place.name}</h4>
                    {place.rating && (
                      <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {place.rating}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {place.type && <p>{place.type}</p>}
                    {place.address && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {place.address}
                      </p>
                    )}
                    {place.price && <p className="text-green-600">{place.price}</p>}
                  </div>
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#A8C5A8] hover:underline mt-2"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          );
        }

        // Render Yelp businesses (restaurants)
        if (tool.toolName === 'searchYelpReviews' && result?.businesses?.length > 0) {
          return (
            <div key={idx} className="space-y-2">
              {result.businesses.slice(0, 5).map((biz: any, i: number) => (
                <Card key={i} className="p-3 bg-white border-red-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900 text-sm">{biz.name}</h4>
                    {biz.rating && (
                      <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                        {biz.rating} {biz.reviews && `(${biz.reviews})`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {biz.categories && <p>{biz.categories}</p>}
                    {biz.neighborhood && <p>{biz.neighborhood}</p>}
                    {biz.price && <p className="text-green-600">{biz.price}</p>}
                    {biz.snippet && <p className="text-gray-600 mt-1 italic">&quot;{biz.snippet}&quot;</p>}
                  </div>
                  {biz.link && (
                    <a
                      href={biz.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline mt-2"
                    >
                      View on Yelp
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          );
        }

        // Render weather
        if (tool.toolName === 'getWeather' && (result?.temperature || result?.condition)) {
          return (
            <Card key={idx} className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Weather in {result.location}</h4>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-light text-blue-600">
                  {result.temperature}
                </div>
                <div className="text-xs text-gray-600">
                  <p className="font-medium">{result.condition}</p>
                  {result.description && <p>{result.description}</p>}
                  {result.feelsLike && <p>Feels like {result.feelsLike}</p>}
                </div>
              </div>
            </Card>
          );
        }

        return null;
      })}
    </div>
  );
}

// Markdown renderer component for chat messages
function MarkdownMessage({ content, isAssistant }: { content: string; isAssistant: boolean }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => {
          const processedChildren = React.Children.map(children, (child) => {
            if (typeof child === 'string') {
              return <HighlightMentions text={child} isAssistant={isAssistant} />;
            }
            return child;
          });
          return <p className="mb-2 last:mb-0">{processedChildren}</p>;
        },
        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => {
          const processedChildren = React.Children.map(children, (child) => {
            if (typeof child === 'string') {
              return <HighlightMentions text={child} isAssistant={isAssistant} />;
            }
            return child;
          });
          return <li className="text-sm">{processedChildren}</li>;
        },
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
        code: ({ children }) => (
          <code className={`px-1 py-0.5 rounded text-xs ${isAssistant ? 'bg-[#A8C5A8]/10' : 'bg-gray-200'}`}>
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className={`p-2 rounded text-xs overflow-x-auto my-2 ${isAssistant ? 'bg-[#A8C5A8]/10' : 'bg-gray-200'}`}>
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a href={href} className="underline text-[#7BA4C7]" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 pl-2 my-2 border-gray-300 italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function EventPlanChat({
  eventPlanId,
  context = 'general',
  messages,
  currentUser,
  collaborators,
  eventPlanOwnerId,
  onNewMessage,
  typingUsers = [],
  activeUsers = [],
}: EventPlanChatProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevLastMessageIdRef = useRef<string | null>(null);

  // Build mention options: amika + collaborators
  const mentionOptions = [
    { id: 'amika', name: 'amika', type: 'ai' as const },
    ...collaborators.map(c => ({ id: c.friendId, name: c.friendName, type: 'collaborator' as const })),
  ];

  // Filter mentions based on query
  const filteredMentions = mentionOptions.filter(m =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
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
      await fetch(`/api/event-plans/${eventPlanId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: typing, context }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [eventPlanId, context]);

  // Handle input change with typing indicator and mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setInput(value);

    // Detect @ mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @ (user is still typing the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  // Handle selecting a mention from the dropdown
  const handleSelectMention = (mention: { id: string; name: string; type: 'ai' | 'collaborator' }) => {
    const beforeMention = input.slice(0, mentionStartPos);
    const afterMention = input.slice(textareaRef.current?.selectionStart || mentionStartPos + mentionQuery.length + 1);
    const newValue = `${beforeMention}@${mention.name} ${afterMention}`;
    setInput(newValue);
    setShowMentions(false);
    setMentionQuery('');

    // Focus back on textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = mentionStartPos + mention.name.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    sendTypingIndicator(false);

    setSending(true);
    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}/messages`, {
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
    // Handle mention dropdown navigation
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(filteredMentions[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle emoji selection - insert at cursor position
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInput(input + emoji);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newValue = input.slice(0, start) + emoji + input.slice(end);

    setInput(newValue);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Get sender info for a message
  const getSenderInfo = (msg: Message) => {
    if (msg.role === 'assistant') {
      return {
        name: 'Amika',
        image: null,
        isCurrentUser: false,
        isAssistant: true,
      };
    }

    if (msg.userId === currentUser.id) {
      return {
        name: currentUser.name,
        image: currentUser.profileImage,
        isCurrentUser: true,
        isAssistant: false,
      };
    }

    if (msg.userId === eventPlanOwnerId && eventPlanOwnerId !== currentUser.id) {
      const ownerCollab = collaborators.find(c => c.linkedUserId === eventPlanOwnerId || c.userId === eventPlanOwnerId);
      return {
        name: ownerCollab?.friendName || 'Event Organizer',
        image: ownerCollab?.profileImage || null,
        isCurrentUser: false,
        isAssistant: false,
      };
    }

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

    return {
      name: msg.senderName || 'User',
      image: msg.senderImage || null,
      isCurrentUser: false,
      isAssistant: false,
    };
  };

  const othersTyping = typingUsers.filter(u => u.id !== currentUser.id);

  return (
    <Card className="p-4 flex flex-col h-full min-h-[500px] max-h-[600px] lg:min-h-[600px] lg:max-h-[calc(100vh-180px)]">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-medium text-sm">Discussion</h4>
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
                    <div className="text-sm break-words text-left prose prose-sm max-w-none">
                      <MarkdownMessage content={msg.content} isAssistant={sender.isAssistant} />
                    </div>
                    {/* Render tool results as cards for assistant messages */}
                    {sender.isAssistant && msg.toolResults && (
                      <ToolResultCards toolResultsJson={msg.toolResults} />
                    )}
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
      <div className="relative">
        {/* Mention dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredMentions.map((mention, idx) => (
              <button
                key={mention.id}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                  idx === mentionIndex ? 'bg-gray-100' : ''
                }`}
                onClick={() => handleSelectMention(mention)}
                onMouseEnter={() => setMentionIndex(idx)}
              >
                <Avatar className="h-6 w-6">
                  {mention.type === 'ai' ? (
                    <AvatarFallback className="bg-[#A8C5A8] text-white text-xs">
                      <Sparkles className="w-3 h-3" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                      {mention.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900">@{mention.name}</span>
                  {mention.type === 'ai' && (
                    <span className="ml-2 text-xs text-[#A8C5A8]">AI Assistant</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @amika for AI help)"
            rows={1}
            className="resize-none"
            disabled={sending}
          />
          <EmojiPickerButton
            onEmojiSelect={handleEmojiSelect}
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
      </div>
    </Card>
  );
}

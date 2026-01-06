'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Send, MapPin, Calendar, Users, Video, Sparkles, Plus, ExternalLink, Star, Clock, Ticket, X, UserPlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Friend {
  id: string;
  name: string;
  notes?: string | null;
}

interface FindEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
  onEventCreated?: () => void;
}

// Quick suggestions for event types
const quickSuggestions = [
  { label: 'Local Events', icon: MapPin, query: 'What are some fun local events happening this month?' },
  { label: 'Virtual Hangouts', icon: Video, query: 'Suggest some fun virtual activities to do with a remote friend' },
  { label: 'Outdoor Activities', icon: Users, query: 'What outdoor activities would be fun to do with a friend?' },
  { label: 'Unique Experiences', icon: Sparkles, query: 'Suggest some unique or creative experiences to share with a friend' },
];

export function FindEventsDialog({
  open,
  onOpenChange,
  friends,
  onEventCreated,
}: FindEventsDialogProps) {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [selectedEventFriendIds, setSelectedEventFriendIds] = useState<string[]>([]);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Friend selection for event planning
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [showFriendSelector, setShowFriendSelector] = useState(true);

  // Get selected friends' details for context
  const selectedFriends = friends.filter(f => selectedFriendIds.includes(f.id));

  // Build friend context for the AI
  const friendContext = selectedFriends.length > 0
    ? selectedFriends.map(f => {
        let context = f.name;
        if (f.notes) {
          context += `: ${f.notes}`;
        }
        return context;
      }).join('\n')
    : '';

  const getWelcomeMessage = () => {
    if (selectedFriends.length === 0) {
      return "Hi! I'm here to help you find fun activities to do with your friends. Select some friends above to get personalized suggestions based on their interests, or just ask about **local events**, **virtual hangouts**, or anything else!";
    }
    const names = selectedFriends.map(f => f.name).join(', ');
    return `Great! You're planning activities with **${names}**. I'll suggest activities based on their interests. What kind of activities are you looking for? Try **local events**, **restaurants**, **outdoor activities**, or ask me anything!`;
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    setMessages,
    setInput,
  } = useChat({
    api: '/api/chat',
    body: {
      friendContext: friendContext,
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(),
      },
    ],
  });

  // Update welcome message when friends change
  useEffect(() => {
    if (open && messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: getWelcomeMessage(),
        },
      ]);
    }
  }, [selectedFriendIds]);

  // Reset chat when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFriendIds([]);
      setShowFriendSelector(true);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm here to help you find fun activities to do with your friends. Select some friends above to get personalized suggestions based on their interests, or just ask about **local events**, **virtual hangouts**, or anything else!",
        },
      ]);
      setShowCreateEvent(false);
    }
  }, [open, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleQuickSuggestion = (query: string) => {
    // If friends are selected, personalize the query
    let personalizedQuery = query;
    if (selectedFriends.length > 0) {
      const names = selectedFriends.map(f => f.name).join(' and ');
      personalizedQuery = query.replace('a friend', names).replace('friends', names);
    }

    setInput(personalizedQuery);
    setTimeout(() => {
      const form = document.getElementById('find-events-form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  // Custom submit that includes friend context
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add friend context to the message if friends are selected
    let messageWithContext = input;
    if (selectedFriends.length > 0 && !input.toLowerCase().includes('friend')) {
      const names = selectedFriends.map(f => f.name).join(' and ');
      // The AI will use the body.friendContext for detailed info
    }

    originalHandleSubmit(e);
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate || selectedEventFriendIds.length === 0) return;

    setCreatingEvent(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle.trim(),
          eventDate: new Date(eventDate).toISOString(),
          location: eventLocation.trim() || null,
          friendId: selectedEventFriendIds[0],
          friendIds: selectedEventFriendIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      setShowCreateEvent(false);
      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      setSelectedEventFriendIds([]);
      onEventCreated?.();

      const friendNames = selectedEventFriendIds
        .map(id => friends.find(f => f.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      setMessages([
        ...messages,
        {
          id: `event-created-${Date.now()}`,
          role: 'assistant',
          content: `Great! I've created the event "${eventTitle}" with ${friendNames}. Would you like to find more activities?`,
        },
      ]);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleEventFriendToggle = (friendId: string) => {
    setSelectedEventFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4A5A5]" />
            Find Fun Events
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Friend Selector */}
          {showFriendSelector && friends.length > 0 && (
            <div className="mb-4 p-3 bg-[#A8C5A8]/5 rounded-lg border border-[#A8C5A8]/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#A8C5A8]" />
                  <span className="text-sm font-medium text-gray-700">Who are you planning with?</span>
                </div>
                {selectedFriends.length > 0 && (
                  <button
                    onClick={() => setSelectedFriendIds([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleFriendToggle(friend.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#A8C5A8] text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-[#A8C5A8]/50'
                      }`}
                    >
                      {friend.name}
                      {isSelected && <X className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
              {selectedFriends.length > 0 && selectedFriends.some(f => f.notes) && (
                <p className="text-xs text-gray-500 mt-2">
                  Suggestions will be based on their interests and notes.
                </p>
              )}
            </div>
          )}

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleQuickSuggestion(suggestion.query)}
                  className="flex items-center gap-2 p-3 text-left text-sm rounded-lg border border-[#A8C5A8]/30 hover:border-[#A8C5A8]/60 hover:bg-[#A8C5A8]/5 transition-colors"
                >
                  <suggestion.icon className="w-4 h-4 text-[#A8C5A8]" />
                  <span className="text-gray-700">{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-[#A8C5A8] text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Render tool invocations as cards */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {message.toolInvocations.map((tool: any, idx: number) => {
                        if (tool.state !== 'result') return null;
                        const result = tool.result;

                        // Render events
                        if (tool.toolName === 'searchEvents' && result?.events?.length > 0) {
                          return (
                            <div key={idx} className="space-y-2">
                              {result.events.map((event: any, i: number) => (
                                <Card key={i} className="p-3 bg-white border-[#D4A5A5]/30 hover:shadow-md transition-shadow">
                                  <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                                      {event.date && (
                                        <p className="text-xs text-[#D4A5A5] flex items-center gap-1 mb-1">
                                          <Calendar className="w-3 h-3" />
                                          {event.date}
                                        </p>
                                      )}
                                      {event.location && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                          <MapPin className="w-3 h-3" />
                                          {event.location}
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
                              {result.movies.map((movie: any, i: number) => (
                                <Card key={i} className="p-3 bg-white border-[#D4A5A5]/30 hover:shadow-md transition-shadow">
                                  <h4 className="font-semibold text-gray-900 mb-1">{movie.name}</h4>
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                                    {movie.duration && <span>{movie.duration}</span>}
                                    {movie.genre && <span>• {movie.genre}</span>}
                                    {movie.rating && <span>• {movie.rating}</span>}
                                  </div>
                                  {movie.description && (
                                    <p className="text-xs text-gray-600 mb-2">{movie.description}</p>
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
                              {result.places.map((place: any, i: number) => (
                                <Card key={i} className="p-3 bg-white border-[#A8C5A8]/30 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-900">{place.name}</h4>
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

                        // Render Yelp businesses
                        if (tool.toolName === 'searchYelpReviews' && result?.businesses?.length > 0) {
                          return (
                            <div key={idx} className="space-y-2">
                              {result.businesses.map((biz: any, i: number) => (
                                <Card key={i} className="p-3 bg-white border-red-100 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-900">{biz.name}</h4>
                                    {biz.rating && (
                                      <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                                        {biz.rating} ({biz.reviews})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                                    {biz.categories && <p>{biz.categories}</p>}
                                    {biz.neighborhood && <p>{biz.neighborhood}</p>}
                                    {biz.price && <p className="text-green-600">{biz.price}</p>}
                                    {biz.snippet && <p className="text-gray-600 mt-1 italic">"{biz.snippet}"</p>}
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
                        if (tool.toolName === 'getWeather' && result?.current) {
                          return (
                            <Card key={idx} className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100">
                              <h4 className="font-semibold text-gray-900 mb-2">Weather in {result.location}</h4>
                              <div className="flex items-center gap-4">
                                <div className="text-3xl font-light text-blue-600">
                                  {result.current.temperature}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p className="font-medium">{result.current.condition}</p>
                                  <p className="text-xs">{result.current.description}</p>
                                  <p className="text-xs">Feels like {result.current.feelsLike}</p>
                                </div>
                              </div>
                              {result.forecast?.length > 0 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto">
                                  {result.forecast.map((day: any, j: number) => (
                                    <div key={j} className="text-xs text-center px-2 py-1 bg-white rounded min-w-[60px]">
                                      <p className="font-medium">{day.date.split(',')[0]}</p>
                                      <p className="text-blue-600">{day.temperature}</p>
                                      <p className="text-gray-500 text-[10px]">{day.condition}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}

                  {/* Render text content */}
                  {message.content && (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A8C5A8] hover:underline inline-flex items-center gap-1"
                          >
                            {children}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Create event panel */}
          {showCreateEvent && (
            <Card className="p-4 mt-4 border-[#A8C5A8]/30 bg-[#A8C5A8]/5">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#A8C5A8]" />
                Quick Create Event
              </h4>
              <div className="space-y-3">
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Event title"
                />
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Select friends</label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-white min-h-[40px]">
                    {friends.map((friend) => {
                      const isSelected = selectedEventFriendIds.includes(friend.id);
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => handleEventFriendToggle(friend.id)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#A8C5A8] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {friend.name}
                          {isSelected && <span className="ml-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
                <Input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Location (optional)"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateEvent(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateEvent}
                    disabled={creatingEvent || !eventTitle.trim() || !eventDate || selectedEventFriendIds.length === 0}
                    className="flex-1 bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                  >
                    {creatingEvent ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Input form */}
          <form
            id="find-events-form"
            onSubmit={handleSubmit}
            className="flex gap-2 mt-4 pt-4 border-t"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={selectedFriends.length > 0
                ? `Find activities for ${selectedFriends.map(f => f.name).join(' & ')}...`
                : "Ask about events or activities..."
              }
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateEvent(!showCreateEvent)}
              className="border-[#A8C5A8]/60 text-[#A8C5A8]"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

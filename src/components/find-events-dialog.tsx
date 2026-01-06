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
import { Send, MapPin, Calendar, Users, Video, Sparkles, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface FindEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: { id: string; name: string }[];
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
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    setInput,
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm here to help you find fun activities to do with your friends. Are you looking for **local events**, **virtual hangouts**, or something else? You can also ask about specific interests like concerts, outdoor activities, or creative experiences!",
      },
    ],
  });

  // Reset chat when dialog opens
  useEffect(() => {
    if (open) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm here to help you find fun activities to do with your friends. Are you looking for **local events**, **virtual hangouts**, or something else? You can also ask about specific interests like concerts, outdoor activities, or creative experiences!",
        },
      ]);
      setShowCreateEvent(false);
    }
  }, [open, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickSuggestion = (query: string) => {
    setInput(query);
    // Submit after a small delay to allow input to update
    setTimeout(() => {
      const form = document.getElementById('find-events-form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !selectedFriendId) return;

    setCreatingEvent(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle.trim(),
          eventDate: new Date(eventDate).toISOString(),
          location: eventLocation.trim() || null,
          friendId: selectedFriendId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      setShowCreateEvent(false);
      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      setSelectedFriendId('');
      onEventCreated?.();

      // Add a confirmation message
      setMessages([
        ...messages,
        {
          id: `event-created-${Date.now()}`,
          role: 'assistant',
          content: `Great! I've created the event "${eventTitle}" for you. Would you like to find more activities?`,
        },
      ]);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setCreatingEvent(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4A5A5]" />
            Find Fun Events
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
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
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px] max-h-[300px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-[#A8C5A8] text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
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
                <select
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A8C5A8] focus:border-transparent"
                >
                  <option value="">Select a friend...</option>
                  {friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>
                      {friend.name}
                    </option>
                  ))}
                </select>
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
                    disabled={creatingEvent || !eventTitle.trim() || !eventDate || !selectedFriendId}
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
              placeholder="Ask about events or activities..."
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

'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export function ChatInterface() {
  const [initialMessages] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('mirror-chat-messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages,
    onResponse: (response) => {
      setErrorMessage(null);
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
    },
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      console.error('Error details:', error.message, error.stack);

      try {
        const parsed = JSON.parse(error.message);
        setErrorMessage(parsed.error || error.message);
        return;
      } catch {
        // not JSON, continue
      }

      if (error.message) {
        setErrorMessage(error.message);
      } else if (error.cause instanceof Error && error.cause.message) {
        setErrorMessage(error.cause.message);
      } else {
        setErrorMessage('Something went wrong while talking to Mirror. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mirror-chat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await fetch('/api/friends');
        if (!res.ok) return;
        const data = await res.json();
        setFriends(data.map((friend: any) => ({ id: friend.id, name: friend.name })));
      } catch (err) {
        console.error('Failed to load friends', err);
      }
    };

    loadFriends();
  }, []);

  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const transcriptText = messages
    .map((message) => `${message.role === 'user' ? 'You' : 'Mirror'}: ${message.content}`)
    .join('\n\n');

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const openSaveDialog = () => {
    setNoteContent(transcriptText);
    setNoteTitle('');
    setSelectedFriends([]);
    setSaveFeedback(null);
    setSaveDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    setSaveFeedback(null);

    try {
      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle.trim() || null,
          content: noteContent,
          friendIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      setSaveFeedback('Saved to Diary');
      setSaveDialogOpen(false);
    } catch (err) {
      console.error('Error saving transcript', err);
      setSaveFeedback('Unable to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
          <p className="text-sm text-gray-500">Persisted while you explore other tabs.</p>
        </div>
        <Button
          variant="outline"
          onClick={openSaveDialog}
          disabled={messages.length === 0}
          className="border-[#A8C5A8]/50 text-[#A8C5A8]"
        >
          Save to Diary
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="bg-gradient-to-br from-[#A8C5A8]/20 to-[#D4A5A5]/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Mirror
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              I&apos;m here to help you nurture your friendships. Share what&apos;s on your mind,
              and let&apos;s explore how to be a better friend together.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#A8C5A8] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
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

      {(error || errorMessage) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            Error: {errorMessage || error?.message || JSON.stringify(error)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t pt-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Share your thoughts..."
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save conversation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tag friends</label>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500">Add friends to tag them here.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {friends.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriend(friend.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#A8C5A8] focus:ring-[#A8C5A8]"
                      />
                      {friend.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="items-center justify-between">
            {saveFeedback && (
              <Badge variant="secondary" className="bg-[#A8C5A8]/10 text-[#A8C5A8]">
                {saveFeedback}
              </Badge>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSaveNote}
                disabled={savingNote || !noteContent.trim()}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                {savingNote ? 'Saving...' : 'Save note'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

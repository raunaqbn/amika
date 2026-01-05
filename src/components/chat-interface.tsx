'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [chatHistory, setChatHistory] = useState<
    { id: string; title: string; messages: Message[]; createdAt: number }[]
  >(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('mirror-chat-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
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
    onError: (chatError) => {
      console.error('Chat error:', chatError);
      console.error('Error details:', chatError.message, chatError.stack);

      try {
        const parsed = JSON.parse(chatError.message);
        setErrorMessage(parsed.error || chatError.message);
        return;
      } catch {
        // not JSON, continue
      }

      if (chatError.message) {
        setErrorMessage(chatError.message);
      } else if (chatError.cause instanceof Error && chatError.cause.message) {
        setErrorMessage(chatError.cause.message);
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
    if (typeof window === 'undefined') return;
    localStorage.setItem('mirror-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

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

  const generateId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const deriveTitle = (conversation: Message[]) => {
    const firstUser = conversation.find((msg) => msg.role === 'user');
    if (!firstUser) return 'Conversation';
    const trimmed = firstUser.content.trim();
    return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || 'Conversation';
  };

  const persistActiveSession = () => {
    if (messages.length === 0) return null;

    // Use ref for immediate access, avoiding race conditions with state updates
    let sessionId = activeSessionIdRef.current;
    if (!sessionId) {
      sessionId = generateId();
      activeSessionIdRef.current = sessionId;
    }

    const session = {
      id: sessionId,
      title: deriveTitle(messages),
      messages,
      createdAt: Date.now(),
    };

    setChatHistory((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.id === sessionId);
      if (existingIndex === -1) {
        return [session, ...prev];
      }

      const updated = [...prev];
      updated[existingIndex] = session;
      return updated;
    });

    setActiveSessionId(sessionId);
    return sessionId;
  };

  const startNewChat = () => {
    persistActiveSession();
    activeSessionIdRef.current = null;
    setActiveSessionId(null);
    setMessages([]);
    setErrorMessage(null);
  };

  const loadSession = (sessionId: string) => {
    const session = chatHistory.find((entry) => entry.id === sessionId);
    if (!session) return;

    persistActiveSession();
    activeSessionIdRef.current = session.id;
    setActiveSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (sessionId: string) => {
    setChatHistory((prev) => prev.filter((entry) => entry.id !== sessionId));

    // If deleting the active session, clear the current chat
    if (activeSessionId === sessionId || activeSessionIdRef.current === sessionId) {
      activeSessionIdRef.current = null;
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    // Use ref for consistent ID access
    const sessionId = activeSessionIdRef.current;
    if (!sessionId || messages.length === 0) return;

    setChatHistory((prev) => {
      const index = prev.findIndex((entry) => entry.id === sessionId);
      if (index === -1) return prev;

      const title = deriveTitle(messages);
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        messages,
        title,
      };
      return updated;
    });
  }, [messages]);

  const sortedHistory = useMemo(
    () => [...chatHistory].sort((a, b) => b.createdAt - a.createdAt),
    [chatHistory]
  );

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

  const filteredFriends = useMemo(() => {
    if (!mentionSearch) return friends;
    const search = mentionSearch.toLowerCase();
    return friends.filter((friend) => friend.name.toLowerCase().includes(search));
  }, [friends, mentionSearch]);

  const handleMentionSelect = (friendName: string) => {
    const beforeMention = input.slice(0, mentionPosition);
    const afterMention = input.slice(mentionPosition + mentionSearch.length);
    const newValue = beforeMention + friendName + ' ' + afterMention;

    handleInputChange({ target: { value: newValue } } as any);
    setShowMentions(false);
    setMentionSearch('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    handleInputChange(e);

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

  const handleMentionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || filteredFriends.length === 0) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev < filteredFriends.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selectedFriend = filteredFriends[selectedMentionIndex];
      if (selectedFriend) {
        handleMentionSelect(selectedFriend.name);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentions(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4">
      <aside className="md:w-64 md:max-w-xs w-full md:flex-shrink-0 border border-[#A8C5A8]/30 rounded-2xl p-4 bg-white/60 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">Chat history</h3>
            <p className="text-xs text-gray-500">Recent Mirror conversations</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-[#A8C5A8]/60 text-[#A8C5A8]"
            onClick={startNewChat}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {sortedHistory.length === 0 ? (
          <p className="text-sm text-gray-500">Start chatting to build your history.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sortedHistory.map((session) => (
              <div
                key={session.id}
                className={`group w-full text-left px-3 py-2 rounded-xl border transition-colors flex items-start gap-2 ${
                  activeSessionId === session.id
                    ? 'border-[#A8C5A8]/60 bg-[#A8C5A8]/10'
                    : 'border-transparent hover:border-[#A8C5A8]/40 hover:bg-[#A8C5A8]/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => loadSession(session.id)}
                  className="flex items-start gap-2 flex-1 min-w-0"
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 text-[#A8C5A8] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {session.title || 'Conversation'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 flex-shrink-0"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={startNewChat}
          className="mt-4 w-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
        >
          New chat
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
            <p className="text-sm text-gray-500">Persisted while you explore other tabs.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={startNewChat}
              className="border-[#A8C5A8]/60 text-[#A8C5A8]"
            >
              New chat
            </Button>
            <Button
              variant="outline"
              onClick={openSaveDialog}
              disabled={messages.length === 0}
              className="border-[#A8C5A8]/50 text-[#A8C5A8]"
            >
              Save to Diary
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-gradient-to-br from-[#A8C5A8]/20 to-[#D4A5A5]/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Mirror</h2>
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

        <form onSubmit={handleSubmit} className="border-t pt-4 relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleCustomInputChange}
                placeholder="Share your thoughts... (use @ to mention friends)"
                rows={2}
                className="flex-1 resize-none w-full"
                onKeyDown={handleMentionKeyDown}
              />
              {showMentions && filteredFriends.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white border border-[#A8C5A8]/30 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredFriends.map((friend, index) => (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleMentionSelect(friend.name)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#A8C5A8]/10 transition-colors ${
                        index === selectedMentionIndex ? 'bg-[#A8C5A8]/20' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-900">{friend.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line. Use @ to mention friends.
          </p>
        </form>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Save conversation</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
    </div>
  );
}

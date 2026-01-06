'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Send, Save } from 'lucide-react';
import { getJournalById, type GuidedJournal } from '@/lib/guided-journals';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'intro';
  content: string;
}

export default function GuidedJournalPage() {
  const router = useRouter();
  const params = useParams();
  const journalId = params.journalId as string;

  const [journal, setJournal] = useState<GuidedJournal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // @ mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load journal and friends on mount
  useEffect(() => {
    const foundJournal = getJournalById(journalId);
    if (!foundJournal) {
      router.push('/explore');
      return;
    }
    setJournal(foundJournal);
    setNoteTitle(foundJournal.title);

    // Add technique intro as first message, then first prompt
    const introMessage: Message = {
      id: crypto.randomUUID(),
      role: 'intro',
      content: foundJournal.techniqueIntro,
    };
    const firstPromptMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: foundJournal.prompts[0],
    };
    setMessages([introMessage, firstPromptMessage]);

    // Load friends
    fetch('/api/friends')
      .then(res => res.json())
      .then(data => setFriends(data.map((f: any) => ({ id: f.id, name: f.name }))))
      .catch(console.error);
  }, [journalId, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filtered friends for @ mentions
  const filteredFriends = useMemo(() => {
    if (!mentionSearch) return friends;
    const search = mentionSearch.toLowerCase();
    return friends.filter((friend) => friend.name.toLowerCase().includes(search));
  }, [friends, mentionSearch]);

  const handleMentionSelect = (friendName: string) => {
    const beforeMention = input.slice(0, mentionPosition);
    const afterMention = input.slice(mentionPosition + mentionSearch.length);
    const newValue = beforeMention + friendName + ' ' + afterMention;

    setInput(newValue);
    setShowMentions(false);
    setMentionSearch('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setInput(value);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !journal || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowMentions(false);
    setIsLoading(true);

    try {
      // Filter out intro messages for API call
      const apiMessages = [...messages, userMessage]
        .filter(m => m.role !== 'intro')
        .map(m => ({ role: m.role, content: m.content }));

      // Send to AI for response
      const response = await fetch('/api/guided-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt: journal.systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I had trouble responding. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const formatTranscript = () => {
    return messages
      .filter(m => m.role !== 'intro')
      .map(msg => `${msg.role === 'user' ? 'You' : 'Guide'}: ${msg.content}`)
      .join('\n\n');
  };

  const handleSave = async () => {
    setSavingNote(true);
    try {
      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle || journal?.title,
          content: formatTranscript(),
          friendIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setSaveDialogOpen(false);
      router.push('/diary');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  if (!journal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-4rem)] bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/explore')}
              className="text-gray-500 hover:text-gray-700 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{journal.icon}</span>
                <h1 className="text-lg font-semibold text-gray-900">{journal.title}</h1>
              </div>
              <p className="text-sm text-gray-500">{journal.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              disabled={messages.length < 3}
              className="border-[#A8C5A8]/60 text-[#A8C5A8]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#A8C5A8] text-white'
                    : message.role === 'intro'
                    ? 'bg-gradient-to-br from-[#A8C5A8]/10 to-[#D4A5A5]/10 border border-[#A8C5A8]/20 text-gray-700'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'intro' && (
                  <div className="flex items-center gap-2 mb-2 text-[#A8C5A8] font-medium text-sm">
                    <span>{journal.icon}</span>
                    <span>About this practice</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
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
      </div>

      {/* Input */}
      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts... (use @ to mention friends)"
                rows={2}
                className="resize-none w-full"
                disabled={isLoading}
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
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line. Use @ to mention friends.
          </p>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Save to Diary</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Give your reflection a title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="bg-gray-50 border rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formatTranscript().slice(0, 500)}
                  {formatTranscript().length > 500 && '...'}
                </p>
              </div>
            </div>

            {friends.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag friends</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
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
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={savingNote}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              {savingNote ? 'Saving...' : 'Save to Diary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

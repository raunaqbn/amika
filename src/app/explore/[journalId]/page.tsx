'use client';

import { useEffect, useRef, useState } from 'react';
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
import { ArrowLeft, Send, Save, X } from 'lucide-react';
import { getJournalById, type GuidedJournal } from '@/lib/guided-journals';

interface Message {
  id: string;
  role: 'user' | 'assistant';
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
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

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

    // Add first prompt as initial assistant message
    const initialMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: foundJournal.prompts[0],
    };
    setMessages([initialMessage]);

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
    setIsLoading(true);

    try {
      // Send to AI for response
      const response = await fetch('/api/guided-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemPrompt: journal.systemPrompt,
          currentPromptIndex,
          prompts: journal.prompts,
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

      // Check if we should move to next prompt
      const nextPromptIndex = currentPromptIndex + 1;
      if (nextPromptIndex >= journal.prompts.length) {
        setIsComplete(true);
      } else {
        setCurrentPromptIndex(nextPromptIndex);
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback: just use the next prompt if AI fails
      const nextPromptIndex = currentPromptIndex + 1;
      if (nextPromptIndex < journal.prompts.length) {
        const fallbackMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: journal.prompts[nextPromptIndex],
        };
        setMessages(prev => [...prev, fallbackMessage]);
        setCurrentPromptIndex(nextPromptIndex);
      } else {
        setIsComplete(true);
        const completeMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Thank you for sharing. You've completed this guided journal. Would you like to save this reflection to your diary?",
        };
        setMessages(prev => [...prev, completeMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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

  const progress = ((currentPromptIndex + 1) / journal.prompts.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
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
              disabled={messages.length < 2}
              className="border-[#A8C5A8]/60 text-[#A8C5A8]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{currentPromptIndex + 1} of {journal.prompts.length}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#A8C5A8] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
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
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
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

          {isComplete && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setSaveDialogOpen(true)}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save to Diary
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="border-t bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts..."
                rows={2}
                className="flex-1 resize-none"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

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

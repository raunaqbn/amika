'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Sparkles, Mic, Phone, Settings } from 'lucide-react';
import { useChat } from 'ai/react';
import type { Message } from 'ai';
import ReactMarkdown from 'react-markdown';

interface Friend {
  id: string;
  name: string;
}

interface NewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
  onNoteCreated?: () => void;
}

type NoteMode = 'select' | 'freeform' | 'mirror';

// Markdown renderer for chat messages
function MarkdownMessage({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} className={`underline ${isUser ? 'text-white' : 'text-[#A8C5A8]'}`} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function NewNoteDialog({ open, onOpenChange, friends, onNoteCreated }: NewNoteDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<NoteMode>('freeform');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Mirror chat state
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode('freeform');
      setTitle('');
      setContent('');
      setSelectedFriends([]);
      setMessages([]);
      setInput('');
    }
  }, [open, setMessages, setInput]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSaveFreeformNote = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          friendIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const newNote = await response.json();
      onOpenChange(false);
      onNoteCreated?.();
      // Navigate to the diary with the new note
      router.push(`/diary?id=${newNote.id}`);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMirrorChat = async () => {
    if (messages.length === 0) return;

    setSaving(true);
    try {
      // Convert chat messages to diary content
      const chatContent = messages
        .map((msg) => `${msg.role === 'user' ? 'Me' : 'Mirror'}: ${msg.content}`)
        .join('\n\n');

      const chatTitle = title.trim() || `Mirror Chat - ${new Date().toLocaleDateString()}`;

      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chatTitle,
          content: chatContent,
          friendIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const newNote = await response.json();
      onOpenChange(false);
      onNoteCreated?.();
      router.push(`/diary?id=${newNote.id}`);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleClose = () => {
    if (mode !== 'freeform' && (content.trim() || messages.length > 0)) {
      if (confirm('Discard this note?')) {
        onOpenChange(false);
      }
    } else if (mode === 'freeform' && content.trim()) {
      if (confirm('Discard this note?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (mode === 'freeform' && content.trim()) {
      if (confirm('Discard this note?')) {
        setMode('freeform');
        setContent('');
        setTitle('');
      }
    } else if (mode === 'mirror' && messages.length > 0) {
      if (confirm('Discard this chat?')) {
        setMode('freeform');
        setMessages([]);
      }
    } else {
      setMode('freeform');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {mode !== 'freeform' && (
              <button onClick={handleBack} className="p-1 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-medium text-gray-900">
              {mode === 'freeform' ? 'New entry' : mode === 'mirror' ? 'Chat with Mirror' : 'New entry'}
            </span>
          </div>
          <button className="p-1 text-gray-500 hover:text-gray-700">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on mode */}
        {mode === 'freeform' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Free-form note content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-[#5B8FB9] font-medium mb-2">What&apos;s on your mind?</p>
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write..."
                  className="min-h-[200px] border-0 p-0 resize-none focus-visible:ring-0 text-gray-700 placeholder:text-gray-400"
                />
              </div>

              {/* Audio options */}
              <div className="flex gap-4 py-2">
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <Phone className="w-5 h-5" />
                </button>
              </div>

              {/* Mirror chat option */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setMode('mirror')}
                  className="flex items-center gap-3 w-full p-3 rounded-lg border border-[#D4A5A5]/30 bg-[#D4A5A5]/5 hover:bg-[#D4A5A5]/10 transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-[#D4A5A5]" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Chat with Mirror</p>
                    <p className="text-xs text-gray-500">Talk through your thoughts with your AI coach</p>
                  </div>
                </button>
              </div>

              {/* Friend tagging */}
              {friends.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tag friends</label>
                  <div className="flex flex-wrap gap-2">
                    {friends.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => toggleFriend(friend.id)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedFriends.includes(friend.id)
                            ? 'bg-[#A8C5A8] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {friend.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={handleSaveFreeformNote}
                disabled={saving || !content.trim()}
                className="w-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                {saving ? 'Saving...' : 'Save note'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'mirror' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-[#D4A5A5] mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Hi, I&apos;m Mirror</h3>
                  <p className="text-sm text-gray-600">
                    Your relationship coach. What would you like to talk about?
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-[#A8C5A8] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <MarkdownMessage content={message.content} isUser={message.role === 'user'} />
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Friend tagging */}
            {friends.length > 0 && messages.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tag friends</label>
                <div className="flex flex-wrap gap-1">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-[#A8C5A8] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {friend.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  Send
                </Button>
              </form>

              {/* Save chat button */}
              {messages.length > 0 && (
                <Button
                  onClick={handleSaveMirrorChat}
                  disabled={saving}
                  variant="outline"
                  className="w-full mt-2 border-[#A8C5A8]/60 text-[#A8C5A8]"
                >
                  {saving ? 'Saving...' : 'Save to diary'}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

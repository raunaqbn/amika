'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
import { ArrowLeft, Sparkles, Settings, X, Image as ImageIcon } from 'lucide-react';
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

type NoteMode = 'select' | 'freeform' | 'amika-chat';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // @ mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Mirror chat state
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/chat',
    onFinish: () => {
      // Restore focus to chat input after AI finishes responding
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Restore focus even on error
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode('freeform');
      setTitle('');
      setContent('');
      setSelectedFriends([]);
      setSelectedImage(null);
      setImagePreview(null);
      setMessages([]);
      setInput('');
      setShowMentions(false);
      setMentionSearch('');
    }
  }, [open, setMessages, setInput]);

  // Filtered friends for @ mentions
  const filteredFriends = useMemo(() => {
    if (!mentionSearch) return friends;
    const search = mentionSearch.toLowerCase();
    return friends.filter((friend) => friend.name.toLowerCase().includes(search));
  }, [friends, mentionSearch]);

  // Handle @ mention selection
  const handleMentionSelect = (friendName: string) => {
    const beforeMention = input.slice(0, mentionPosition);
    const afterMention = input.slice(mentionPosition + mentionSearch.length);
    const newValue = beforeMention + friendName + ' ' + afterMention;

    handleInputChange({ target: { value: newValue } } as any);
    setShowMentions(false);
    setMentionSearch('');
    setTimeout(() => chatInputRef.current?.focus(), 0);
  };

  // Custom input change handler for @ mentions
  const handleCustomChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  // Handle keyboard navigation for mentions
  const handleMentionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle escape to close mentions dropdown
    if (showMentions && e.key === 'Escape') {
      e.preventDefault();
      setShowMentions(false);
      return;
    }

    // Handle navigation and selection when mentions are shown with friends
    if (showMentions && filteredFriends.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredFriends.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedFriend = filteredFriends[selectedMentionIndex];
        if (selectedFriend) {
          handleMentionSelect(selectedFriend.name);
        }
        return;
      }
    }
  };

  // Image compression helper
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxSize = 1920;
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const compressedFile = await compressImage(file);

      if (compressedFile.size > 4 * 1024 * 1024) {
        alert('Image is still too large after compression. Please use a smaller image.');
        return;
      }

      setSelectedImage(compressedFile);

      const imageReader = new FileReader();
      imageReader.onloadend = () => {
        setImagePreview(imageReader.result as string);
      };
      imageReader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus chat input when entering chat mode
  useEffect(() => {
    if (mode === 'amika-chat') {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [mode]);

  const handleSaveFreeformNote = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      let imageUrl = null;

      // Upload image if one was selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        }
      }

      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          imageUrl,
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

  const handleSaveAmikaChat = async () => {
    if (messages.length === 0) return;

    setSaving(true);
    try {
      // Convert chat messages to diary content
      const chatContent = messages
        .map((msg) => `${msg.role === 'user' ? 'Me' : 'Amika'}: ${msg.content}`)
        .join('\n\n');

      const chatTitle = title.trim() || `Amika Chat - ${new Date().toLocaleDateString()}`;

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
    } else if (mode === 'amika-chat' && messages.length > 0) {
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
      <DialogContent className={`sm:max-w-4xl max-w-[95vw] flex flex-col p-0 gap-0 bg-white ${mode === 'amika-chat' ? 'h-[85vh]' : 'max-h-[90vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {mode !== 'freeform' && (
              <button onClick={handleBack} className="p-1 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-medium text-gray-900">
              {mode === 'freeform' ? 'New entry' : mode === 'amika-chat' ? 'Amika Chat' : 'New entry'}
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
              {/* Title field */}
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>

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

              {/* Amika chat option */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setMode('amika-chat')}
                  className="flex items-center gap-3 w-full p-3 rounded-lg border border-[#D4A5A5]/30 bg-[#D4A5A5]/5 hover:bg-[#D4A5A5]/10 transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-[#D4A5A5]" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Chat with Amika</p>
                    <p className="text-xs text-gray-500">Talk through your thoughts with your AI coach</p>
                  </div>
                </button>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                {imagePreview && (
                  <div className="relative inline-block w-full">
                    <img
                      src={imagePreview}
                      alt="Note preview"
                      className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[#A8C5A8]/60 text-[#A8C5A8]"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Add Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
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

        {mode === 'amika-chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-[#D4A5A5] mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Hi, I&apos;m Amika</h3>
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
              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={chatInputRef}
                    value={input}
                    onChange={handleCustomChatInputChange}
                    onKeyDown={(e) => {
                      handleMentionKeyDown(e);
                      // Send on Enter (without shift)
                      if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    placeholder="Type a message... (use @ to mention friends)"
                    disabled={isLoading}
                    autoFocus
                    rows={1}
                    className="min-h-[40px] max-h-[120px] resize-none py-2"
                    style={{ height: 'auto', overflow: 'hidden' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  {/* @ Mentions dropdown */}
                  {showMentions && (
                    <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-white border border-[#A8C5A8]/30 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredFriends.length > 0 ? (
                        filteredFriends.map((friend, index) => (
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
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {friends.length === 0
                            ? 'No friends added yet. Add friends to mention them!'
                            : `No friends matching "${mentionSearch}"`
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  Send
                </Button>
              </form>

              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line. Use @ to mention friends.
              </p>

              {/* Save chat button */}
              {messages.length > 0 && (
                <Button
                  onClick={handleSaveAmikaChat}
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

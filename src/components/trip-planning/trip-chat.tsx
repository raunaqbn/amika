'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, Loader2, Sparkles, BarChart2 } from 'lucide-react';

interface Message {
  id: string;
  tripId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface TripChatProps {
  tripId: string;
  context: string;
  messages: Message[];
  onNewMessage?: (message: Message) => void;
  onCreatePoll?: () => void;
}

export function TripChat({
  tripId,
  context,
  messages,
  onNewMessage,
  onCreatePoll,
}: TripChatProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/messages`, {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Discussion</h4>
        {onCreatePoll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreatePoll}
            className="text-xs"
          >
            <BarChart2 className="w-3 h-3 mr-1" />
            Create Poll
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="max-h-[300px] overflow-y-auto mb-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet. Start the discussion!
            <br />
            <span className="text-xs">Mention @amika for AI suggestions</span>
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.role === 'assistant' ? 'bg-[#A8C5A8]/10 p-2 rounded-lg' : ''
              }`}
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                {msg.role === 'assistant' ? (
                  <AvatarFallback className="bg-[#A8C5A8] text-white">
                    <Sparkles className="w-3 h-3" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                    U
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-0.5">
                  {msg.role === 'assistant' ? 'Amika' : 'You'}
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (mention @amika for AI help)"
          rows={1}
          className="resize-none"
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
    </Card>
  );
}

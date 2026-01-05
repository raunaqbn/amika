'use client';

import { Calendar, MapPin, Trash2, Check, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    eventDate: Date;
    location: string | null;
    friendId: string;
    completed?: boolean;
  };
  friendName?: string;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export function EventCard({ event, friendName, onDelete, onToggleComplete }: EventCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleDelete = () => {
    if (onDelete && confirm('Delete this event?')) {
      onDelete(event.id);
    }
  };

  const handleToggleComplete = async () => {
    if (!onToggleComplete) return;
    setIsCompleting(true);
    try {
      await onToggleComplete(event.id, !event.completed);
    } finally {
      setIsCompleting(false);
    }
  };

  const isCompleted = event.completed ?? false;

  return (
    <Card className={`p-4 border shadow-sm hover:shadow-md transition-all ${
      isCompleted
        ? 'border-[#A8C5A8]/50 bg-[#A8C5A8]/5'
        : 'border-[#A8C5A8]/30 bg-white/60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Completion toggle */}
        {onToggleComplete && (
          <button
            onClick={handleToggleComplete}
            disabled={isCompleting}
            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isCompleted
                ? 'border-[#A8C5A8] bg-[#A8C5A8] text-white'
                : 'border-gray-300 hover:border-[#A8C5A8] hover:bg-[#A8C5A8]/10'
            } ${isCompleting ? 'opacity-50' : ''}`}
          >
            {isCompleted && <Check className="w-4 h-4" />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold mb-1 ${
            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}>
            {event.title}
          </h3>

          {friendName && (
            <p className={`text-sm font-medium mb-2 ${
              isCompleted ? 'text-[#A8C5A8]/60' : 'text-[#A8C5A8]'
            }`}>
              with {friendName}
            </p>
          )}

          {event.description && (
            <p className={`text-sm mb-2 ${
              isCompleted ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {event.description}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 text-sm ${
              isCompleted ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(event.eventDate), 'PPP')} (
                {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })})
              </span>
            </div>

            {event.location && (
              <div className={`flex items-center gap-2 text-sm ${
                isCompleted ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

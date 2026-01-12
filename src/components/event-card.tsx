'use client';

import { Calendar, MapPin, Trash2, Check, Edit2, Share2, Link2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ShareItemDialog } from '@/components/share-item-dialog';
import { EventShareDialog } from '@/components/event-share-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import { useState, memo } from 'react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  friendId: string;
  completed?: boolean;
  friends?: { id: string; name: string }[];
}

interface EventCardProps {
  event: Event;
  friendName?: string;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onEdit?: (event: Event) => void;
}

// Memoized EventCard to prevent unnecessary re-renders in lists
export const EventCard = memo(function EventCard({ event, friendName, onDelete, onToggleComplete, onEdit }: EventCardProps) {
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

          {(event.friends && event.friends.length > 0) ? (
            <p className={`text-sm font-medium mb-2 ${
              isCompleted ? 'text-[#A8C5A8]/60' : 'text-[#A8C5A8]'
            }`}>
              with {event.friends.map(f => f.name).join(', ')}
            </p>
          ) : friendName && (
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

        <div className="flex gap-1">
          {/* Share via link */}
          <EventShareDialog
            eventId={event.id}
            eventTitle={event.title}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-[#A8C5A8]"
                title="Share via link"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            }
          />
          {/* Share with Amika friends */}
          <ShareItemDialog
            itemType="event"
            itemId={event.id}
            itemTitle={event.title}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-[#D4A5A5]"
                title="Share with friends"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            }
          />
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(event)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
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
      </div>
    </Card>
  );
});

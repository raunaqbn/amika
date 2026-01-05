'use client';

import { Calendar, MapPin, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { format, formatDistanceToNow } from 'date-fns';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    eventDate: Date;
    location: string | null;
    friendId: string;
  };
  friendName?: string;
  onDelete?: (id: string) => void;
}

export function EventCard({ event, friendName, onDelete }: EventCardProps) {
  const handleDelete = () => {
    if (onDelete && confirm('Delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <Card className="p-4 border border-[#A8C5A8]/30 bg-white/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>

          {friendName && (
            <p className="text-sm text-[#A8C5A8] font-medium mb-2">with {friendName}</p>
          )}

          {event.description && (
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(event.eventDate), 'PPP')} (
                {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })})
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
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

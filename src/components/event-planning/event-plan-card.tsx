'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Collaborator {
  id: string;
  friendId: string;
  friendName: string;
  profileImage: string | null;
}

interface EventPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  eventDate: string | null;
  eventTime: string | null;
  selectedEventId: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

interface EventPlanCardProps {
  eventPlan: EventPlan;
}

export function EventPlanCard({ eventPlan }: EventPlanCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <Card
      className="p-4 border border-[#7BA3C9]/30 bg-white/60 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/event-plans/${eventPlan.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{eventPlan.title}</h3>
            <Badge className={getStatusColor(eventPlan.status)}>
              {eventPlan.status.charAt(0).toUpperCase() + eventPlan.status.slice(1)}
            </Badge>
          </div>

          {eventPlan.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {eventPlan.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {eventPlan.eventDate
                ? format(new Date(eventPlan.eventDate), 'MMM d, yyyy')
                : 'Date not set'}
            </div>
            {eventPlan.eventTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {eventPlan.eventTime}
              </div>
            )}
            {eventPlan.selectedEventId && (
              <div className="flex items-center gap-1 text-[#A8C5A8]">
                <Sparkles className="w-4 h-4" />
                Event selected
              </div>
            )}
          </div>

          {/* Collaborators */}
          {eventPlan.collaborators.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Users className="w-4 h-4 text-gray-400" />
              <div className="flex -space-x-2">
                {eventPlan.collaborators.slice(0, 4).map((collab) => (
                  <Avatar key={collab.id} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={collab.profileImage || undefined} />
                    <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                      {collab.friendName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {eventPlan.collaborators.length > 4 && (
                  <span className="text-xs text-gray-500 ml-2">
                    +{eventPlan.collaborators.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>
    </Card>
  );
}

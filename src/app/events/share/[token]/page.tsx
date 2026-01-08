'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  CalendarCheck,
} from 'lucide-react';

interface SharedEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  category: string | null;
  ownerName: string;
  friendName: string;
}

export default function SharedEventPage() {
  const params = useParams();
  const token = params.token as string;

  const [event, setEvent] = useState<SharedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/share/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('This event link is invalid or sharing has been disabled.');
            return;
          }
          throw new Error('Failed to fetch event');
        }
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEvent();
    }
  }, [token]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'experiences':
        return 'bg-purple-100 text-purple-800';
      case 'restaurants':
        return 'bg-orange-100 text-orange-800';
      case 'places':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground">
            {error || 'This event link is invalid or has expired.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <CalendarCheck className="w-4 h-4 text-[#A8C5A8]" />
            <span>Shared Event</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{event.title}</h1>
            {event.category && (
              <Badge className={`text-xs capitalize ${getCategoryColor(event.category)}`}>
                {event.category}
              </Badge>
            )}
          </div>
          {event.description && (
            <p className="text-gray-600 mb-4">{event.description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="p-6 border border-[#A8C5A8]/30">
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#A8C5A8]" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Date & Time</h3>
                <p className="text-gray-600">{formatDate(event.eventDate)}</p>
                <p className="text-gray-500 text-sm">{formatTime(event.eventDate)}</p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#A8C5A8]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Location</h3>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#A8C5A8]" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Participants</h3>
                <p className="text-gray-600">
                  {event.ownerName} & {event.friendName}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4">
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-500">
          Shared via <span className="text-[#A8C5A8] font-medium">Amika</span> - Plan events with friends
        </div>
      </div>
    </div>
  );
}

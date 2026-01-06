'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import { AddEventDialog } from '@/components/add-event-dialog';
import { FindEventsDialog } from '@/components/find-events-dialog';
import { Calendar, Plus, Sparkles, Clock, CheckCircle2, Utensils, MapPin, Dumbbell } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  notes?: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  category?: string | null;
  friendId: string;
  completed?: boolean;
  friends?: { id: string; name: string }[];
}

// Category definitions
const categories = [
  { value: null, label: 'All', icon: Calendar },
  { value: 'experiences', label: 'Experiences', icon: Sparkles },
  { value: 'restaurants', label: 'Restaurants', icon: Utensils },
  { value: 'places', label: 'Places', icon: MapPin },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell },
];

export default function EventsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [findEventsDialogOpen, setFindEventsDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
    fetchEvents();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to fetch friends');
      }
      const data = await response.json();
      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter((e) => e.id !== eventId));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleComplete = async (eventId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, completed }),
      });

      if (response.ok) {
        setEvents(events.map((e) =>
          e.id === eventId ? { ...e, completed } : e
        ));
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setAddEventDialogOpen(true);
  };

  const now = new Date();

  // Filter by category
  const filteredEvents = selectedCategory === null
    ? events
    : events.filter((event) => event.category === selectedCategory);

  const upcomingEvents = filteredEvents
    .filter((event) => new Date(event.eventDate) >= now && !event.completed)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const pastEvents = filteredEvents
    .filter((event) => new Date(event.eventDate) < now || event.completed)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  // Count events per category for badge display
  const getCategoryCount = (categoryValue: string | null, upcoming: boolean) => {
    const baseFiltered = categoryValue === null
      ? events
      : events.filter((e) => e.category === categoryValue);

    return upcoming
      ? baseFiltered.filter((e) => new Date(e.eventDate) >= now && !e.completed).length
      : baseFiltered.filter((e) => new Date(e.eventDate) < now || e.completed).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-2xl mx-auto">
        <div className="py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setFindEventsDialogOpen(true)}
                variant="outline"
                className="border-[#D4A5A5]/60 text-[#D4A5A5] hover:bg-[#D4A5A5]/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Find Events
              </Button>
              <Button
                onClick={() => setAddEventDialogOpen(true)}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
          <p className="text-gray-600">Plan and track activities with your friends</p>
        </div>

        {/* Time Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-[#A8C5A8] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-[#A8C5A8] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Past ({pastEvents.length})
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.value, activeTab === 'upcoming');
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-[#D4A5A5] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#D4A5A5]/50'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
                {count > 0 && (
                  <span className={`ml-1 text-xs ${
                    selectedCategory === cat.value ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Events List */}
        {activeTab === 'upcoming' && (
          <section>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const friend = friends.find((f) => f.id === event.friendId);
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      friendName={friend?.name}
                      onDelete={handleDeleteEvent}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditEvent}
                    />
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 border border-[#A8C5A8]/30 bg-white/60 text-center">
                <Calendar className="w-12 h-12 text-[#A8C5A8] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Plan something fun with your friends!
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setFindEventsDialogOpen(true)}
                    variant="outline"
                    className="border-[#D4A5A5]/60 text-[#D4A5A5]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Ideas
                  </Button>
                  <Button
                    onClick={() => setAddEventDialogOpen(true)}
                    className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </Card>
            )}
          </section>
        )}

        {activeTab === 'past' && (
          <section>
            {pastEvents.length > 0 ? (
              <div className="space-y-3">
                {pastEvents.map((event) => {
                  const friend = friends.find((f) => f.id === event.friendId);
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      friendName={friend?.name}
                      onDelete={handleDeleteEvent}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditEvent}
                    />
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 border border-gray-200 bg-white/60 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No past events</h3>
                <p className="text-gray-600 text-sm">
                  Completed and past events will appear here.
                </p>
              </Card>
            )}
          </section>
        )}

        <AddEventDialog
          open={addEventDialogOpen}
          onOpenChange={(open) => {
            setAddEventDialogOpen(open);
            if (!open) setEventToEdit(null);
          }}
          friends={friends.map((f) => ({ id: f.id, name: f.name }))}
          onEventAdded={() => {
            fetchEvents();
          }}
          eventToEdit={eventToEdit}
          onEventUpdated={() => {
            fetchEvents();
            setEventToEdit(null);
          }}
        />

        <FindEventsDialog
          open={findEventsDialogOpen}
          onOpenChange={setFindEventsDialogOpen}
          friends={friends}
          onEventCreated={() => {
            fetchEvents();
          }}
        />
      </div>
    </div>
  );
}

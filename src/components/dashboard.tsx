'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FriendCard } from '@/components/friend-card';
import { EventCard } from '@/components/event-card';
import { AddEventDialog } from '@/components/add-event-dialog';
import { FindEventsDialog } from '@/components/find-events-dialog';
import { NewNoteDialog } from '@/components/new-note-dialog';
import { Timeline } from '@/components/timeline';
import { FriendRequests } from '@/components/friend-requests';
import { SharedItemsInbox } from '@/components/shared-items';
import { differenceInDays, format, isBefore, addDays } from 'date-fns';
import { Cake, Clock, Calendar, Plus, TrendingUp, Sparkles, PenLine } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  email?: string | null;
  linkedUserId?: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  friendId: string;
  completed?: boolean;
}

export function Dashboard() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [findEventsDialogOpen, setFindEventsDialogOpen] = useState(false);
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

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

  const handleEditEvent = useCallback((event: Event) => {
    setEventToEdit(event);
    setAddEventDialogOpen(true);
  }, []);

  // Memoize upcoming birthdays calculation
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    return friends
      .filter((friend) => friend.birthday)
      .map((friend) => {
        const birthday = new Date(friend.birthday!);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthday.getMonth(),
          birthday.getDate()
        );

        if (isBefore(thisYearBirthday, today)) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        return {
          ...friend,
          nextBirthday: thisYearBirthday,
          daysUntil: differenceInDays(thisYearBirthday, today),
        };
      })
      .filter((friend) => friend.nextBirthday <= thirtyDaysFromNow)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [friends]);

  // Memoize friends to contact calculation
  const friendsToContact = useMemo(() => {
    const fourteenDaysAgo = addDays(new Date(), -14);

    return friends
      .filter(
        (friend) =>
          !friend.lastContact ||
          isBefore(new Date(friend.lastContact), fourteenDaysAgo)
      )
      .slice(0, 5);
  }, [friends]);

  // Memoize upcoming events calculation
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.eventDate) >= now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5);
  }, [events]);

  // Memoize friends data for dialogs to prevent unnecessary re-renders
  const friendsForAddEvent = useMemo(() =>
    friends.map((f) => ({ id: f.id, name: f.name, email: f.email, linkedUserId: f.linkedUserId })),
    [friends]
  );

  const friendsForFindEvents = useMemo(() =>
    friends.map((f) => ({ id: f.id, name: f.name, notes: f.notes })),
    [friends]
  );

  const friendsForNewNote = useMemo(() =>
    friends.map((f) => ({ id: f.id, name: f.name })),
    [friends]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-2xl mx-auto">
        <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Amika</h1>
        <p className="text-gray-600">Nurture your friendships</p>
      </div>

      {/* Quick Actions */}
      <section className="mb-6">
        <div className="flex gap-3 mb-3">
          <Button
            onClick={() => setFindEventsDialogOpen(true)}
            variant="outline"
            className="flex-1 py-6 border-[#D4A5A5]/40 text-[#D4A5A5] hover:bg-[#D4A5A5]/5"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Find Events
          </Button>
          <Button
            onClick={() => setAddEventDialogOpen(true)}
            className="flex-1 py-6 bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Event
          </Button>
        </div>
        <Button
          onClick={() => setNewNoteDialogOpen(true)}
          variant="outline"
          className="w-full py-5 border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <PenLine className="w-5 h-5 mr-2" />
          New Note
        </Button>
      </section>

      {/* Friend Requests & Shared Items */}
      <section className="mb-6 space-y-4">
        <FriendRequests onUpdate={() => {}} />
        <SharedItemsInbox onUpdate={() => {}} />
      </section>

      {/* Upcoming Events Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#A8C5A8]" />
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
        </div>

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
          <Card className="p-6 border border-[#A8C5A8]/30 bg-white/60 text-center">
            <Calendar className="w-8 h-8 text-[#A8C5A8] mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No upcoming events.</p>
            <p className="text-gray-500 text-xs mt-1">
              Click &quot;Add Event&quot; above to schedule time with friends!
            </p>
          </Card>
        )}
      </section>

      {upcomingBirthdays.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Cake className="w-5 h-5 text-[#D4A5A5]" />
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Birthdays
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingBirthdays.map((friend) => (
              <Card
                key={friend.id}
                className="p-4 border-[#D4A5A5]/30 bg-gradient-to-r from-[#D4A5A5]/5 to-transparent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(friend.birthday!), 'MMMM d')}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-[#D4A5A5]/20 text-[#D4A5A5] border-[#D4A5A5]/30"
                  >
                    {friend.daysUntil === 0
                      ? 'Today!'
                      : friend.daysUntil === 1
                      ? 'Tomorrow'
                      : `${friend.daysUntil} days`}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {friendsToContact.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#A8C5A8]" />
            <h2 className="text-xl font-semibold text-gray-900">
              Friends to Connect With
            </h2>
          </div>
          <div className="space-y-3">
            {friendsToContact.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </section>
      )}

      {friends.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No friends added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start building your circle by adding your first friend!
            </p>
            <a
              href="/friends"
              className="inline-block px-4 py-2 bg-[#A8C5A8] text-white rounded-lg hover:bg-[#A8C5A8]/90 transition-colors"
            >
              Add Your First Friend
            </a>
          </div>
        </Card>
      )}


      {/* Timeline Section */}
      {friends.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#D4A5A5]" />
            <h2 className="text-xl font-semibold text-gray-900">Your Timeline</h2>
          </div>
          <Timeline />
        </section>
      )}

      <AddEventDialog
        open={addEventDialogOpen}
        onOpenChange={(open) => {
          setAddEventDialogOpen(open);
          if (!open) setEventToEdit(null);
        }}
        friends={friendsForAddEvent}
        onEventAdded={() => {
          fetchEvents();
        }}
        eventToEdit={eventToEdit}
        onEventUpdated={() => {
          fetchEvents();
          setEventToEdit(null);
        }}
        onFriendsUpdated={() => {
          fetchFriends();
        }}
      />

      <FindEventsDialog
        open={findEventsDialogOpen}
        onOpenChange={setFindEventsDialogOpen}
        friends={friendsForFindEvents}
        onEventCreated={() => {
          fetchEvents();
        }}
      />

      <NewNoteDialog
        open={newNoteDialogOpen}
        onOpenChange={setNewNoteDialogOpen}
        friends={friendsForNewNote}
      />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FriendCard } from '@/components/friend-card';
import { EventCard } from '@/components/event-card';
import { AddEventDialog } from '@/components/add-event-dialog';
import { Timeline } from '@/components/timeline';
import { differenceInDays, format, isBefore, addDays } from 'date-fns';
import { Cake, Clock, Calendar, Plus, TrendingUp } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  friendId: string;
}

export default function Home() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchEvents();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const getUpcomingBirthdays = () => {
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
  };

  const getFriendsToContact = () => {
    const fourteenDaysAgo = addDays(new Date(), -14);

    return friends
      .filter(
        (friend) =>
          !friend.lastContact ||
          isBefore(new Date(friend.lastContact), fourteenDaysAgo)
      )
      .slice(0, 5);
  };

  const upcomingBirthdays = getUpcomingBirthdays();
  const friendsToContact = getFriendsToContact();

  const upcomingEvents = events
    .filter((event) => new Date(event.eventDate) >= new Date())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 max-w-2xl mx-auto">
      <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Amika</h1>
        <p className="text-gray-600">Nurture your friendships</p>
      </div>

      {/* Upcoming Events Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A8C5A8]" />
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          <Button
            onClick={() => setAddEventDialogOpen(true)}
            size="sm"
            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Plan Event
          </Button>
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
                />
              );
            })}
          </div>
        ) : (
          <Card className="p-6 border border-[#A8C5A8]/30 bg-white/60 text-center">
            <Calendar className="w-8 h-8 text-[#A8C5A8] mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No upcoming events.</p>
            <p className="text-gray-500 text-xs mt-1">
              Click "Plan Event" to schedule time with friends!
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

      {friends.length > 0 &&
        upcomingBirthdays.length === 0 &&
        friendsToContact.length === 0 && (
          <Card className="p-8 text-center bg-gradient-to-br from-[#A8C5A8]/10 to-[#D4A5A5]/10 border-[#A8C5A8]/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              You're all caught up!
            </h3>
            <p className="text-gray-600">
              No upcoming birthdays and you've been staying in touch. Great job! 🎉
            </p>
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
        onOpenChange={setAddEventDialogOpen}
        friends={friends.map((f) => ({ id: f.id, name: f.name }))}
        onEventAdded={() => {
          fetchEvents();
        }}
      />
    </div>
  );
}

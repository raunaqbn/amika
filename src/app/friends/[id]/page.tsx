'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FriendAvatar } from '@/components/friend-avatar';
import { MemoryList } from '@/components/memory-list';
import { ArrowLeft, Edit, Trash2, Check, X, Plus, Calendar, BarChart3, Clock, BookOpen, Heart, Sparkles, Utensils, MapPin, Dumbbell, Trophy, CheckCircle2, Search } from 'lucide-react';
import { EventCard } from '@/components/event-card';
import { AddEventDialog } from '@/components/add-event-dialog';
import { FindEventsDialog } from '@/components/find-events-dialog';
import { format, formatDistanceToNow } from 'date-fns';

// Point system for events based on bonding potential and time/energy investment
const EVENT_POINTS: Record<string, { planned: number; attended: number; label: string }> = {
  fitness: { planned: 5, attended: 25, label: 'Fitness' },       // High commitment, shared physical activity
  experiences: { planned: 4, attended: 20, label: 'Experiences' }, // Unique bonding, memorable moments
  places: { planned: 3, attended: 15, label: 'Places' },         // Travel/exploration together
  restaurants: { planned: 2, attended: 10, label: 'Restaurants' }, // Social dining, casual bonding
  default: { planned: 2, attended: 10, label: 'Other' },         // Uncategorized events
};

const getEventPoints = (event: Event, isAttended: boolean): number => {
  const category = event.category || 'default';
  const points = EVENT_POINTS[category] || EVENT_POINTS.default;
  return isAttended ? points.attended : points.planned;
};

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  howWeMet?: string | null;
  notes?: string | null;
  lastContact?: Date | null;
  profileImage?: string | null;
  memories: Memory[];
}

interface Memory {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
}

interface DiaryNote {
  id: string;
  title: string | null;
  content: string;
  analysis: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  friends: { id: string; name: string }[];
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

// Category definitions for filtering
const eventCategories = [
  { value: null, label: 'All', icon: Calendar },
  { value: 'experiences', label: 'Experiences', icon: Sparkles },
  { value: 'restaurants', label: 'Restaurants', icon: Utensils },
  { value: 'places', label: 'Places', icon: MapPin },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell },
];

interface FriendStats {
  eventsCount: number;
  memoriesCount: number;
  diaryCount: number;
  lastContact: string | null;
  daysSinceLastContact: number | null;
}

export default function FriendProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    howWeMet: '',
    notes: '',
    lastContact: '',
  });
  const [taggedNotes, setTaggedNotes] = useState<DiaryNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [selectedEventCategory, setSelectedEventCategory] = useState<string | null>(null);
  const [selectedPastEventCategory, setSelectedPastEventCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [findEventsDialogOpen, setFindEventsDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [stats, setStats] = useState<FriendStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [allFriends, setAllFriends] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchFriend();
    fetchEvents();
    fetchStats();
  }, [params.id]);

  useEffect(() => {
    if (!friend) return;

    const loadNotes = async () => {
      setNotesLoading(true);
      try {
        const response = await fetch('/api/diary');
        if (!response.ok) return;
        const data = await response.json();
        setTaggedNotes(
          data.filter((note: DiaryNote) =>
            Array.isArray(note.friends)
              ? note.friends.some((f) => f.id === friend.id)
              : false
          )
        );
      } catch (error) {
        console.error('Error fetching diary notes', error);
      } finally {
        setNotesLoading(false);
      }
    };

    loadNotes();
  }, [friend]);

  const fetchFriend = async () => {
    try {
      const response = await fetch('/api/friends');
      const data = await response.json();
      const foundFriend = data.find((f: Friend) => f.id === params.id);

      // Set all friends for the event dialog (with current friend first)
      const friendsList = data.map((f: Friend) => ({ id: f.id, name: f.name }));
      // Move current friend to the top of the list
      const currentFriendIndex = friendsList.findIndex((f: { id: string }) => f.id === params.id);
      if (currentFriendIndex > 0) {
        const [currentFriend] = friendsList.splice(currentFriendIndex, 1);
        friendsList.unshift(currentFriend);
      }
      setAllFriends(friendsList);

      if (foundFriend) {
        setFriend(foundFriend);
        setFormData({
          name: foundFriend.name,
          birthday: foundFriend.birthday
            ? format(new Date(foundFriend.birthday), 'yyyy-MM-dd')
            : '',
          howWeMet: foundFriend.howWeMet || '',
          notes: foundFriend.notes || '',
          lastContact: foundFriend.lastContact
            ? format(new Date(foundFriend.lastContact), 'yyyy-MM-dd')
            : '',
        });
      }
    } catch (error) {
      console.error('Error fetching friend:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events?friendId=${params.id}`);
      const data = await response.json();
      const now = new Date();
      const upcoming = data.filter(
        (event: Event) => new Date(event.eventDate) >= now && !event.completed
      );
      const past = data
        .filter((event: Event) => new Date(event.eventDate) < now || event.completed)
        .sort((a: Event, b: Event) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/friends/${params.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching friend stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, ...formData }),
      });

      if (response.ok) {
        setEditing(false);
        fetchFriend();
      }
    } catch (error) {
      console.error('Error updating friend:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${friend?.name}?`)) return;

    try {
      const response = await fetch(`/api/friends?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/friends');
      }
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!friend) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { url } = await uploadRes.json();

      const updateRes = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: friend.id,
          profileImage: url,
        }),
      });

      if (updateRes.ok) {
        await fetchFriend();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleEventComplete = async (eventId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, completed }),
      });
      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setAddEventDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Friend not found</h2>
          <Button onClick={() => router.push('/friends')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div className="py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/friends')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6 mb-6 border-[#A8C5A8]/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <FriendAvatar
                name={friend.name}
                profileImage={friend.profileImage}
                hasUpcomingEvent={upcomingEvents.length > 0}
                size="md"
                editable={!editing}
                onImageUpload={handleImageUpload}
              />
              {uploading && (
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                  Uploading...
                </div>
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="font-semibold text-lg mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{friend.name}</h1>
              )}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      fetchFriend();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Birthday</label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) =>
                    setFormData({ ...formData, birthday: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">
                  {friend.birthday
                    ? format(new Date(friend.birthday), 'MMMM d, yyyy')
                    : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">How We Met</label>
              {editing ? (
                <Input
                  value={formData.howWeMet}
                  onChange={(e) =>
                    setFormData({ ...formData, howWeMet: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{friend.howWeMet || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Last Contact</label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.lastContact}
                  onChange={(e) =>
                    setFormData({ ...formData, lastContact: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">
                  {friend.lastContact
                    ? format(new Date(friend.lastContact), 'MMMM d, yyyy')
                    : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              {editing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap">
                  {friend.notes || 'No notes'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Metrics Section */}
        <Card className="p-6 border-[#A8C5A8]/20 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#A8C5A8]" />
            <h2 className="text-xl font-semibold">Friendship Metrics</h2>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A8C5A8]" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#A8C5A8]/10 rounded-xl p-4 text-center">
                <Calendar className="w-6 h-6 text-[#A8C5A8] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.eventsCount}</p>
                <p className="text-sm text-gray-600">Events</p>
              </div>
              <div className="bg-[#D4A5A5]/10 rounded-xl p-4 text-center">
                <Heart className="w-6 h-6 text-[#D4A5A5] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.memoriesCount}</p>
                <p className="text-sm text-gray-600">Memories</p>
              </div>
              <div className="bg-[#A8C5A8]/10 rounded-xl p-4 text-center">
                <BookOpen className="w-6 h-6 text-[#A8C5A8] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.diaryCount}</p>
                <p className="text-sm text-gray-600">Diary Entries</p>
              </div>
              <div className="bg-[#D4A5A5]/10 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-[#D4A5A5] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {stats.daysSinceLastContact !== null ? stats.daysSinceLastContact : '—'}
                </p>
                <p className="text-sm text-gray-600">Days Since Contact</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Unable to load metrics</p>
          )}
        </Card>

        {/* Friendship Points Section */}
        {(() => {
          const plannedPoints = upcomingEvents.reduce((sum, event) => sum + getEventPoints(event, false), 0);
          const attendedPoints = pastEvents.reduce((sum, event) => sum + getEventPoints(event, true), 0);
          const totalPoints = plannedPoints + attendedPoints;

          // Count events by category for breakdown
          const categoryBreakdown = [...upcomingEvents, ...pastEvents].reduce((acc, event) => {
            const cat = event.category || 'default';
            const isAttended = pastEvents.some(e => e.id === event.id);
            if (!acc[cat]) acc[cat] = { planned: 0, attended: 0, count: 0 };
            if (isAttended) {
              acc[cat].attended += getEventPoints(event, true);
            } else {
              acc[cat].planned += getEventPoints(event, false);
            }
            acc[cat].count++;
            return acc;
          }, {} as Record<string, { planned: number; attended: number; count: number }>);

          if (totalPoints === 0 && upcomingEvents.length === 0 && pastEvents.length === 0) return null;

          return (
            <Card className="p-6 border-[#A8C5A8]/20 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Friendship Points</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{totalPoints}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{attendedPoints}</p>
                  <p className="text-sm text-gray-600">Attended</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{plannedPoints}</p>
                  <p className="text-sm text-gray-600">Planned</p>
                </div>
              </div>

              {Object.keys(categoryBreakdown).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Points by Category</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(categoryBreakdown).map(([cat, data]) => {
                      const pointInfo = EVENT_POINTS[cat] || EVENT_POINTS.default;
                      const Icon = cat === 'fitness' ? Dumbbell :
                                   cat === 'experiences' ? Sparkles :
                                   cat === 'places' ? MapPin :
                                   cat === 'restaurants' ? Utensils : Calendar;
                      return (
                        <div key={cat} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 capitalize">{pointInfo.label}</p>
                            <p className="text-xs text-gray-500">{data.count} events</p>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{data.planned + data.attended} pts</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Points reflect bonding potential: Fitness (25), Experiences (20), Places (15), Restaurants (10). Planned events earn partial points.
                  </p>
                </div>
              )}
            </Card>
          );
        })()}

        <Card className="p-6 border-[#A8C5A8]/20 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A8C5A8]" />
              <h2 className="text-xl font-semibold">Planned Events</h2>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFindEventsDialogOpen(true)}
                className="border-[#D4A5A5]/60 text-[#D4A5A5] hover:bg-[#D4A5A5]/10"
              >
                <Search className="w-4 h-4 mr-1" />
                Find Events
              </Button>
              <Button
                size="sm"
                onClick={() => setAddEventDialogOpen(true)}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {eventCategories.map((cat) => {
              const count = selectedEventCategory === null
                ? (cat.value === null ? upcomingEvents.length : upcomingEvents.filter(e => e.category === cat.value).length)
                : (cat.value === selectedEventCategory ? upcomingEvents.filter(e => e.category === cat.value).length : upcomingEvents.filter(e => e.category === cat.value).length);

              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedEventCategory(cat.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedEventCategory === cat.value
                      ? 'bg-[#D4A5A5] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                  {count > 0 && (
                    <span className={`ml-0.5 ${
                      selectedEventCategory === cat.value ? 'text-white/80' : 'text-gray-400'
                    }`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {(() => {
            const filteredEvents = selectedEventCategory === null
              ? upcomingEvents
              : upcomingEvents.filter(e => e.category === selectedEventCategory);

            return filteredEvents.length === 0 ? (
              <p className="text-sm text-gray-500">
                {selectedEventCategory === null
                  ? `No planned events with ${friend.name}.`
                  : `No ${eventCategories.find(c => c.value === selectedEventCategory)?.label.toLowerCase()} events with ${friend.name}.`
                }
              </p>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDelete={handleDeleteEvent}
                    onToggleComplete={handleToggleEventComplete}
                    onEdit={handleEditEvent}
                  />
                ))}
              </div>
            );
          })()}
        </Card>

        {/* Past Events Section */}
        <Card className="p-6 border-[#A8C5A8]/20 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#A8C5A8]" />
              <h2 className="text-xl font-semibold">Past Events</h2>
            </div>
            {pastEvents.length > 0 && (
              <span className="text-sm text-gray-500">
                {pastEvents.reduce((sum, event) => sum + getEventPoints(event, true), 0)} points earned
              </span>
            )}
          </div>

          {/* Category Tabs for Past Events */}
          <div className="flex flex-wrap gap-2 mb-4">
            {eventCategories.map((cat) => {
              const count = selectedPastEventCategory === null
                ? (cat.value === null ? pastEvents.length : pastEvents.filter(e => e.category === cat.value).length)
                : pastEvents.filter(e => e.category === cat.value).length;

              return (
                <button
                  key={`past-${cat.label}`}
                  onClick={() => setSelectedPastEventCategory(cat.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedPastEventCategory === cat.value
                      ? 'bg-[#D4A5A5] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                  {count > 0 && (
                    <span className={`ml-0.5 ${
                      selectedPastEventCategory === cat.value ? 'text-white/80' : 'text-gray-400'
                    }`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {(() => {
            const filteredPastEvents = selectedPastEventCategory === null
              ? pastEvents
              : pastEvents.filter(e => e.category === selectedPastEventCategory);

            return filteredPastEvents.length === 0 ? (
              <p className="text-sm text-gray-500">
                {selectedPastEventCategory === null
                  ? `No past events with ${friend.name} yet. Complete some planned events to see them here!`
                  : `No past ${eventCategories.find(c => c.value === selectedPastEventCategory)?.label.toLowerCase()} events with ${friend.name}.`
                }
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPastEvents.map((event) => (
                  <div key={event.id} className="relative">
                    <EventCard
                      event={event}
                      onDelete={handleDeleteEvent}
                      onToggleComplete={handleToggleEventComplete}
                      onEdit={handleEditEvent}
                    />
                    <div className="absolute top-2 right-12 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      +{getEventPoints(event, true)} pts
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        <AddEventDialog
          open={addEventDialogOpen}
          onOpenChange={(open) => {
            setAddEventDialogOpen(open);
            if (!open) setEventToEdit(null);
          }}
          friends={allFriends.length > 0 ? allFriends : [{ id: friend.id, name: friend.name }]}
          onEventAdded={() => {
            fetchEvents();
            fetchStats();
          }}
          eventToEdit={eventToEdit}
          onEventUpdated={() => {
            fetchEvents();
            fetchStats();
            setEventToEdit(null);
          }}
        />

        <FindEventsDialog
          open={findEventsDialogOpen}
          onOpenChange={setFindEventsDialogOpen}
          friends={allFriends.length > 0 ? allFriends : [{ id: friend.id, name: friend.name }]}
          onEventCreated={() => {
            fetchEvents();
            fetchStats();
          }}
        />

        <Card className="p-6 border-[#A8C5A8]/20 mt-6">
          <h2 className="text-xl font-semibold mb-4">Memories</h2>
          <MemoryList
            friendId={friend.id}
            memories={friend.memories}
            onUpdate={fetchFriend}
          />
        </Card>

        <Card className="p-6 border-[#A8C5A8]/20 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Diary</h2>
              <p className="text-sm text-gray-600">
                Notes where {friend.name} was tagged
              </p>
            </div>
          </div>

          {notesLoading ? (
            <div className="text-sm text-gray-500">Loading notes...</div>
          ) : taggedNotes.length === 0 ? (
            <p className="text-sm text-gray-500">
              No diary entries yet for this friend.
            </p>
          ) : (
            <div className="space-y-3">
              {taggedNotes.map((note) => {
                // Generate summary: use analysis first sentence or truncated content
                let summary = note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '');
                if (note.analysis) {
                  const firstSentence = note.analysis.split(/[.!?]\s/)[0];
                  summary = firstSentence.length > 150
                    ? firstSentence.substring(0, 150) + '...'
                    : firstSentence + '.';
                }

                return (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl border border-[#A8C5A8]/30 bg-white/60 cursor-pointer hover:shadow-md hover:border-[#A8C5A8]/50 transition-all"
                    onClick={() => router.push(`/diary?id=${note.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {note.title?.trim() || 'Untitled note'}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                            {formatDistanceToNow(new Date(note.updatedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[#D4A5A5] font-medium line-clamp-2">
                          {summary}
                        </p>
                      </div>
                      {note.imageUrl && (
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={note.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

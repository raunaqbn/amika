'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Calendar, Heart, BookOpen, Trash2, Edit, Check, X, Sparkles, Utensils, MapPin, Dumbbell, Video, Share2, Eye, EyeOff, Gift, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getInterestLabel, INTEREST_CATEGORIES } from '@/lib/interests';

interface AmikaFriend {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  birthday: string | null;
}

interface Memory {
  id: string;
  content: string;
  imageUrl: string | null;
  sharedWithAmikaFriend: boolean;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  category: string | null;
  sharedWithAmikaFriend: boolean;
  completed: boolean;
  createdAt: string;
}

interface Note {
  id: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  sharedWithAmikaFriend: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price: string | null;
  category: string | null;
  priority: number;
  imageUrl: string | null;
  createdAt: string;
}

const eventCategories = [
  { value: null, label: 'All', icon: Calendar },
  { value: 'experiences', label: 'Experiences', icon: Sparkles },
  { value: 'restaurants', label: 'Restaurants', icon: Utensils },
  { value: 'places', label: 'Places', icon: MapPin },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell },
  { value: 'virtual', label: 'Virtual', icon: Video },
];

export default function AmikaFriendProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [friend, setFriend] = useState<AmikaFriend | null>(null);
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // Memory form state
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryShared, setNewMemoryShared] = useState(false);
  const [addingMemory, setAddingMemory] = useState(false);

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    category: '',
    sharedWithAmikaFriend: false,
  });
  const [addingEvent, setAddingEvent] = useState(false);
  const [selectedEventCategory, setSelectedEventCategory] = useState<string | null>(null);

  // Note form state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    sharedWithAmikaFriend: false,
  });
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchFriend();
    fetchMemories();
    fetchEvents();
    fetchNotes();
    fetchWishlist();
    fetchInterests();
  }, [params.id]);

  const fetchFriend = async () => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriend(data);
      }
    } catch (error) {
      console.error('Error fetching friend:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemories = async () => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/memories`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data);
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/wishlist`);
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchInterests = async () => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/interests`);
      if (response.ok) {
        const data = await response.json();
        setInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return;

    setAddingMemory(true);
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMemoryContent,
          sharedWithAmikaFriend: newMemoryShared,
        }),
      });

      if (response.ok) {
        setNewMemoryContent('');
        setNewMemoryShared(false);
        fetchMemories();
      }
    } catch (error) {
      console.error('Error adding memory:', error);
    } finally {
      setAddingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      const response = await fetch(`/api/amika-friends/${params.id}/memories?memoryId=${memoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMemories();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const handleToggleMemorySharing = async (memoryId: string, currentShared: boolean) => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/memories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryId,
          sharedWithAmikaFriend: !currentShared,
        }),
      });

      if (response.ok) {
        fetchMemories();
      }
    } catch (error) {
      console.error('Error updating memory:', error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.eventDate) return;

    setAddingEvent(true);
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        setNewEvent({
          title: '',
          description: '',
          eventDate: '',
          location: '',
          category: '',
          sharedWithAmikaFriend: false,
        });
        setShowEventForm(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/amika-friends/${params.id}/events?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleEventSharing = async (eventId: string, currentShared: boolean) => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/events`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          sharedWithAmikaFriend: !currentShared,
        }),
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleToggleEventComplete = async (eventId: string, currentCompleted: boolean) => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/events`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          completed: !currentCompleted,
        }),
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return;

    setAddingNote(true);
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        setNewNote({
          title: '',
          content: '',
          sharedWithAmikaFriend: false,
        });
        setShowNoteForm(false);
        fetchNotes();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/amika-friends/${params.id}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleToggleNoteSharing = async (noteId: string, currentShared: boolean) => {
    try {
      const response = await fetch(`/api/amika-friends/${params.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          sharedWithAmikaFriend: !currentShared,
        }),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
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
          <p className="text-gray-600 mb-4">This user may not be connected with you.</p>
          <Button onClick={() => router.push('/friends')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.eventDate) >= now && !e.completed);
  const pastEvents = events.filter(e => new Date(e.eventDate) < now || e.completed);
  const filteredUpcomingEvents = selectedEventCategory === null
    ? upcomingEvents
    : upcomingEvents.filter(e => e.category === selectedEventCategory);

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

        {/* Profile Card */}
        <Card className="p-6 mb-6 border-[#A8C5A8]/20">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="w-20 h-20">
              {friend.profileImage ? (
                <AvatarImage src={friend.profileImage} alt={friend.name} />
              ) : null}
              <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-2xl">
                {friend.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{friend.name}</h1>
              <p className="text-sm text-gray-500">{friend.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-[#A8C5A8]/10 text-[#A8C5A8] rounded-full text-xs font-medium">
                <Share2 className="w-3 h-3" />
                Amika Friend
              </div>
            </div>
          </div>

          {friend.birthday && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Birthday:</span>{' '}
              {format(new Date(friend.birthday), 'MMMM d')}
            </div>
          )}

          <p className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            This is an Amika friend. You can add events, memories, and notes about your friendship.
            Toggle sharing to let them see what you&apos;ve shared.
          </p>
        </Card>

        {/* Interests Section */}
        {interests.length > 0 && (
          <Card className="p-6 border-[#A8C5A8]/20 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#A8C5A8]" />
              <h2 className="text-xl font-semibold">{friend.name}&apos;s Interests</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((interestId) => (
                <span
                  key={interestId}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#A8C5A8]/20 text-[#6B8E6B] border border-[#A8C5A8]/30"
                >
                  {getInterestLabel(interestId)}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Wishlist Section */}
        {wishlist.length > 0 && (
          <Card className="p-6 border-[#A8C5A8]/20 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-[#D4A5A5]" />
              <h2 className="text-xl font-semibold">{friend.name}&apos;s Wishlist</h2>
            </div>
            <div className="space-y-3">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-[#A8C5A8]/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {item.priority > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.priority === 2
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.priority === 2 ? 'Top Priority' : 'High Priority'}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {item.price && (
                          <span className="text-sm font-medium text-[#A8C5A8]">{item.price}</span>
                        )}
                        {item.category && (
                          <span className="text-xs text-gray-400 capitalize">{item.category}</span>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#A8C5A8] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Item
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Events Section */}
        <Card className="p-6 border-[#A8C5A8]/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A8C5A8]" />
              <h2 className="text-xl font-semibold">Events</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowEventForm(!showEventForm)}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </div>

          {showEventForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <Input
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
              />
              <Input
                placeholder="Location (optional)"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={2}
              />
              <select
                className="w-full p-2 border rounded-md"
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="experiences">Experiences</option>
                <option value="restaurants">Restaurants</option>
                <option value="places">Places</option>
                <option value="fitness">Fitness</option>
                <option value="virtual">Virtual</option>
              </select>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="event-share"
                    checked={newEvent.sharedWithAmikaFriend}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, sharedWithAmikaFriend: checked })}
                  />
                  <Label htmlFor="event-share" className="text-sm">
                    Share with {friend.name}
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEventForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddEvent}
                    disabled={addingEvent || !newEvent.title || !newEvent.eventDate}
                    className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                  >
                    {addingEvent ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {eventCategories.map((cat) => {
              const count = cat.value === null
                ? upcomingEvents.length
                : upcomingEvents.filter(e => e.category === cat.value).length;
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
                    <span className={`ml-0.5 ${selectedEventCategory === cat.value ? 'text-white/80' : 'text-gray-400'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredUpcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming events with {friend.name}.</p>
          ) : (
            <div className="space-y-3">
              {filteredUpcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(event.eventDate), 'PPP p')}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500">{event.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEventSharing(event.id, event.sharedWithAmikaFriend)}
                        className={`p-1.5 rounded-full ${
                          event.sharedWithAmikaFriend
                            ? 'bg-[#A8C5A8]/20 text-[#A8C5A8]'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={event.sharedWithAmikaFriend ? 'Shared' : 'Not shared'}
                      >
                        {event.sharedWithAmikaFriend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleEventComplete(event.id, event.completed)}
                        className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
                        title="Mark as completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Past Events ({pastEvents.length})</h3>
              <div className="space-y-2">
                {pastEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="p-2 bg-gray-50 rounded-lg opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${event.completed ? 'line-through text-gray-400' : ''}`}>
                          {event.title}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {format(new Date(event.eventDate), 'PP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {event.completed && (
                          <span className="text-xs text-green-600 font-medium">Completed</span>
                        )}
                        <button
                          onClick={() => handleToggleEventSharing(event.id, event.sharedWithAmikaFriend)}
                          className={`p-1 ${event.sharedWithAmikaFriend ? 'text-[#A8C5A8]' : 'text-gray-300'}`}
                        >
                          {event.sharedWithAmikaFriend ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Memories Section */}
        <Card className="p-6 border-[#A8C5A8]/20 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#D4A5A5]" />
            <h2 className="text-xl font-semibold">Memories</h2>
          </div>

          <div className="mb-4 space-y-3">
            <Textarea
              placeholder={`Add a memory with ${friend.name}...`}
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              rows={2}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="memory-share"
                  checked={newMemoryShared}
                  onCheckedChange={setNewMemoryShared}
                />
                <Label htmlFor="memory-share" className="text-sm">
                  Share with {friend.name}
                </Label>
              </div>
              <Button
                size="sm"
                onClick={handleAddMemory}
                disabled={addingMemory || !newMemoryContent.trim()}
                className="bg-[#D4A5A5] hover:bg-[#D4A5A5]/90 text-white"
              >
                {addingMemory ? 'Adding...' : 'Add Memory'}
              </Button>
            </div>
          </div>

          {memories.length === 0 ? (
            <p className="text-sm text-gray-500">No memories yet. Add your first memory with {friend.name}!</p>
          ) : (
            <div className="space-y-3">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                >
                  <p className="text-sm whitespace-pre-wrap">{memory.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMemorySharing(memory.id, memory.sharedWithAmikaFriend)}
                        className={`p-1.5 rounded-full ${
                          memory.sharedWithAmikaFriend
                            ? 'bg-[#A8C5A8]/20 text-[#A8C5A8]'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={memory.sharedWithAmikaFriend ? 'Shared' : 'Not shared'}
                      >
                        {memory.sharedWithAmikaFriend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteMemory(memory.id)}
                        className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notes Section */}
        <Card className="p-6 border-[#A8C5A8]/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#A8C5A8]" />
              <h2 className="text-xl font-semibold">Notes</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          </div>

          {showNoteForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <Input
                placeholder="Note title (optional)"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <Textarea
                placeholder="Write your note..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={4}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="note-share"
                    checked={newNote.sharedWithAmikaFriend}
                    onCheckedChange={(checked) => setNewNote({ ...newNote, sharedWithAmikaFriend: checked })}
                  />
                  <Label htmlFor="note-share" className="text-sm">
                    Share with {friend.name}
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNoteForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.content.trim()}
                    className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                  >
                    {addingNote ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet. Add notes about your friendship with {friend.name}!</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                >
                  {note.title && (
                    <h3 className="font-medium mb-1">{note.title}</h3>
                  )}
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleNoteSharing(note.id, note.sharedWithAmikaFriend)}
                        className={`p-1.5 rounded-full ${
                          note.sharedWithAmikaFriend
                            ? 'bg-[#A8C5A8]/20 text-[#A8C5A8]'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={note.sharedWithAmikaFriend ? 'Shared' : 'Not shared'}
                      >
                        {note.sharedWithAmikaFriend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

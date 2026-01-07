'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Phone, MessageSquare, Calendar, Coffee, Utensils, MapPin, Sparkles, Dumbbell, Video, Share2, Mail, Check, AlertCircle, Loader2 } from 'lucide-react';
import { LocationAutocomplete } from './location-autocomplete';
import { format } from 'date-fns';

// Quick event types
const quickEventTypes = [
  { icon: Phone, label: 'Phone Call', title: 'Phone call' },
  { icon: MessageSquare, label: 'Message', title: 'Send a message' },
  { icon: Coffee, label: 'Coffee', title: 'Coffee catch-up' },
  { icon: Calendar, label: 'Custom', title: '' },
];

// Time of day options for quick events
const timeOfDayOptions = [
  { label: 'Morning', hours: 9, minutes: 0 },
  { label: 'Afternoon', hours: 14, minutes: 0 },
  { label: 'Evening', hours: 18, minutes: 0 },
];

// Event categories
const eventCategories = [
  { value: null, label: 'None', icon: Calendar },
  { value: 'experiences', label: 'Experiences', icon: Sparkles },
  { value: 'restaurants', label: 'Restaurants', icon: Utensils },
  { value: 'places', label: 'Places', icon: MapPin },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell },
  { value: 'virtual', label: 'Virtual', icon: Video },
];

interface EventToEdit {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  category?: string | null;
  friendId: string;
  friends?: { id: string; name: string }[];
}

interface FriendWithLinkedUser {
  id: string;
  name: string;
  email?: string | null;
  linkedUserId?: string | null;
}

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: FriendWithLinkedUser[];
  onEventAdded?: () => void;
  eventToEdit?: EventToEdit | null;
  onEventUpdated?: () => void;
}

export function AddEventDialog({
  open,
  onOpenChange,
  friends,
  onEventAdded,
  eventToEdit,
  onEventUpdated,
}: AddEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareWithFriends, setShareWithFriends] = useState(false);

  // Quick event mode
  const [quickMode, setQuickMode] = useState(false);
  const [quickEventType, setQuickEventType] = useState<string | null>(null);
  const [quickEventDate, setQuickEventDate] = useState('');
  const [quickTimeOfDay, setQuickTimeOfDay] = useState<string | null>(null);

  // Google Calendar invite state
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [sendCalendarInvite, setSendCalendarInvite] = useState(false);
  const [calendarInviteStatus, setCalendarInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [calendarInviteMessage, setCalendarInviteMessage] = useState<string | null>(null);
  const [eventDuration, setEventDuration] = useState(60); // Duration in minutes

  const isEditMode = !!eventToEdit;

  // Check Google Calendar connection status
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch('/api/auth/google?action=status');
        if (response.ok) {
          const data = await response.json();
          setGoogleCalendarConnected(data.connected);
        }
      } catch (error) {
        console.error('Error checking Google connection:', error);
      }
    };
    checkGoogleConnection();
  }, []);

  // Check if any selected friend is an Amika friend (has linkedUserId)
  const hasAmikaFriends = selectedFriendIds.some(id => {
    const friend = friends.find(f => f.id === id);
    return friend?.linkedUserId;
  });

  // Get the Amika friends that are selected
  const selectedAmikaFriends = selectedFriendIds
    .map(id => friends.find(f => f.id === id))
    .filter(f => f?.linkedUserId) as FriendWithLinkedUser[];

  // Get friends with email addresses (either direct email or Amika friends with linked accounts)
  const selectedFriendsWithEmail = selectedFriendIds
    .map(id => friends.find(f => f.id === id))
    .filter(f => f && (f.email || f.linkedUserId)) as FriendWithLinkedUser[];

  const selectedFriendsWithoutEmail = selectedFriendIds
    .map(id => friends.find(f => f.id === id))
    .filter(f => f && !f.email && !f.linkedUserId) as FriendWithLinkedUser[];

  const canSendCalendarInvites = googleCalendarConnected && selectedFriendsWithEmail.length > 0;

  // Pre-fill form when editing
  useEffect(() => {
    if (eventToEdit && open) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setCategory(eventToEdit.category || null);
      // Set selected friend IDs from event's friends array or fallback to friendId
      const friendIdsFromEvent = eventToEdit.friends?.map(f => f.id) || [eventToEdit.friendId];
      setSelectedFriendIds(friendIdsFromEvent);
      // Format date for datetime-local input
      const date = new Date(eventToEdit.eventDate);
      setEventDate(format(date, "yyyy-MM-dd'T'HH:mm"));
      // Disable quick mode when editing
      setQuickMode(false);
      setQuickEventType(null);
    }
  }, [eventToEdit, open]);

  const handleQuickEventSelect = (eventType: { label: string; title: string }) => {
    if (eventType.label === 'Custom') {
      setQuickMode(false);
      setQuickEventType(null);
      return;
    }
    setQuickMode(true);
    setQuickEventType(eventType.label);
    setTitle(eventType.title);
  };

  const handleQuickSubmit = async () => {
    if (!quickEventDate || !quickTimeOfDay || selectedFriendIds.length === 0) {
      setError('Please select date, time, and at least one friend');
      return;
    }

    const timeOption = timeOfDayOptions.find(t => t.label === quickTimeOfDay);
    if (!timeOption) return;

    const date = new Date(quickEventDate);
    date.setHours(timeOption.hours, timeOption.minutes, 0, 0);

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `${quickEventType} with friend`,
          description: null,
          eventDate: date.toISOString(),
          location: null,
          friendId: selectedFriendIds[0],
          friendIds: selectedFriendIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Reset form
      resetForm();
      onOpenChange(false);
      onEventAdded?.();
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate('');
    setLocation('');
    setCategory(null);
    setSelectedFriendIds([]);
    setQuickMode(false);
    setQuickEventType(null);
    setQuickEventDate('');
    setQuickTimeOfDay(null);
    setError(null);
    setShareWithFriends(false);
    setSendCalendarInvite(false);
    setCalendarInviteStatus('idle');
    setCalendarInviteMessage(null);
    setEventDuration(60);
  };

  // Send calendar invite helper
  const sendGoogleCalendarInvite = async (eventTitle: string, eventDescription: string | null, eventLocation: string | null, eventDateStr: string) => {
    if (!sendCalendarInvite || !canSendCalendarInvites) return;

    setCalendarInviteStatus('sending');
    try {
      const response = await fetch('/api/google-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          location: eventLocation,
          eventDate: eventDateStr,
          friendIds: selectedFriendIds,
          duration: eventDuration,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCalendarInviteStatus('success');
        const invitedNames = data.attendees?.map((a: { name: string }) => a.name).join(', ');
        setCalendarInviteMessage(`Calendar invites sent to ${invitedNames}`);
      } else {
        setCalendarInviteStatus('error');
        setCalendarInviteMessage(data.error || 'Failed to send calendar invites');
      }
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      setCalendarInviteStatus('error');
      setCalendarInviteMessage('Failed to send calendar invites');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !eventDate || selectedFriendIds.length === 0) {
      setError('Title, date, and at least one friend are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode && eventToEdit) {
        // Update existing event
        const response = await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: eventToEdit.id,
            title: title.trim(),
            description: description.trim() || null,
            eventDate: new Date(eventDate).toISOString(),
            location: location.trim() || null,
            category: category,
            friendId: selectedFriendIds[0],
            friendIds: selectedFriendIds,
            sharedWithFriend: shareWithFriends,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update event');
        }

        resetForm();
        onOpenChange(false);
        onEventUpdated?.();
      } else {
        // Create new event
        const eventDateIso = new Date(eventDate).toISOString();
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            eventDate: eventDateIso,
            location: location.trim() || null,
            category: category,
            friendId: selectedFriendIds[0],
            friendIds: selectedFriendIds,
            sharedWithFriend: shareWithFriends,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create event');
        }

        // Send calendar invites if enabled
        if (sendCalendarInvite && canSendCalendarInvites) {
          await sendGoogleCalendarInvite(
            title.trim(),
            description.trim() || null,
            location.trim() || null,
            eventDateIso
          );
        }

        resetForm();
        onOpenChange(false);
        onEventAdded?.();
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError(isEditMode ? 'Failed to update event. Please try again.' : 'Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for the date input min
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] max-h-[85dvh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditMode ? 'Edit Event' : 'Plan an Event'}</DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Quick event type buttons - only show when not editing */}
        {!isEditMode && (
        <div className="grid grid-cols-4 gap-2 pb-4 border-b">
          {quickEventTypes.map((type) => (
            <button
              key={type.label}
              type="button"
              onClick={() => handleQuickEventSelect(type)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                quickEventType === type.label
                  ? 'border-[#A8C5A8] bg-[#A8C5A8]/10'
                  : 'border-gray-200 hover:border-[#A8C5A8]/50 hover:bg-[#A8C5A8]/5'
              }`}
            >
              <type.icon className={`w-5 h-5 ${
                quickEventType === type.label ? 'text-[#A8C5A8]' : 'text-gray-500'
              }`} />
              <span className="text-xs text-gray-700">{type.label}</span>
            </button>
          ))}
        </div>
        )}

        {/* Quick mode form - simplified for phone/message */}
        {!isEditMode && quickMode && (quickEventType === 'Phone Call' || quickEventType === 'Message') ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Friends* {selectedFriendIds.length > 0 && `(${selectedFriendIds.length} selected)`}</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriendIds.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriendIds([...selectedFriendIds, friend.id]);
                        } else {
                          setSelectedFriendIds(selectedFriendIds.filter(id => id !== friend.id));
                        }
                      }}
                      className="w-4 h-4 text-[#A8C5A8] border-gray-300 rounded focus:ring-[#A8C5A8]"
                    />
                    <span className="text-sm">{friend.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date*</label>
              <Input
                type="date"
                value={quickEventDate}
                onChange={(e) => setQuickEventDate(e.target.value)}
                min={today}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time of Day*</label>
              <div className="grid grid-cols-3 gap-2">
                {timeOfDayOptions.map((time) => (
                  <button
                    key={time.label}
                    type="button"
                    onClick={() => setQuickTimeOfDay(time.label)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      quickTimeOfDay === time.label
                        ? 'border-[#A8C5A8] bg-[#A8C5A8]/10 text-[#A8C5A8]'
                        : 'border-gray-200 hover:border-[#A8C5A8]/50 text-gray-700'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleQuickSubmit}
                disabled={saving}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                {saving ? 'Creating...' : `Schedule ${quickEventType}`}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Full form for custom events */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title*</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Coffee catch-up, Birthday party, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Friends* {selectedFriendIds.length > 0 && `(${selectedFriendIds.length} selected)`}</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriendIds.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriendIds([...selectedFriendIds, friend.id]);
                        } else {
                          setSelectedFriendIds(selectedFriendIds.filter(id => id !== friend.id));
                        }
                      }}
                      className="w-4 h-4 text-[#A8C5A8] border-gray-300 rounded focus:ring-[#A8C5A8]"
                    />
                    <span className="text-sm">{friend.name}</span>
                  </label>
                ))}
                {friends.length === 0 && (
                  <p className="text-sm text-gray-500 p-2">No friends available</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date & Time*</label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Search for a location..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {eventCategories.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      category === cat.value
                        ? 'border-[#D4A5A5] bg-[#D4A5A5]/10'
                        : 'border-gray-200 hover:border-[#D4A5A5]/50 hover:bg-[#D4A5A5]/5'
                    }`}
                  >
                    <cat.icon className={`w-4 h-4 ${
                      category === cat.value ? 'text-[#D4A5A5]' : 'text-gray-500'
                    }`} />
                    <span className="text-xs text-gray-700">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional"
              />
            </div>

            {/* Share with Amika friends option */}
            {hasAmikaFriends && (
              <div className="space-y-2 p-3 bg-[#A8C5A8]/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#A8C5A8]" />
                  <span className="text-sm font-medium">Share with Amika friends</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="share-event"
                    checked={shareWithFriends}
                    onCheckedChange={setShareWithFriends}
                  />
                  <Label htmlFor="share-event" className="text-sm text-gray-600">
                    Share this event with {selectedAmikaFriends.map(f => f.name).join(', ')}
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  The event will appear in their Amika app
                </p>
              </div>
            )}

            {/* Google Calendar invite option */}
            {selectedFriendIds.length > 0 && !isEditMode && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Google Calendar Invite</span>
                </div>

                {googleCalendarConnected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="calendar-invite"
                        checked={sendCalendarInvite}
                        onCheckedChange={setSendCalendarInvite}
                        disabled={selectedFriendsWithEmail.length === 0}
                      />
                      <Label htmlFor="calendar-invite" className="text-sm text-gray-600">
                        Send calendar invites to friends
                      </Label>
                    </div>

                    {sendCalendarInvite && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="duration" className="text-sm text-gray-600 whitespace-nowrap">
                            Duration:
                          </Label>
                          <select
                            id="duration"
                            value={eventDuration}
                            onChange={(e) => setEventDuration(Number(e.target.value))}
                            className="text-sm border border-gray-200 rounded px-2 py-1"
                          >
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                            <option value={180}>3 hours</option>
                          </select>
                        </div>

                        {selectedFriendsWithEmail.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center gap-1 mb-1">
                              <Mail className="w-3 h-3" />
                              <span>Invites will be sent to:</span>
                            </div>
                            <ul className="ml-4 space-y-0.5">
                              {selectedFriendsWithEmail.map(f => (
                                <li key={f.id} className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-600" />
                                  {f.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedFriendsWithoutEmail.length > 0 && (
                          <div className="text-xs text-amber-600">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>No email available for:</span>
                            </div>
                            <ul className="ml-4 space-y-0.5">
                              {selectedFriendsWithoutEmail.map(f => (
                                <li key={f.id}>{f.name}</li>
                              ))}
                            </ul>
                            <p className="mt-1 text-gray-500">
                              Add email addresses in their friend profile to send invites.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {calendarInviteStatus === 'sending' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending calendar invites...
                      </div>
                    )}

                    {calendarInviteStatus === 'success' && calendarInviteMessage && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        {calendarInviteMessage}
                      </div>
                    )}

                    {calendarInviteStatus === 'error' && calendarInviteMessage && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {calendarInviteMessage}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Connect Google Calendar in your profile to send event invites to friends.</p>
                    <a
                      href="/profile"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Go to Profile Settings
                    </a>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                {saving
                  ? (isEditMode ? 'Updating...' : 'Creating...')
                  : (isEditMode ? 'Update Event' : 'Create Event')}
              </Button>
            </DialogFooter>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
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
import { Phone, MessageSquare, Calendar, Coffee } from 'lucide-react';

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

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: { id: string; name: string }[];
  onEventAdded?: () => void;
}

export function AddEventDialog({
  open,
  onOpenChange,
  friends,
  onEventAdded,
}: AddEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick event mode
  const [quickMode, setQuickMode] = useState(false);
  const [quickEventType, setQuickEventType] = useState<string | null>(null);
  const [quickEventDate, setQuickEventDate] = useState('');
  const [quickTimeOfDay, setQuickTimeOfDay] = useState<string | null>(null);

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
    if (!quickEventDate || !quickTimeOfDay || !selectedFriendId) {
      setError('Please select date, time, and friend');
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
          friendId: selectedFriendId,
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
    setSelectedFriendId('');
    setQuickMode(false);
    setQuickEventType(null);
    setQuickEventDate('');
    setQuickTimeOfDay(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !eventDate || !selectedFriendId) {
      setError('Title, date, and friend are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          eventDate: new Date(eventDate).toISOString(),
          location: location.trim() || null,
          friendId: selectedFriendId,
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

  // Get today's date in YYYY-MM-DD format for the date input min
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan an Event</DialogTitle>
        </DialogHeader>

        {/* Quick event type buttons */}
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

        {/* Quick mode form - simplified for phone/message */}
        {quickMode && (quickEventType === 'Phone Call' || quickEventType === 'Message') ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Friend*</label>
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C5A8] focus:border-transparent"
              >
                <option value="">Select a friend...</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.name}
                  </option>
                ))}
              </select>
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
              <label className="text-sm font-medium">Friend*</label>
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C5A8] focus:border-transparent"
                required
              >
                <option value="">Select a friend...</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.name}
                  </option>
                ))}
              </select>
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
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Optional"
              />
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
                {saving ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

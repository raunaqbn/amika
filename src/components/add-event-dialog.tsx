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
      setTitle('');
      setDescription('');
      setEventDate('');
      setLocation('');
      setSelectedFriendId('');
      onOpenChange(false);
      onEventAdded?.();
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan an Event</DialogTitle>
        </DialogHeader>

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
              onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MapPin, Check, Edit2 } from 'lucide-react';

interface EventPlan {
  id: string;
  userId: string;
  eventLocation: string | null;
}

interface EventPlanLocationSectionProps {
  eventPlan: EventPlan;
  onUpdate: (updates: Partial<EventPlan>) => void;
}

export function EventPlanLocationSection({
  eventPlan,
  onUpdate,
}: EventPlanLocationSectionProps) {
  const [editing, setEditing] = useState(false);
  const [eventLocation, setEventLocation] = useState(eventPlan.eventLocation || '');

  const handleSave = () => {
    onUpdate({
      eventLocation: eventLocation.trim() || null,
    });
    setEditing(false);
  };

  const hasLocationSet = eventPlan.eventLocation;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#A8C5A8]" />
          <h3 className="font-semibold">Event Location</h3>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4 mr-1" />
            {hasLocationSet ? 'Edit' : 'Set Location'}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Location</label>
            <Input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA or 123 Main St"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This location will be used as the default for Amika recommendations
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#A8C5A8] hover:bg-[#97b497]"
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {hasLocationSet ? (
            <div className="bg-[#A8C5A8]/10 px-4 py-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-semibold">{eventPlan.eventLocation}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No location set yet</p>
              <p className="text-sm">Click &quot;Set Location&quot; to add event location</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

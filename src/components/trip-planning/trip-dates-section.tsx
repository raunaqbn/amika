'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TripPollComponent } from './trip-poll';
import { CreatePollDialog } from './create-poll-dialog';
import { Calendar, Check, Edit2, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

interface TripPoll {
  id: string;
  tripId: string;
  context: string;
  question: string;
  status: string;
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
  options?: any[];
}

interface Trip {
  id: string;
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
}

interface TripDatesSectionProps {
  trip: Trip;
  onUpdate: (updates: Partial<Trip>) => void;
  polls: TripPoll[];
  tripId: string;
  currentUserId?: string;
  onRefresh?: () => void;
}

export function TripDatesSection({
  trip,
  onUpdate,
  polls,
  tripId,
  currentUserId,
  onRefresh,
}: TripDatesSectionProps) {
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(
    trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : ''
  );
  const [endDate, setEndDate] = useState(
    trip.endDate ? format(new Date(trip.endDate), 'yyyy-MM-dd') : ''
  );
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const handleSave = () => {
    onUpdate({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });
    setEditing(false);
  };

  const hasDateSet = trip.startDate && trip.endDate;

  return (
    <div className="space-y-4">
      {/* Date Selection Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A8C5A8]" />
            <h3 className="font-semibold">Trip Dates</h3>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-1" />
              {hasDateSet ? 'Edit' : 'Set Dates'}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
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
            {hasDateSet ? (
              <div className="space-y-2">
                <div className="bg-[#A8C5A8]/10 px-4 py-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-semibold">
                    {format(new Date(trip.startDate!), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-center text-muted-foreground">↓</div>
                <div className="bg-[#A8C5A8]/10 px-4 py-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-semibold">
                    {format(new Date(trip.endDate!), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No dates set yet</p>
                <p className="text-sm">Click &quot;Set Dates&quot; to add trip dates</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Polls Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground">
            ACTIVE POLLS
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreatePoll(true)}
            className="text-xs"
          >
            <BarChart2 className="w-3 h-3 mr-1" />
            Create Poll
          </Button>
        </div>

        {polls.filter((p) => p.status === 'active').length > 0 ? (
          polls
            .filter((p) => p.status === 'active')
            .map((poll) => (
              <TripPollComponent
                key={poll.id}
                poll={poll}
                tripId={tripId}
                currentUserId={currentUserId}
                onVote={onRefresh}
                onDelete={onRefresh}
                onClose={onRefresh}
                onEdit={onRefresh}
              />
            ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active polls yet
          </p>
        )}
      </div>

      {/* Closed Polls */}
      {polls.filter((p) => p.status === 'closed').length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            CLOSED POLLS
          </h4>
          {polls
            .filter((p) => p.status === 'closed')
            .map((poll) => (
              <TripPollComponent
                key={poll.id}
                poll={poll}
                tripId={tripId}
                currentUserId={currentUserId}
                onDelete={onRefresh}
              />
            ))}
        </div>
      )}

      {/* Create Poll Dialog */}
      <CreatePollDialog
        open={showCreatePoll}
        onOpenChange={setShowCreatePoll}
        tripId={tripId}
        context="dates"
        onPollCreated={onRefresh}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EventPlanPollComponent } from './event-plan-poll';
import { CreatePollDialog } from './create-poll-dialog';
import { Calendar, Check, Edit2, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

interface EventPlanPoll {
  id: string;
  eventPlanId: string;
  context: string;
  question: string;
  status: string;
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
  options?: any[];
}

interface EventPlan {
  id: string;
  userId: string;
  eventDate: Date | null;
  eventTime: string | null;
}

interface EventPlanDateSectionProps {
  eventPlan: EventPlan;
  onUpdate: (updates: Partial<EventPlan>) => void;
  polls: EventPlanPoll[];
  eventPlanId: string;
  currentUserId?: string;
  onRefresh?: () => void;
}

export function EventPlanDateSection({
  eventPlan,
  onUpdate,
  polls,
  eventPlanId,
  currentUserId,
  onRefresh,
}: EventPlanDateSectionProps) {
  const [editing, setEditing] = useState(false);
  const [eventDate, setEventDate] = useState(
    eventPlan.eventDate ? format(new Date(eventPlan.eventDate), 'yyyy-MM-dd') : ''
  );
  const [eventTime, setEventTime] = useState(eventPlan.eventTime || '');
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const handleSave = () => {
    onUpdate({
      eventDate: eventDate ? new Date(eventDate) : null,
      eventTime: eventTime || null,
    });
    setEditing(false);
  };

  const hasDateSet = eventPlan.eventDate;

  return (
    <div className="space-y-4">
      {/* Date Selection Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A8C5A8]" />
            <h3 className="font-semibold">Event Date & Time</h3>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-1" />
              {hasDateSet ? 'Edit' : 'Set Date'}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Time (optional)</label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
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
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {format(new Date(eventPlan.eventDate!), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                {eventPlan.eventTime && (
                  <div className="bg-[#A8C5A8]/10 px-4 py-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-semibold">{eventPlan.eventTime}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No date set yet</p>
                <p className="text-sm">Click &quot;Set Date&quot; to add event date</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Polls Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground">
            DATE POLLS
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
              <EventPlanPollComponent
                key={poll.id}
                poll={poll}
                eventPlanId={eventPlanId}
                currentUserId={currentUserId}
                onVote={onRefresh}
                onDelete={onRefresh}
                onClose={onRefresh}
                onEdit={onRefresh}
              />
            ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active date polls yet
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
              <EventPlanPollComponent
                key={poll.id}
                poll={poll}
                eventPlanId={eventPlanId}
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
        eventPlanId={eventPlanId}
        context="date"
        onPollCreated={onRefresh}
      />
    </div>
  );
}

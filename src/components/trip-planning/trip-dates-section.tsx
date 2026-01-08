'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TripChat } from './trip-chat';
import { TripPollComponent } from './trip-poll';
import { CreatePollDialog } from './create-poll-dialog';
import { Calendar, Check, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  tripId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  createdAt: Date;
}

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

interface Collaborator {
  id: string;
  tripId: string;
  friendId: string;
  userId: string | null;
  role: string;
  joinedAt: Date;
  friendName: string;
  profileImage: string | null;
  linkedUserId: string | null;
}

interface CurrentUser {
  id: string;
  name: string;
  profileImage: string | null;
}

interface TypingUser {
  id: string;
  name: string;
}

interface ActiveUser {
  id: string;
  name: string;
  profileImage: string | null;
  lastSeen: Date;
}

interface TripDatesSectionProps {
  trip: Trip;
  onUpdate: (updates: Partial<Trip>) => void;
  messages: Message[];
  polls: TripPoll[];
  tripId: string;
  currentUser: CurrentUser;
  collaborators: Collaborator[];
  typingUsers?: TypingUser[];
  activeUsers?: ActiveUser[];
}

export function TripDatesSection({
  trip,
  onUpdate,
  messages,
  polls,
  tripId,
  currentUser,
  collaborators,
  typingUsers = [],
  activeUsers = [],
}: TripDatesSectionProps) {
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(
    trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : ''
  );
  const [endDate, setEndDate] = useState(
    trip.endDate ? format(new Date(trip.endDate), 'yyyy-MM-dd') : ''
  );
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const handleSave = () => {
    onUpdate({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });
    setEditing(false);
  };

  const handleNewMessage = (message: Message) => {
    setLocalMessages((prev) => [...prev, message]);
  };

  const allMessages = [...messages, ...localMessages.filter(
    (m) => !messages.find((msg) => msg.id === m.id)
  )];

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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex items-center gap-4">
                <div className="bg-[#A8C5A8]/10 px-4 py-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-semibold">
                    {format(new Date(trip.startDate!), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-muted-foreground">→</div>
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
                <p className="text-sm">Click &quot;Set Dates&quot; or discuss with your group below</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Active Polls */}
      {polls.filter((p) => p.status === 'active').length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            ACTIVE POLLS
          </h4>
          {polls
            .filter((p) => p.status === 'active')
            .map((poll) => (
              <TripPollComponent
                key={poll.id}
                poll={poll}
                tripId={tripId}
              />
            ))}
        </div>
      )}

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
              />
            ))}
        </div>
      )}

      {/* Chat */}
      <TripChat
        tripId={tripId}
        context="dates"
        messages={allMessages}
        currentUser={currentUser}
        collaborators={collaborators}
        tripOwnerId={trip.userId}
        onNewMessage={handleNewMessage}
        onCreatePoll={() => setShowCreatePoll(true)}
        typingUsers={typingUsers}
        activeUsers={activeUsers}
      />

      {/* Create Poll Dialog */}
      <CreatePollDialog
        open={showCreatePoll}
        onOpenChange={setShowCreatePoll}
        tripId={tripId}
        context="dates"
      />
    </div>
  );
}

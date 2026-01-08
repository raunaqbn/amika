'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TripChat } from './trip-chat';
import { TripPollComponent } from './trip-poll';
import { CreatePollDialog } from './create-poll-dialog';
import { LocationAutocomplete } from '../location-autocomplete';
import { MapPin, Check, Edit2 } from 'lucide-react';

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
  location: string | null;
  locationDetails: string | null;
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

interface TripLocationSectionProps {
  trip: Trip;
  onUpdate: (updates: Partial<Trip>) => void;
  messages: Message[];
  polls: TripPoll[];
  tripId: string;
  currentUserId?: string;
  onRefresh?: () => void;
  currentUser: CurrentUser;
  collaborators: Collaborator[];
  typingUsers?: TypingUser[];
  activeUsers?: ActiveUser[];
}

export function TripLocationSection({
  trip,
  onUpdate,
  messages,
  polls,
  tripId,
  currentUserId,
  onRefresh,
  currentUser,
  collaborators,
  typingUsers = [],
  activeUsers = [],
}: TripLocationSectionProps) {
  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useState(trip.location || '');
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const handleSave = () => {
    onUpdate({
      location: location || null,
    });
    setEditing(false);
  };

  const handleNewMessage = (message: Message) => {
    setLocalMessages((prev) => [...prev, message]);
  };

  const allMessages = [...messages, ...localMessages.filter(
    (m) => !messages.find((msg) => msg.id === m.id)
  )];

  const hasLocation = !!trip.location;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left Column - Chat */}
      <div className="flex-1 order-2 lg:order-1">
        <TripChat
          tripId={tripId}
          context="location"
          messages={allMessages}
          currentUser={currentUser}
          collaborators={collaborators}
          tripOwnerId={trip.userId}
          onNewMessage={handleNewMessage}
          onCreatePoll={() => setShowCreatePoll(true)}
          typingUsers={typingUsers}
          activeUsers={activeUsers}
        />
      </div>

      {/* Right Column - Location Card and Polls */}
      <div className="w-full lg:w-80 space-y-4 order-1 lg:order-2">
        {/* Location Selection Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#A8C5A8]" />
              <h3 className="font-semibold">Destination</h3>
            </div>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" />
                {hasLocation ? 'Edit' : 'Set Location'}
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <LocationAutocomplete
                value={location}
                onChange={(value) => setLocation(value)}
                placeholder="Search for a city or destination..."
              />
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
              {hasLocation ? (
                <div className="bg-[#A8C5A8]/10 px-4 py-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#A8C5A8]" />
                    <p className="font-semibold text-lg">{trip.location}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No destination set yet</p>
                  <p className="text-sm">
                    Click &quot;Set Location&quot; or discuss options with your group
                  </p>
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
                  currentUserId={currentUserId}
                  onVote={onRefresh}
                  onDelete={onRefresh}
                  onClose={onRefresh}
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
                  currentUserId={currentUserId}
                  onDelete={onRefresh}
                />
              ))}
          </div>
        )}
      </div>

      {/* Create Poll Dialog */}
      <CreatePollDialog
        open={showCreatePoll}
        onOpenChange={setShowCreatePoll}
        tripId={tripId}
        context="location"
        onPollCreated={onRefresh}
      />
    </div>
  );
}

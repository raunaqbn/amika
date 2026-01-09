'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { EventPlanPollComponent } from './event-plan-poll';
import { CreatePollDialog } from './create-poll-dialog';
import { AddEventDialog } from '../add-event-dialog';
import {
  Plus,
  Sparkles,
  Check,
  ExternalLink,
  MapPin,
  DollarSign,
  Clock,
  Trash2,
  BarChart2,
  Star,
  Edit2,
  X,
} from 'lucide-react';

interface EventPlanCandidate {
  id: string;
  eventPlanId: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  eventDate: Date | null;
  eventTime: string | null;
  estimatedCost: number | null;
  notes: string | null;
  order: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

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

interface FriendWithLinkedUser {
  id: string;
  name: string;
  email?: string | null;
  linkedUserId?: string | null;
}

interface CandidatesSectionProps {
  eventPlanId: string;
  candidates: EventPlanCandidate[];
  selectedEventId: string | null;
  polls: EventPlanPoll[];
  currentUserId?: string;
  onSelectEvent: (candidateId: string | null) => void;
  onRefresh: () => void;
}

export function CandidatesSection({
  eventPlanId,
  candidates,
  selectedEventId,
  polls,
  currentUserId,
  onSelectEvent,
  onRefresh,
}: CandidatesSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<EventPlanCandidate | null>(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendWithLinkedUser[]>([]);

  // Fetch friends for the dialog
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends');
        if (response.ok) {
          const data = await response.json();
          setFriends(data);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriends();
  }, []);

  const handleDelete = async (candidateId: string) => {
    if (!confirm('Are you sure you want to remove this event option?')) return;

    setDeleting(candidateId);
    try {
      const response = await fetch(
        `/api/event-plans/${eventPlanId}/candidates?candidateId=${candidateId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        if (selectedEventId === candidateId) {
          onSelectEvent(null);
        }
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
    } finally {
      setDeleting(null);
    }
  };

  const startEditing = (candidate: EventPlanCandidate) => {
    setEditingCandidate(candidate);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowAddDialog(false);
      setEditingCandidate(null);
    }
  };

  const handleEventOptionAdded = () => {
    setShowAddDialog(false);
    onRefresh();
  };

  const handleEventOptionUpdated = () => {
    setEditingCandidate(null);
    onRefresh();
  };

  const handleFriendsUpdated = async () => {
    // Refetch friends list after a new friend is added
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const selectedCandidate = candidates.find(c => c.id === selectedEventId);

  return (
    <div className="space-y-4">
      {/* Selected Event Display */}
      {selectedCandidate && (
        <Card className="p-6 border-2 border-[#A8C5A8]">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-[#A8C5A8] fill-[#A8C5A8]" />
            <h3 className="font-semibold">Selected Event</h3>
          </div>
          <div className="bg-[#A8C5A8]/10 p-4 rounded-lg">
            <h4 className="font-semibold text-lg">{selectedCandidate.title}</h4>
            {selectedCandidate.description && (
              <p className="text-sm text-muted-foreground mt-1">{selectedCandidate.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              {selectedCandidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedCandidate.location}
                </span>
              )}
              {selectedCandidate.eventTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedCandidate.eventTime}
                </span>
              )}
              {selectedCandidate.estimatedCost && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${selectedCandidate.estimatedCost}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onSelectEvent(null)}
            >
              <X className="w-4 h-4 mr-1" />
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Event Options List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#A8C5A8]" />
            <h3 className="font-semibold">Event Options</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Option
          </Button>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No event options yet</p>
            <p className="text-sm">Add some options the group can vote on</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`p-4 rounded-lg border transition-colors ${
                  candidate.id === selectedEventId
                    ? 'border-[#A8C5A8] bg-[#A8C5A8]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{candidate.title}</h4>
                      {candidate.id === selectedEventId && (
                        <Check className="w-4 h-4 text-[#A8C5A8]" />
                      )}
                    </div>
                    {candidate.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {candidate.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {candidate.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {candidate.location}
                        </span>
                      )}
                      {candidate.eventTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {candidate.eventTime}
                        </span>
                      )}
                      {candidate.estimatedCost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${candidate.estimatedCost}
                        </span>
                      )}
                      {candidate.externalUrl && (
                        <a
                          href={candidate.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectEvent(candidate.id === selectedEventId ? null : candidate.id)}
                      className={candidate.id === selectedEventId ? 'text-[#A8C5A8]' : ''}
                    >
                      {candidate.id === selectedEventId ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-1" />
                          Select
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(candidate)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(candidate.id)}
                      disabled={deleting === candidate.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Polls Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground">
            EVENT POLLS
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
            No active event polls yet
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
        context="event"
        onPollCreated={onRefresh}
      />

      {/* Add Event Option Dialog */}
      <AddEventDialog
        open={showAddDialog}
        onOpenChange={handleDialogClose}
        friends={friends}
        mode="eventOption"
        eventPlanId={eventPlanId}
        onEventOptionAdded={handleEventOptionAdded}
        onFriendsUpdated={handleFriendsUpdated}
      />

      {/* Edit Event Option Dialog */}
      {editingCandidate && (
        <AddEventDialog
          open={!!editingCandidate}
          onOpenChange={(open) => !open && setEditingCandidate(null)}
          friends={friends}
          mode="eventOption"
          eventPlanId={eventPlanId}
          eventOptionToEdit={{
            id: editingCandidate.id,
            title: editingCandidate.title,
            description: editingCandidate.description,
            eventDate: editingCandidate.eventDate,
            eventTime: editingCandidate.eventTime,
            location: editingCandidate.location,
            category: editingCandidate.category,
            estimatedCost: editingCandidate.estimatedCost,
            externalUrl: editingCandidate.externalUrl,
            notes: editingCandidate.notes,
          }}
          onEventOptionUpdated={handleEventOptionUpdated}
          onFriendsUpdated={handleFriendsUpdated}
        />
      )}
    </div>
  );
}

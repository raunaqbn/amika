'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { TripChat } from './trip-chat';
import { TripPollComponent } from './trip-poll';
import { CreatePollDialog } from './create-poll-dialog';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  DollarSign,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  Utensils,
  Dumbbell,
  Video,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

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

interface TripEvent {
  id: string;
  dailyPlanId: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  category: string | null;
  externalUrl: string | null;
  estimatedCost: number | null;
  notes: string | null;
  order: number;
}

interface DailyPlan {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date | null;
  events: TripEvent[];
}

interface Trip {
  id: string;
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
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

interface TripEventsSectionProps {
  trip: Trip;
  dailyPlans: DailyPlan[];
  messages: Message[];
  polls: TripPoll[];
  tripId: string;
  onRefresh: () => void;
  currentUser: CurrentUser;
  collaborators: Collaborator[];
  typingUsers?: TypingUser[];
  activeUsers?: ActiveUser[];
}

const categoryIcons: Record<string, any> = {
  experiences: Sparkles,
  restaurants: Utensils,
  places: MapPin,
  fitness: Dumbbell,
  virtual: Video,
};

export function TripEventsSection({
  trip,
  dailyPlans,
  messages,
  polls,
  tripId,
  onRefresh,
  currentUser,
  collaborators,
  typingUsers = [],
  activeUsers = [],
}: TripEventsSectionProps) {
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true });
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDayPlanId, setSelectedDayPlanId] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState(false);

  const handleNewMessage = (message: Message) => {
    setLocalMessages((prev) => [...prev, message]);
  };

  const allMessages = [...messages, ...localMessages.filter(
    (m) => !messages.find((msg) => msg.id === m.id)
  )];

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) => ({ ...prev, [dayNumber]: !prev[dayNumber] }));
  };

  const handleAddDay = async () => {
    setAddingDay(true);
    try {
      const nextDayNumber = dailyPlans.length + 1;
      const response = await fetch(`/api/trips/${tripId}/daily-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: nextDayNumber }),
      });

      if (response.ok) {
        onRefresh();
        setOpenDays((prev) => ({ ...prev, [nextDayNumber]: true }));
      }
    } catch (error) {
      console.error('Error adding day:', error);
    } finally {
      setAddingDay(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/events?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Daily Plans */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#A8C5A8]" />
            <h3 className="font-semibold">Daily Itinerary</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddDay}
            disabled={addingDay}
          >
            {addingDay ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            Add Day
          </Button>
        </div>

        {dailyPlans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No days planned yet</p>
            <p className="text-sm">Add a day to start planning your itinerary</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyPlans.map((day) => (
              <Collapsible
                key={day.id}
                open={openDays[day.dayNumber]}
                onOpenChange={() => toggleDay(day.dayNumber)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      {openDays[day.dayNumber] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">Day {day.dayNumber}</span>
                      {day.date && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {day.events.length} event{day.events.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pl-6 space-y-2">
                    {day.events.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No events for this day
                      </p>
                    ) : (
                      day.events.map((event) => {
                        const CategoryIcon = event.category
                          ? categoryIcons[event.category] || MapPin
                          : MapPin;
                        return (
                          <div
                            key={event.id}
                            className="p-3 border rounded-lg bg-white"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <CategoryIcon className="w-4 h-4 mt-0.5 text-[#A8C5A8]" />
                                <div>
                                  <p className="font-medium">{event.title}</p>
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {event.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    {event.startTime && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {event.startTime}
                                        {event.endTime && ` - ${event.endTime}`}
                                      </span>
                                    )}
                                    {event.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {event.location}
                                      </span>
                                    )}
                                    {event.estimatedCost && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {event.estimatedCost}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {event.externalUrl && (
                                  <a
                                    href={event.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="p-1 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedDayPlanId(day.id);
                        setShowAddEvent(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Event
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
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
        context="events"
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
        context="events"
      />

      {/* Add Event Dialog */}
      <AddTripEventDialog
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
        tripId={tripId}
        dailyPlanId={selectedDayPlanId}
        onEventAdded={onRefresh}
      />
    </div>
  );
}

// Add Trip Event Dialog Component
function AddTripEventDialog({
  open,
  onOpenChange,
  tripId,
  dailyPlanId,
  onEventAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  dailyPlanId: string | null;
  onEventAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyPlanId || !title.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyPlanId,
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          location: location.trim() || undefined,
          category: category || undefined,
          externalUrl: externalUrl.trim() || undefined,
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        }),
      });

      if (response.ok) {
        onEventAdded();
        onOpenChange(false);
        // Reset form
        setTitle('');
        setDescription('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setCategory('');
        setExternalUrl('');
        setEstimatedCost('');
      }
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { value: 'experiences', label: 'Experience' },
    { value: 'restaurants', label: 'Restaurant' },
    { value: 'places', label: 'Place' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'virtual', label: 'Virtual' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="Event location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Est. Cost</label>
              <Input
                type="number"
                placeholder="0.00"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">External URL</label>
            <Input
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !title.trim()}
              className="bg-[#A8C5A8] hover:bg-[#97b497]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Event'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { TripPollComponent } from './trip-poll';
import { CreatePollDialog } from './create-poll-dialog';
import {
  Ticket,
  Plus,
  Plane,
  Hotel,
  Car,
  Train,
  Ship,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  User,
  FileText,
  BarChart2,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
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

interface TripTicket {
  id: string;
  tripId: string;
  collaboratorId: string | null;
  type: string;
  title: string;
  description: string | null;
  confirmationNum: string | null;
  departureTime: Date | null;
  arrivalTime: Date | null;
  location: string | null;
  cost: number | null;
  currency: string;
  url: string | null;
  passengerName: string | null;
  flightDirection: 'outbound' | 'return' | null;
  departureLocation: string | null;
  arrivalLocation: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
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

interface Trip {
  id: string;
  userId: string;
  title: string;
}

interface TripTicketsSectionProps {
  trip: Trip;
  tickets: TripTicket[];
  polls: TripPoll[];
  collaborators: Collaborator[];
  tripId: string;
  currentUserId?: string;
  onRefresh: () => void;
}

const ticketTypeIcons: Record<string, any> = {
  flight: Plane,
  hotel: Hotel,
  car: Car,
  train: Train,
  cruise: Ship,
  other: Ticket,
};

const ticketTypes = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'car', label: 'Car Rental', icon: Car },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'cruise', label: 'Cruise', icon: Ship },
  { value: 'other', label: 'Other', icon: Ticket },
];

export function TripTicketsSection({
  trip,
  tickets,
  polls,
  collaborators,
  tripId,
  currentUserId: currentUserIdProp,
  onRefresh,
}: TripTicketsSectionProps) {
  const currentUserId = currentUserIdProp || trip.userId;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [currentUserId]: true,
  });
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showAddTicket, setShowAddTicket] = useState(false);

  const toggleSection = (userId: string) => {
    setOpenSections((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/tickets?ticketId=${ticketId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  // Group tickets by uploader (user)
  const ticketsByUser = tickets.reduce((acc, ticket) => {
    const userId = ticket.createdById;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(ticket);
    return acc;
  }, {} as Record<string, TripTicket[]>);

  // Get user display info
  const getUserName = (userId: string) => {
    if (userId === currentUserId) return 'My Tickets';
    const collaborator = collaborators.find(
      (c) => c.userId === userId || c.friendId === userId
    );
    return collaborator?.friendName || 'Unknown';
  };

  // Calculate total cost per user
  const getTotalCost = (userTickets: TripTicket[]) => {
    return userTickets.reduce((sum, t) => sum + (t.cost || 0), 0);
  };

  // Get all unique users who have tickets
  const usersWithTickets = Object.keys(ticketsByUser);

  return (
    <div className="space-y-4">
      {/* Tickets by Person */}
      <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#A8C5A8]" />
              <h3 className="font-semibold">Travel Documents</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTicket(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Ticket
            </Button>
          </div>

          {usersWithTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tickets added yet</p>
              <p className="text-sm">Add your travel confirmations and documents</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Current user's tickets first */}
              {ticketsByUser[currentUserId] && (
                <TicketUserSection
                  userId={currentUserId}
                  userName="My Tickets"
                  tickets={ticketsByUser[currentUserId]}
                  isOpen={openSections[currentUserId]}
                  onToggle={() => toggleSection(currentUserId)}
                  onDelete={handleDeleteTicket}
                  totalCost={getTotalCost(ticketsByUser[currentUserId])}
                />
              )}

              {/* Other collaborators' tickets */}
              {usersWithTickets
                .filter((userId) => userId !== currentUserId)
                .map((userId) => (
                  <TicketUserSection
                    key={userId}
                    userId={userId}
                    userName={getUserName(userId)}
                    tickets={ticketsByUser[userId]}
                    isOpen={openSections[userId]}
                    onToggle={() => toggleSection(userId)}
                    onDelete={handleDeleteTicket}
                    totalCost={getTotalCost(ticketsByUser[userId])}
                    isOther
                  />
                ))}
            </div>
          )}

          {/* Total Trip Cost Summary */}
          {tickets.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Trip Cost</span>
                <span className="font-semibold text-lg">
                  ${tickets.reduce((sum, t) => sum + (t.cost || 0), 0).toFixed(2)}
                </span>
              </div>
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
        context="tickets"
        onPollCreated={onRefresh}
      />

      {/* Add Ticket Dialog */}
      <AddTicketDialog
        open={showAddTicket}
        onOpenChange={setShowAddTicket}
        tripId={tripId}
        onTicketAdded={onRefresh}
      />
    </div>
  );
}

// Ticket User Section Component
function TicketUserSection({
  userId,
  userName,
  tickets,
  isOpen,
  onToggle,
  onDelete,
  totalCost,
  isOther = false,
}: {
  userId: string;
  userName: string;
  tickets: TripTicket[];
  isOpen: boolean;
  onToggle: () => void;
  onDelete: (ticketId: string) => void;
  totalCost: number;
  isOther?: boolean;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <User className="w-4 h-4 text-[#A8C5A8]" />
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-medium">
              ${totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2 pl-6 space-y-2">
          {tickets.map((ticket) => {
            const TypeIcon = ticketTypeIcons[ticket.type] || Ticket;
            const isFlight = ticket.type === 'flight';
            return (
              <div
                key={ticket.id}
                className="p-3 border rounded-lg bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <TypeIcon className="w-4 h-4 mt-0.5 text-[#A8C5A8]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{ticket.title}</p>
                        {isFlight && ticket.flightDirection && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ticket.flightDirection === 'outbound'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {ticket.flightDirection === 'outbound' ? 'Outbound' : 'Return'}
                          </span>
                        )}
                      </div>
                      {ticket.passengerName && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.passengerName}
                        </p>
                      )}
                      {isFlight && (ticket.departureLocation || ticket.arrivalLocation) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {ticket.departureLocation && (
                            <span className="flex items-center gap-1">
                              <PlaneTakeoff className="w-3 h-3" />
                              {ticket.departureLocation}
                            </span>
                          )}
                          {ticket.departureLocation && ticket.arrivalLocation && (
                            <ArrowRight className="w-3 h-3" />
                          )}
                          {ticket.arrivalLocation && (
                            <span className="flex items-center gap-1">
                              <PlaneLanding className="w-3 h-3" />
                              {ticket.arrivalLocation}
                            </span>
                          )}
                        </div>
                      )}
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {ticket.description}
                        </p>
                      )}
                      {!isFlight && ticket.location && (
                        <p className="text-sm text-muted-foreground">
                          {ticket.location}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {ticket.departureTime && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ticket.departureTime).toLocaleDateString()}
                          </span>
                        )}
                        {ticket.departureTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isFlight ? 'Dep: ' : ''}
                            {new Date(ticket.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {isFlight && ticket.arrivalTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Arr: {new Date(ticket.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {ticket.cost && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {ticket.cost.toFixed(2)} {ticket.currency}
                          </span>
                        )}
                      </div>
                      {ticket.confirmationNum && (
                        <div className="mt-1 flex items-center gap-1 text-xs">
                          <FileText className="w-3 h-3" />
                          <span className="font-mono bg-gray-100 px-1 rounded">
                            {ticket.confirmationNum}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {ticket.url && (
                      <a
                        href={ticket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                      </a>
                    )}
                    {!isOther && (
                      <button
                        onClick={() => onDelete(ticket.id)}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Add Ticket Dialog Component
function AddTicketDialog({
  open,
  onOpenChange,
  tripId,
  onTicketAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  onTicketAdded: () => void;
}) {
  const [type, setType] = useState('flight');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [confirmationNum, setConfirmationNum] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  // New flight-specific fields
  const [passengerName, setPassengerName] = useState('');
  const [flightDirection, setFlightDirection] = useState<'outbound' | 'return' | ''>('');
  const [departureLocation, setDepartureLocation] = useState('');
  const [arrivalLocation, setArrivalLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      // Combine date and time into departureTime
      let departureTime: string | undefined;
      if (date) {
        departureTime = time ? `${date}T${time}:00` : `${date}T00:00:00`;
      }

      // Combine arrival date and time into arrivalTime
      let arrivalTimeStr: string | undefined;
      if (arrivalDate) {
        arrivalTimeStr = arrivalTime ? `${arrivalDate}T${arrivalTime}:00` : `${arrivalDate}T00:00:00`;
      }

      const response = await fetch(`/api/trips/${tripId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          confirmationNum: confirmationNum.trim() || undefined,
          departureTime,
          arrivalTime: arrivalTimeStr,
          location: location.trim() || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          currency,
          url: url.trim() || undefined,
          passengerName: passengerName.trim() || undefined,
          flightDirection: flightDirection || undefined,
          departureLocation: departureLocation.trim() || undefined,
          arrivalLocation: arrivalLocation.trim() || undefined,
        }),
      });

      if (response.ok) {
        onTicketAdded();
        onOpenChange(false);
        // Reset form
        setType('flight');
        setTitle('');
        setDescription('');
        setConfirmationNum('');
        setDate('');
        setTime('');
        setArrivalDate('');
        setArrivalTime('');
        setLocation('');
        setCost('');
        setCurrency('USD');
        setUrl('');
        setPassengerName('');
        setFlightDirection('');
        setDepartureLocation('');
        setArrivalLocation('');
      }
    } catch (error) {
      console.error('Error adding ticket:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Travel Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {ticketTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    type === t.value
                      ? 'border-[#A8C5A8] bg-[#A8C5A8]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="e.g., Flight to Paris"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Passenger Name</label>
            <Input
              placeholder="Name on ticket"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              disabled={saving}
            />
          </div>

          {type === 'flight' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Flight Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFlightDirection('outbound')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
                      flightDirection === 'outbound'
                        ? 'border-[#A8C5A8] bg-[#A8C5A8]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <PlaneTakeoff className="w-4 h-4" />
                    <span className="text-sm">Outbound</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlightDirection('return')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
                      flightDirection === 'return'
                        ? 'border-[#A8C5A8] bg-[#A8C5A8]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <PlaneLanding className="w-4 h-4" />
                    <span className="text-sm">Return</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From (Airport/City)</label>
                  <Input
                    placeholder="e.g., JFK, New York"
                    value={departureLocation}
                    onChange={(e) => setDepartureLocation(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To (Airport/City)</label>
                  <Input
                    placeholder="e.g., CDG, Paris"
                    value={arrivalLocation}
                    onChange={(e) => setArrivalLocation(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Flight number, hotel address, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          {type !== 'flight' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Airport, hotel name, etc."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={saving}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmation Number</label>
            <Input
              placeholder="ABC123"
              value={confirmationNum}
              onChange={(e) => setConfirmationNum(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{type === 'flight' ? 'Departure Date' : 'Date'}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{type === 'flight' ? 'Departure Time' : 'Time'}</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {type === 'flight' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Arrival Date</label>
                <Input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arrival Time</label>
                <Input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost</label>
              <Input
                type="number"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={saving}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Booking URL</label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
                'Add Ticket'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

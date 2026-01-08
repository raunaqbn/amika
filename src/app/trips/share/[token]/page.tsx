'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  CalendarDays,
  Ticket,
  Users,
  Clock,
  Plane,
  ExternalLink,
  DollarSign,
} from 'lucide-react';

interface Collaborator {
  id: string;
  friendId: string;
  friendName: string;
  profileImage: string | null;
}

interface TripEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  category: string | null;
  externalUrl: string | null;
  estimatedCost: number | null;
}

interface DailyPlan {
  id: string;
  dayNumber: number;
  date: string | null;
  events: TripEvent[];
}

interface TripTicket {
  id: string;
  type: string;
  title: string;
  description: string | null;
  confirmationNum: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  location: string | null;
  cost: number | null;
  currency: string;
  url: string | null;
}

interface Trip {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  ownerName: string;
  collaborators: Collaborator[];
  dailyPlans: DailyPlan[];
  tickets: TripTicket[];
}

export default function SharedTripPage() {
  const params = useParams();
  const token = params.token as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/share/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('This trip link is invalid or sharing has been disabled.');
            return;
          }
          throw new Error('Failed to fetch trip');
        }
        const data = await response.json();
        setTrip(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTrip();
    }
  }, [token]);

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return 'Dates not set';
    const start = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    if (!endDate) return start.toLocaleDateString('en-US', options);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getTicketIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return Plane;
      case 'accommodation':
        return MapPin;
      default:
        return Ticket;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Plane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
          <p className="text-muted-foreground">
            {error || 'This trip link is invalid or has expired.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Plane className="w-4 h-4 text-[#A8C5A8]" />
            <span>Shared Trip</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{trip.title}</h1>
                <Badge className={`text-xs ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </Badge>
              </div>
              {trip.description && (
                <p className="text-gray-600 mb-3">{trip.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>
                {trip.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Organized by {trip.ownerName}</span>
                </div>
              </div>
            </div>
            {/* Collaborator avatars */}
            {trip.collaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Travelers:</span>
                <div className="flex -space-x-2">
                  {trip.collaborators.slice(0, 5).map((collab) => (
                    <Avatar
                      key={collab.id}
                      className="h-8 w-8 border-2 border-white"
                      title={collab.friendName}
                    >
                      <AvatarImage src={collab.profileImage || undefined} />
                      <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                        {collab.friendName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {trip.collaborators.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                      +{trip.collaborators.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Tickets ({trip.tickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {trip.dailyPlans.length > 0 ? (
              <div className="space-y-6">
                {trip.dailyPlans.map((day) => (
                  <Card key={day.id} className="p-4 border border-[#A8C5A8]/30">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#A8C5A8] text-white flex items-center justify-center font-medium text-sm">
                        {day.dayNumber}
                      </div>
                      <div>
                        <h3 className="font-semibold">Day {day.dayNumber}</h3>
                        {day.date && (
                          <p className="text-sm text-gray-500">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    {day.events.length > 0 ? (
                      <div className="space-y-3 ml-10">
                        {day.events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{event.title}</h4>
                                {event.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {event.category}
                                  </Badge>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                                {(event.startTime || event.endTime) && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {formatTime(event.startTime)}
                                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                                    </span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.estimatedCost && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>${event.estimatedCost}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {event.externalUrl && (
                              <a
                                href={event.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#A8C5A8] hover:text-[#A8C5A8]/80"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 ml-10">No events planned for this day</p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border border-gray-200">
                <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No itinerary yet</h3>
                <p className="text-gray-600 text-sm">
                  The trip organizer hasn't added any events to the itinerary.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tickets">
            {trip.tickets.length > 0 ? (
              <div className="space-y-3">
                {trip.tickets.map((ticket) => {
                  const TicketIcon = getTicketIcon(ticket.type);
                  return (
                    <Card key={ticket.id} className="p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#A8C5A8]/10 flex items-center justify-center">
                          <TicketIcon className="w-5 h-5 text-[#A8C5A8]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{ticket.title}</h4>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {ticket.type}
                            </Badge>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                            {ticket.departureTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {new Date(ticket.departureTime).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            )}
                            {ticket.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{ticket.location}</span>
                              </div>
                            )}
                            {ticket.cost && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>
                                  {ticket.cost} {ticket.currency}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {ticket.url && (
                          <a
                            href={ticket.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A8C5A8] hover:text-[#A8C5A8]/80"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-gray-200">
                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets added</h3>
                <p className="text-gray-600 text-sm">
                  Travel tickets and reservations will appear here.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          Shared via <span className="text-[#A8C5A8] font-medium">Amika</span> - Plan trips with friends
        </div>
      </div>
    </div>
  );
}

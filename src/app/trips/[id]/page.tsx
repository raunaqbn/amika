'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GoalsSidebar } from '@/components/trip-planning/goals-sidebar';
import { TripDatesSection } from '@/components/trip-planning/trip-dates-section';
import { TripLocationSection } from '@/components/trip-planning/trip-location-section';
import { TripEventsSection } from '@/components/trip-planning/trip-events-section';
import { TripTicketsSection } from '@/components/trip-planning/trip-tickets-section';
import { ShareTripDialog } from '@/components/trip-planning/share-trip-dialog';
import { useTripSync } from '@/hooks/use-trip-sync';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CalendarDays,
  Ticket,
  MoreVertical,
  Trash2,
  Edit2,
  Wifi,
  WifiOff,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Trip {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  locationDetails: string | null;
  shareToken: string | null;
  joinToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  collaborators: Collaborator[];
  dailyPlans: DailyPlan[];
  tickets: TripTicket[];
  polls: TripPoll[];
  goalProgress: GoalProgress[];
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

interface DailyPlan {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date | null;
  events: TripEvent[];
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
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
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
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
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
  options?: PollOption[];
}

interface PollOption {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
  votes?: PollVote[];
}

interface PollVote {
  id: string;
  optionId: string;
  visitorId: string | null;
  friendId: string | null;
  votedAt: Date;
}

interface GoalProgress {
  id: string;
  tripId: string;
  goalType: string;
  status: string;
  completedAt: Date | null;
}

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

export default function TripPlanningPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dates');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const fetchTrip = useCallback(async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 404) {
          setError('Trip not found');
          return;
        }
        throw new Error('Failed to fetch trip');
      }
      const data = await response.json();
      setTrip(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId, router]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUserId(data.user.id);
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Set up sync with context for typing indicators
  const { isConnected, typingUsers, activeUsers } = useTripSync(tripId, {
    enabled: !!trip,
    context: activeTab,
    onNewMessages: (newMessages) => {
      setMessages((prev) => {
        const updated = { ...prev };
        newMessages.forEach((msg) => {
          const context = msg.context || 'general';
          if (!updated[context]) {
            updated[context] = [];
          }
          // Avoid duplicates
          if (!updated[context].find((m) => m.id === msg.id)) {
            updated[context] = [...updated[context], msg];
          }
        });
        return updated;
      });
    },
    onGoalsUpdated: (goals) => {
      setTrip((prev) => (prev ? { ...prev, goalProgress: goals } : null));
    },
    onTripUpdated: fetchTrip,
  });

  const handleUpdateTrip = async (updates: Partial<Trip>) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setTrip((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err) {
      console.error('Error updating trip:', err);
    }
  };

  const handleDeleteTrip = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/trips');
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
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
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">
            {error || 'Trip not found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            The trip you&apos;re looking for doesn&apos;t exist or you don&apos;t have
            access to it.
          </p>
          <Button onClick={() => router.push('/trips')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </Card>
      </div>
    );
  }

  const isOwner = trip.userId === currentUserId;

  return (
    <div className="min-h-screen bg-[#FFFBF5] md:pt-20 pb-20 md:pb-8 overflow-x-hidden overflow-y-auto touch-scroll">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/trips')}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{trip.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={trip.status === 'planning' ? 'secondary' : 'default'}
                    className={`text-xs ${
                      trip.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : trip.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : ''
                    }`}
                  >
                    {trip.status}
                  </Badge>
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {trip.description && (
                <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{trip.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2">
            {/* Collaborator avatars */}
            <div className="flex -space-x-2">
              {trip.collaborators.slice(0, 4).map((collab) => (
                <Avatar
                  key={collab.id}
                  className="h-7 w-7 md:h-8 md:w-8 border-2 border-white"
                >
                  <AvatarImage src={collab.profileImage || undefined} />
                  <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                    {collab.friendName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {trip.collaborators.length > 4 && (
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{trip.collaborators.length - 4}
                </div>
              )}
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Share & Invite
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Trip
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteTrip}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Trip
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Goals Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <GoalsSidebar
              goalProgress={trip.goalProgress}
              collaborators={trip.collaborators}
              onGoalClick={(goalType) => {
                const tabMap: Record<string, string> = {
                  dates: 'dates',
                  location: 'location',
                  daily_events: 'events',
                  tickets: 'tickets',
                };
                setActiveTab(tabMap[goalType] || 'dates');
              }}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4 scrollbar-hide">
                <TabsList className="w-max md:w-auto">
                  <TabsTrigger value="dates" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dates
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    Tickets
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dates">
                <TripDatesSection
                  trip={trip}
                  onUpdate={handleUpdateTrip}
                  messages={messages['dates'] || []}
                  polls={trip.polls.filter((p) => p.context === 'dates')}
                  tripId={tripId}
                  currentUserId={currentUserId || undefined}
                  onRefresh={fetchTrip}
                  currentUser={{
                    id: user?.id || currentUserId || '',
                    name: user?.name || 'You',
                    profileImage: user?.profileImage || null,
                  }}
                  collaborators={trip.collaborators}
                  typingUsers={typingUsers}
                  activeUsers={activeUsers}
                />
              </TabsContent>

              <TabsContent value="location">
                <TripLocationSection
                  trip={trip}
                  onUpdate={handleUpdateTrip}
                  messages={messages['location'] || []}
                  polls={trip.polls.filter((p) => p.context === 'location')}
                  tripId={tripId}
                  currentUserId={currentUserId || undefined}
                  onRefresh={fetchTrip}
                  currentUser={{
                    id: user?.id || currentUserId || '',
                    name: user?.name || 'You',
                    profileImage: user?.profileImage || null,
                  }}
                  collaborators={trip.collaborators}
                  typingUsers={typingUsers}
                  activeUsers={activeUsers}
                />
              </TabsContent>

              <TabsContent value="events">
                <TripEventsSection
                  trip={trip}
                  dailyPlans={trip.dailyPlans}
                  messages={messages['events'] || []}
                  polls={trip.polls.filter((p) => p.context === 'events')}
                  tripId={tripId}
                  currentUserId={currentUserId || undefined}
                  onRefresh={fetchTrip}
                  currentUser={{
                    id: user?.id || '',
                    name: user?.name || 'You',
                    profileImage: user?.profileImage || null,
                  }}
                  collaborators={trip.collaborators}
                  typingUsers={typingUsers}
                  activeUsers={activeUsers}
                />
              </TabsContent>

              <TabsContent value="tickets">
                <TripTicketsSection
                  trip={trip}
                  tickets={trip.tickets}
                  collaborators={trip.collaborators}
                  messages={messages['tickets'] || []}
                  polls={trip.polls.filter((p) => p.context === 'tickets')}
                  tripId={tripId}
                  currentUserId={currentUserId || undefined}
                  onRefresh={fetchTrip}
                  currentUser={{
                    id: user?.id || '',
                    name: user?.name || 'You',
                    profileImage: user?.profileImage || null,
                  }}
                  typingUsers={typingUsers}
                  activeUsers={activeUsers}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Share Trip Dialog */}
      <ShareTripDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        tripId={tripId}
        tripTitle={trip?.title || ''}
        existingCollaborators={trip?.collaborators || []}
        joinToken={trip?.joinToken || null}
        onCollaboratorAdded={fetchTrip}
        onJoinTokenGenerated={(token) => {
          setTrip((prev) => (prev ? { ...prev, joinToken: token } : null));
        }}
        onJoinTokenRevoked={() => {
          setTrip((prev) => (prev ? { ...prev, joinToken: null } : null));
        }}
      />

    </div>
  );
}

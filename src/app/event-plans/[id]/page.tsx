'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GoalsSidebar } from '@/components/event-planning/goals-sidebar';
import { EventPlanDateSection } from '@/components/event-planning/event-plan-date-section';
import { CandidatesSection } from '@/components/event-planning/candidates-section';
import { ShareEventDialog } from '@/components/event-planning/share-event-dialog';
import { EventPlanChat } from '@/components/event-planning/event-plan-chat';
import { useEventPlanSync } from '@/hooks/use-event-plan-sync';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  MoreVertical,
  Trash2,
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

interface EventPlan {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  eventDate: Date | null;
  eventTime: string | null;
  selectedEventId: string | null;
  shareToken: string | null;
  joinToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  collaborators: Collaborator[];
  candidates: EventPlanCandidate[];
  polls: EventPlanPoll[];
  goalProgress: GoalProgress[];
}

interface Collaborator {
  id: string;
  eventPlanId: string;
  friendId: string;
  userId: string | null;
  role: string;
  joinedAt: Date;
  friendName: string;
  profileImage: string | null;
  linkedUserId: string | null;
}

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
  eventPlanId: string;
  goalType: string;
  status: string;
  completedAt: Date | null;
}

interface Message {
  id: string;
  eventPlanId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  createdAt: Date;
}

export default function EventPlanningPage() {
  const router = useRouter();
  const params = useParams();
  const eventPlanId = params.id as string;
  const { user } = useAuth();

  const [eventPlan, setEventPlan] = useState<EventPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('date');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const fetchEventPlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 404) {
          setError('Event plan not found');
          return;
        }
        throw new Error('Failed to fetch event plan');
      }
      const data = await response.json();
      setEventPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventPlanId, router]);

  useEffect(() => {
    fetchEventPlan();
  }, [fetchEventPlan]);

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
  const { isConnected, typingUsers, activeUsers } = useEventPlanSync(eventPlanId, {
    enabled: !!eventPlan,
    context: 'general',
    onNewMessages: (newMessages) => {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNewMessages = newMessages.filter((msg) => !existingIds.has(msg.id));
        return [...prev, ...uniqueNewMessages];
      });
    },
    onPollsUpdated: (updatedPolls) => {
      setEventPlan((prev) => {
        if (!prev) return null;
        const pollsMap = new Map(prev.polls.map((p) => [p.id, p]));
        updatedPolls.forEach((poll: EventPlanPoll) => {
          pollsMap.set(poll.id, poll);
        });
        return { ...prev, polls: Array.from(pollsMap.values()) };
      });
    },
    onGoalsUpdated: (goals) => {
      setEventPlan((prev) => (prev ? { ...prev, goalProgress: goals } : null));
    },
    onEventPlanUpdated: fetchEventPlan,
  });

  const handleNewMessage = (message: Message) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const handleUpdateEventPlan = async (updates: Partial<EventPlan>) => {
    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setEventPlan((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err) {
      console.error('Error updating event plan:', err);
    }
  };

  const handleSelectEvent = async (candidateId: string | null) => {
    await handleUpdateEventPlan({ selectedEventId: candidateId });
  };

  const handleDeleteEventPlan = async () => {
    if (!confirm('Are you sure you want to delete this event plan?')) return;

    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/event-plans');
      }
    } catch (err) {
      console.error('Error deleting event plan:', err);
    }
  };

  const handleGoalClick = (goalType: string) => {
    const tabMap: Record<string, string> = {
      date: 'date',
      event: 'event',
    };
    setActiveTab(tabMap[goalType] || 'date');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  if (error || !eventPlan) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">
            {error || 'Event plan not found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            The event plan you&apos;re looking for doesn&apos;t exist or you don&apos;t have
            access to it.
          </p>
          <Button onClick={() => router.push('/event-plans')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Plans
          </Button>
        </Card>
      </div>
    );
  }

  const isOwner = eventPlan.userId === currentUserId;
  const datePolls = eventPlan.polls.filter((p) => p.context === 'date');
  const eventPolls = eventPlan.polls.filter((p) => p.context === 'event');

  return (
    <div className="min-h-screen bg-[#FFFBF5] md:pt-20 pb-20 md:pb-8 overflow-x-hidden overflow-y-auto touch-scroll">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/event-plans')}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{eventPlan.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={eventPlan.status === 'planning' ? 'secondary' : 'default'}
                    className={`text-xs ${
                      eventPlan.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : eventPlan.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : ''
                    }`}
                  >
                    {eventPlan.status}
                  </Badge>
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {eventPlan.description && (
                <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{eventPlan.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2">
            {/* Collaborator avatars */}
            <div className="flex -space-x-2">
              {eventPlan.collaborators.slice(0, 4).map((collab) => (
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
              {eventPlan.collaborators.length > 4 && (
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{eventPlan.collaborators.length - 4}
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
                    Invite Friends
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDeleteEventPlan}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-6">
          {/* Left Column: Planning Progress */}
          <div className="hidden lg:block">
            <GoalsSidebar
              goalProgress={eventPlan.goalProgress}
              collaborators={eventPlan.collaborators}
              onGoalClick={handleGoalClick}
            />
          </div>

          {/* Middle Column: Chat */}
          <div>
            <EventPlanChat
              eventPlanId={eventPlanId}
              context="general"
              messages={messages}
              currentUser={{
                id: currentUserId || '',
                name: user?.name || 'You',
                profileImage: user?.profileImage || null,
              }}
              collaborators={eventPlan.collaborators}
              eventPlanOwnerId={eventPlan.userId}
              onNewMessage={handleNewMessage}
              typingUsers={typingUsers}
              activeUsers={activeUsers}
            />
          </div>

          {/* Right Column: Location & Event Pane with Polls */}
          <div className="space-y-6 lg:order-none order-first">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Date</span>
                </TabsTrigger>
                <TabsTrigger value="event" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Event</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="date" className="mt-4">
                <EventPlanDateSection
                  eventPlan={eventPlan}
                  onUpdate={handleUpdateEventPlan}
                  polls={datePolls}
                  eventPlanId={eventPlanId}
                  currentUserId={currentUserId || undefined}
                  onRefresh={fetchEventPlan}
                />
              </TabsContent>

              <TabsContent value="event" className="mt-4">
                <CandidatesSection
                  eventPlanId={eventPlanId}
                  candidates={eventPlan.candidates}
                  selectedEventId={eventPlan.selectedEventId}
                  polls={eventPolls}
                  currentUserId={currentUserId || undefined}
                  onSelectEvent={handleSelectEvent}
                  onRefresh={fetchEventPlan}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareEventDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        eventPlanId={eventPlanId}
        eventPlanTitle={eventPlan.title}
        existingCollaborators={eventPlan.collaborators}
        joinToken={eventPlan.joinToken}
        onCollaboratorAdded={fetchEventPlan}
        onJoinTokenGenerated={(token) => {
          setEventPlan((prev) => (prev ? { ...prev, joinToken: token } : null));
        }}
        onJoinTokenRevoked={() => {
          setEventPlan((prev) => (prev ? { ...prev, joinToken: null } : null));
        }}
      />
    </div>
  );
}

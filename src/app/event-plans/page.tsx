'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlanEventDialog } from '@/components/event-planning/plan-event-dialog';
import {
  Calendar,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  MoreVertical,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

interface Friend {
  id: string;
  name: string;
  linkedUserId?: string | null;
}

interface Collaborator {
  id: string;
  friendId: string;
  friendName: string;
  profileImage: string | null;
}

interface EventPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  eventDate: string | null;
  eventTime: string | null;
  selectedEventId: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export default function EventPlansPage() {
  const router = useRouter();
  const [eventPlans, setEventPlans] = useState<EventPlan[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [planEventDialogOpen, setPlanEventDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'planning' | 'completed'>('planning');

  useEffect(() => {
    fetchEventPlans();
    fetchFriends();
  }, []);

  const fetchEventPlans = async () => {
    try {
      const response = await fetch('/api/event-plans');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to fetch event plans');
      }
      const data = await response.json();
      setEventPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching event plans:', error);
      setEventPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
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

  const handleDeleteEventPlan = async (eventPlanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event plan? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEventPlans(eventPlans.filter((ep) => ep.id !== eventPlanId));
      } else {
        console.error('Failed to delete event plan');
      }
    } catch (err) {
      console.error('Error deleting event plan:', err);
    }
  };

  const planningEventPlans = eventPlans.filter(
    (ep) => ep.status === 'planning' || ep.status === 'confirmed'
  );
  const completedEventPlans = eventPlans.filter(
    (ep) => ep.status === 'completed' || ep.status === 'cancelled'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-2xl mx-auto">
        <div className="py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Plan Events</h1>
            <Button
              onClick={() => setPlanEventDialogOpen(true)}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan Event
            </Button>
          </div>
          <p className="text-gray-600">Plan and manage events with your friends</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'planning'
                ? 'bg-[#A8C5A8] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Planning ({planningEventPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-[#A8C5A8] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Completed ({completedEventPlans.length})
          </button>
        </div>

        {/* Event Plans List */}
        <div className="space-y-4">
          {(activeTab === 'planning' ? planningEventPlans : completedEventPlans).length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-[#A8C5A8]" />
              <h3 className="font-semibold text-lg mb-2">
                {activeTab === 'planning' ? 'No events being planned' : 'No completed events'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'planning'
                  ? 'Start planning an event with your friends!'
                  : 'Completed events will appear here'}
              </p>
              {activeTab === 'planning' && (
                <Button
                  onClick={() => setPlanEventDialogOpen(true)}
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Plan Event
                </Button>
              )}
            </Card>
          ) : (
            (activeTab === 'planning' ? planningEventPlans : completedEventPlans).map((eventPlan) => (
              <Card
                key={eventPlan.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/event-plans/${eventPlan.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{eventPlan.title}</h3>
                      <Badge className={getStatusColor(eventPlan.status)}>
                        {eventPlan.status.charAt(0).toUpperCase() + eventPlan.status.slice(1)}
                      </Badge>
                    </div>

                    {eventPlan.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {eventPlan.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {eventPlan.eventDate
                          ? format(parseISO(eventPlan.eventDate.split('T')[0]), 'MMM d, yyyy')
                          : 'Date not set'}
                      </div>
                      {eventPlan.eventTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {eventPlan.eventTime}
                        </div>
                      )}
                      {eventPlan.selectedEventId && (
                        <div className="flex items-center gap-1 text-[#A8C5A8]">
                          <Sparkles className="w-4 h-4" />
                          Event selected
                        </div>
                      )}
                    </div>

                    {/* Collaborators */}
                    {eventPlan.collaborators.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex -space-x-2">
                          {eventPlan.collaborators.slice(0, 4).map((collab) => (
                            <Avatar key={collab.id} className="w-6 h-6 border-2 border-white">
                              <AvatarImage src={collab.profileImage || undefined} />
                              <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                                {collab.friendName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {eventPlan.collaborators.length > 4 && (
                            <span className="text-xs text-gray-500 ml-2">
                              +{eventPlan.collaborators.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => handleDeleteEventPlan(eventPlan.id, e)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <PlanEventDialog
        open={planEventDialogOpen}
        onOpenChange={setPlanEventDialogOpen}
        friends={friends}
        onEventCreated={fetchEventPlans}
      />
    </div>
  );
}

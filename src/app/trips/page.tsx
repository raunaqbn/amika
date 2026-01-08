'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlanTripDialog } from '@/components/trip-planning/plan-trip-dialog';
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

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

interface Trip {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [planTripDialogOpen, setPlanTripDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'planning' | 'completed'>('planning');

  useEffect(() => {
    fetchTrips();
    fetchFriends();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
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

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return 'Dates not set';
    const start = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (!endDate) return start.toLocaleDateString('en-US', options);
    const end = new Date(endDate);
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}`;
    }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
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

  const planningTrips = trips.filter(
    (trip) => trip.status === 'planning' || trip.status === 'confirmed'
  );
  const completedTrips = trips.filter(
    (trip) => trip.status === 'completed' || trip.status === 'cancelled'
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
            <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
            <Button
              onClick={() => setPlanTripDialogOpen(true)}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan Trip
            </Button>
          </div>
          <p className="text-gray-600">Plan and manage trips with your friends</p>
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
            Planning ({planningTrips.length})
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
            Completed ({completedTrips.length})
          </button>
        </div>

        {/* Trips List */}
        {activeTab === 'planning' && (
          <section>
            {planningTrips.length > 0 ? (
              <div className="space-y-3">
                {planningTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="p-4 border border-[#A8C5A8]/30 bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {trip.title}
                          </h3>
                          <Badge className={`text-xs ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </Badge>
                        </div>
                        {trip.description && (
                          <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                            {trip.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                          </div>
                          {trip.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px]">{trip.location}</span>
                            </div>
                          )}
                          {trip.collaborators.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{trip.collaborators.length} traveler{trip.collaborators.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Collaborator avatars */}
                        <div className="flex -space-x-2">
                          {trip.collaborators.slice(0, 3).map((collab) => (
                            <Avatar
                              key={collab.id}
                              className="h-7 w-7 border-2 border-white"
                            >
                              <AvatarImage src={collab.profileImage || undefined} />
                              <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                                {collab.friendName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {trip.collaborators.length > 3 && (
                            <div className="h-7 w-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                              +{trip.collaborators.length - 3}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 border border-[#A8C5A8]/30 bg-white/60 text-center">
                <Plane className="w-12 h-12 text-[#A8C5A8] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips planned</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Start planning your next adventure with friends!
                </p>
                <Button
                  onClick={() => setPlanTripDialogOpen(true)}
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Plan a Trip
                </Button>
              </Card>
            )}
          </section>
        )}

        {activeTab === 'completed' && (
          <section>
            {completedTrips.length > 0 ? (
              <div className="space-y-3">
                {completedTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="p-4 border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer opacity-80"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {trip.title}
                          </h3>
                          <Badge className={`text-xs ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                          </div>
                          {trip.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px]">{trip.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 border border-gray-200 bg-white/60 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed trips</h3>
                <p className="text-gray-600 text-sm">
                  Your completed trips will appear here.
                </p>
              </Card>
            )}
          </section>
        )}

        <PlanTripDialog
          open={planTripDialogOpen}
          onOpenChange={setPlanTripDialogOpen}
          friends={friends.map((f) => ({
            id: f.id,
            name: f.name,
            linkedUserId: f.linkedUserId,
          }))}
        />
      </div>
    </div>
  );
}

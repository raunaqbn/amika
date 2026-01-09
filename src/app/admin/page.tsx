'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Heart,
  BookOpen,
  Calendar,
  MessageCircle,
  Plane,
  PartyPopper,
  Gift,
  Share2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminStats {
  users: {
    total: number;
    active: number;
    googleLinked: number;
    newThisWeek: number;
    newThisMonth: number;
    growth: { week: string; count: number }[];
  };
  socialGraph: {
    totalFriends: number;
    linkedFriends: number;
    avgFriendsPerUser: number;
    connectionsPending: number;
    connectionsAccepted: number;
  };
  content: {
    memories: {
      total: number;
      withImages: number;
    };
    diaryNotes: {
      total: number;
      withAnalysis: number;
    };
    events: {
      total: number;
      completed: number;
      byCategory: { category: string; count: number }[];
    };
  };
  engagement: {
    chatSessions: number;
    chatMessages: number;
    recentChatMessages: number;
  };
  tripPlanning: {
    total: number;
    byStatus: { status: string; count: number }[];
    collaborators: number;
    messages: number;
    polls: number;
  };
  eventPlanning: {
    total: number;
    byStatus: { status: string; count: number }[];
    collaborators: number;
  };
  sharing: {
    pending: number;
    accepted: number;
    byType: { type: string; count: number }[];
  };
  wishlist: {
    total: number;
    purchased: number;
    byCategory: { category: string; count: number }[];
  };
  topUsers: {
    byFriends: {
      id: string;
      name: string;
      email: string;
      friendCount: number;
    }[];
    byContent: {
      id: string;
      name: string;
      email: string;
      memories: number;
      diary: number;
      events: number;
      total: number;
    }[];
  };
  recentSignups: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }[];
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#A8C5A8]',
  trend,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card className="p-4 bg-white border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">
                +{trend.value} {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-gray-50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function StatusBreakdown({
  items,
  title,
}: {
  items: { status: string; count: number }[];
  title: string;
}) {
  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.status}
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[item.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {item.status}: {item.count}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
        <div className="px-4 max-w-6xl mx-auto">
          <div className="py-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Loading metrics...</p>
          </div>
          <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
        <div className="px-4 max-w-6xl mx-auto">
          <div className="py-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">{error}</h2>
            <p className="text-gray-600 mb-4">
              This dashboard is only accessible to authorized administrators.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Return Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Amika Platform Metrics</p>
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* User Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A8C5A8]" />
            User Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.users.total}
              icon={Users}
              trend={{ value: stats.users.newThisMonth, label: 'this month' }}
            />
            <StatCard
              title="Active Users"
              value={stats.users.active}
              subtitle="Non-temporary accounts"
              icon={UserPlus}
            />
            <StatCard
              title="Google Linked"
              value={stats.users.googleLinked}
              subtitle="Calendar integration"
              icon={Calendar}
              iconColor="text-blue-500"
            />
            <StatCard
              title="New This Week"
              value={stats.users.newThisWeek}
              icon={TrendingUp}
              iconColor="text-green-500"
            />
          </div>

          {/* User Growth Chart */}
          {stats.users.growth.length > 0 && (
            <Card className="mt-4 p-4 bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly User Growth</h3>
              <div className="flex items-end gap-2 h-24">
                {stats.users.growth.map((week, idx) => {
                  const maxCount = Math.max(...stats.users.growth.map((w) => w.count));
                  const height = maxCount > 0 ? (week.count / maxCount) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-[#A8C5A8] rounded-t transition-all"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <span className="text-xs text-gray-400 mt-1">{week.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>

        {/* Social Graph */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#D4A5A5]" />
            Social Graph
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title="Total Friends"
              value={stats.socialGraph.totalFriends}
              icon={Heart}
              iconColor="text-[#D4A5A5]"
            />
            <StatCard
              title="Linked Friends"
              value={stats.socialGraph.linkedFriends}
              subtitle="Amika users"
              icon={UserPlus}
              iconColor="text-[#D4A5A5]"
            />
            <StatCard
              title="Avg Friends/User"
              value={stats.socialGraph.avgFriendsPerUser}
              icon={Users}
              iconColor="text-[#D4A5A5]"
            />
            <StatCard
              title="Pending Requests"
              value={stats.socialGraph.connectionsPending}
              icon={UserPlus}
              iconColor="text-yellow-500"
            />
            <StatCard
              title="Accepted Connections"
              value={stats.socialGraph.connectionsAccepted}
              icon={UserPlus}
              iconColor="text-green-500"
            />
          </div>
        </section>

        {/* Content Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#A8C5A8]" />
            Content Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Memories</p>
                  <p className="text-xl font-bold">{stats.content.memories.total}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {stats.content.memories.withImages} with images (
                {stats.content.memories.total > 0
                  ? Math.round(
                      (stats.content.memories.withImages / stats.content.memories.total) * 100
                    )
                  : 0}
                %)
              </p>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Diary Notes</p>
                  <p className="text-xl font-bold">{stats.content.diaryNotes.total}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {stats.content.diaryNotes.withAnalysis} with AI analysis (
                {stats.content.diaryNotes.total > 0
                  ? Math.round(
                      (stats.content.diaryNotes.withAnalysis / stats.content.diaryNotes.total) * 100
                    )
                  : 0}
                %)
              </p>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Events</p>
                  <p className="text-xl font-bold">{stats.content.events.total}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {stats.content.events.completed} completed (
                {stats.content.events.total > 0
                  ? Math.round(
                      (stats.content.events.completed / stats.content.events.total) * 100
                    )
                  : 0}
                %)
              </p>
            </Card>
          </div>

          {/* Events by Category */}
          {stats.content.events.byCategory.length > 0 && (
            <Card className="p-4 bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Events by Category</h3>
              <div className="flex flex-wrap gap-2">
                {stats.content.events.byCategory.map((cat) => (
                  <span
                    key={cat.category}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    {cat.category}: {cat.count}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Engagement */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            AI Chat Engagement
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              title="Chat Sessions"
              value={stats.engagement.chatSessions}
              icon={MessageCircle}
              iconColor="text-blue-500"
            />
            <StatCard
              title="Total Messages"
              value={stats.engagement.chatMessages}
              icon={MessageCircle}
              iconColor="text-blue-500"
            />
            <StatCard
              title="Messages (7 days)"
              value={stats.engagement.recentChatMessages}
              icon={MessageCircle}
              iconColor="text-green-500"
            />
          </div>
        </section>

        {/* Trip Planning */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-orange-500" />
            Trip Planning
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Total Trips"
              value={stats.tripPlanning.total}
              icon={Plane}
              iconColor="text-orange-500"
            />
            <StatCard
              title="Collaborators"
              value={stats.tripPlanning.collaborators}
              icon={Users}
              iconColor="text-orange-500"
            />
            <StatCard
              title="Messages"
              value={stats.tripPlanning.messages}
              icon={MessageCircle}
              iconColor="text-orange-500"
            />
            <StatCard
              title="Polls"
              value={stats.tripPlanning.polls}
              icon={Share2}
              iconColor="text-orange-500"
            />
          </div>
          {stats.tripPlanning.byStatus.length > 0 && (
            <Card className="p-4 bg-white">
              <StatusBreakdown items={stats.tripPlanning.byStatus} title="Trips by Status" />
            </Card>
          )}
        </section>

        {/* Event Planning */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-pink-500" />
            Event Planning
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard
              title="Event Plans"
              value={stats.eventPlanning.total}
              icon={PartyPopper}
              iconColor="text-pink-500"
            />
            <StatCard
              title="Collaborators"
              value={stats.eventPlanning.collaborators}
              icon={Users}
              iconColor="text-pink-500"
            />
          </div>
          {stats.eventPlanning.byStatus.length > 0 && (
            <Card className="p-4 bg-white">
              <StatusBreakdown items={stats.eventPlanning.byStatus} title="Event Plans by Status" />
            </Card>
          )}
        </section>

        {/* Sharing & Wishlist */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-500" />
              Sharing
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <StatCard
                title="Pending Shares"
                value={stats.sharing.pending}
                icon={Share2}
                iconColor="text-yellow-500"
              />
              <StatCard
                title="Accepted Shares"
                value={stats.sharing.accepted}
                icon={Share2}
                iconColor="text-green-500"
              />
            </div>
            {stats.sharing.byType.length > 0 && (
              <Card className="p-4 bg-white">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Shares by Type</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.sharing.byType.map((item) => (
                    <span
                      key={item.type}
                      className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700"
                    >
                      {item.type}: {item.count}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-500" />
              Wishlist
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <StatCard
                title="Total Items"
                value={stats.wishlist.total}
                icon={Gift}
                iconColor="text-rose-500"
              />
              <StatCard
                title="Purchased"
                value={stats.wishlist.purchased}
                subtitle={
                  stats.wishlist.total > 0
                    ? `${Math.round((stats.wishlist.purchased / stats.wishlist.total) * 100)}% completion`
                    : undefined
                }
                icon={Gift}
                iconColor="text-green-500"
              />
            </div>
            {stats.wishlist.byCategory.length > 0 && (
              <Card className="p-4 bg-white">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Items by Category</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.wishlist.byCategory.map((item) => (
                    <span
                      key={item.category}
                      className="px-2 py-1 rounded-full text-xs bg-rose-50 text-rose-700"
                    >
                      {item.category}: {item.count}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </section>
        </div>

        {/* Top Users */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#A8C5A8]" />
            Top Users
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Friends Count</h3>
              <div className="space-y-2">
                {stats.topUsers.byFriends.slice(0, 5).map((user, idx) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-4">{idx + 1}.</span>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="text-gray-400 text-xs">{user.email}</span>
                    </div>
                    <span className="text-[#A8C5A8] font-semibold">{user.friendCount}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Content Created</h3>
              <div className="space-y-2">
                {stats.topUsers.byContent.slice(0, 5).map((user, idx) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-4">{idx + 1}.</span>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-purple-500">{user.memories}m</span>
                      <span className="text-blue-500">{user.diary}d</span>
                      <span className="text-green-500">{user.events}e</span>
                      <span className="font-semibold text-gray-700">= {user.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Recent Signups */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#A8C5A8]" />
            Recent Signups
          </h2>
          <Card className="p-4 bg-white">
            <div className="space-y-2">
              {stats.recentSignups.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{user.email}</span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

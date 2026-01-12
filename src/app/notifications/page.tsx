'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  UserPlus,
  Share2,
  FileText,
  Calendar,
  Image as ImageIcon,
  Plane,
  Check,
  X,
  Loader2,
  Inbox,
  Clock,
  CheckCircle,
  Star,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type Connection = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
};

type SharedItem = {
  id: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  itemType: 'memory' | 'note' | 'event' | 'trip' | 'points';
  itemId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  createdAt: string;
  sharedBy: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  item?: {
    id: string;
    title?: string;
    content?: string;
    description?: string;
    eventDate?: string;
    location?: string;
    imageUrl?: string | null;
    startDate?: string;
    endDate?: string;
    category?: string;
  };
};

type TabType = 'all' | 'pending' | 'accepted';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [friendRequests, setFriendRequests] = useState<Connection[]>([]);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
      return;
    }
    if (user) {
      fetchNotifications();
    }
  }, [user, authLoading]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [pendingRequestsRes, acceptedRequestsRes, pendingItemsRes, acceptedItemsRes] = await Promise.all([
        fetch('/api/connections?type=received&status=pending'),
        fetch('/api/connections?type=received&status=accepted'),
        fetch('/api/shared-items?type=received&status=pending'),
        fetch('/api/shared-items?type=received&status=accepted'),
      ]);

      const pendingRequests = pendingRequestsRes.ok ? await pendingRequestsRes.json() : [];
      const acceptedRequests = acceptedRequestsRes.ok ? await acceptedRequestsRes.json() : [];
      const pendingItems = pendingItemsRes.ok ? await pendingItemsRes.json() : [];
      const acceptedItems = acceptedItemsRes.ok ? await acceptedItemsRes.json() : [];

      // Combine pending and accepted requests with status markers
      setFriendRequests([...pendingRequests, ...acceptedRequests]);
      setSharedItems([...pendingItems, ...acceptedItems]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendResponse = useCallback(async (connectionId: string, status: 'accepted' | 'rejected') => {
    setProcessing(connectionId);
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: connectionId, status }),
      });

      if (response.ok) {
        // Update the local state to reflect the change
        setFriendRequests((prev) => prev.map((r) =>
          r.id === connectionId ? { ...r, status } : r
        ));
      }
    } catch (err) {
      console.error('Error responding to request:', err);
    } finally {
      setProcessing(null);
    }
  }, []);

  const handleSharedItemResponse = useCallback(async (itemId: string, status: 'accepted' | 'rejected', item?: SharedItem) => {
    setProcessing(itemId);
    try {
      const response = await fetch('/api/shared-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status }),
      });

      if (response.ok) {
        // Update the local state to reflect the change
        setSharedItems((prev) => prev.map((i) =>
          i.id === itemId ? { ...i, status } : i
        ));

        // Navigate to trip page if accepting a trip invite
        if (status === 'accepted' && item?.itemType === 'trip') {
          router.push(`/trips/${item.itemId}`);
        }
      }
    } catch (err) {
      console.error('Error responding to shared item:', err);
    } finally {
      setProcessing(null);
    }
  }, [router]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return <ImageIcon className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'trip':
        return <Plane className="w-4 h-4" />;
      case 'points':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getItemPreview = (item: SharedItem) => {
    // For points, use the message directly if available
    if (item.itemType === 'points') {
      return item.message || `Points earned for "${item.item?.title || 'an event'}"`;
    }

    if (!item.item) return 'Content unavailable';

    switch (item.itemType) {
      case 'memory':
        return item.item.content?.slice(0, 100) + (item.item.content && item.item.content.length > 100 ? '...' : '');
      case 'note':
        return item.item.title || item.item.content?.slice(0, 100) + '...';
      case 'event':
        return `${item.item.title}${item.item.eventDate ? ` - ${format(new Date(item.item.eventDate), 'MMM d, yyyy')}` : ''}`;
      case 'trip':
        let preview = item.item.title || 'Trip';
        if (item.item.location) preview += ` to ${item.item.location}`;
        if (item.item.startDate) {
          preview += ` - ${format(new Date(item.item.startDate), 'MMM d, yyyy')}`;
          if (item.item.endDate) {
            preview += ` to ${format(new Date(item.item.endDate), 'MMM d, yyyy')}`;
          }
        }
        return preview;
      default:
        return 'Shared item';
    }
  };

  // Memoize filtered notifications based on active tab
  const { filteredFriendRequests, filteredSharedItems, pendingCount, hasNotifications } = useMemo(() => {
    const filteredRequests = friendRequests.filter((r) => {
      if (activeTab === 'pending') return r.status === 'pending';
      if (activeTab === 'accepted') return r.status === 'accepted';
      return true;
    });

    const filteredItems = sharedItems.filter((i) => {
      if (activeTab === 'pending') return i.status === 'pending';
      if (activeTab === 'accepted') return i.status === 'accepted';
      return true;
    });

    const pending = friendRequests.filter((r) => r.status === 'pending').length +
      sharedItems.filter((i) => i.status === 'pending').length;

    return {
      filteredFriendRequests: filteredRequests,
      filteredSharedItems: filteredItems,
      pendingCount: pending,
      hasNotifications: filteredRequests.length > 0 || filteredItems.length > 0,
    };
  }, [friendRequests, sharedItems, activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] pt-14 md:pt-16 pb-20 md:pb-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] pt-14 md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-2xl mx-auto">
        <div className="py-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-[#A8C5A8]" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {pendingCount > 0 && (
              <Badge className="bg-[#D4A5A5] text-white">
                {pendingCount} new
              </Badge>
            )}
          </div>
          <p className="text-gray-600">Stay updated with friend requests and shared items</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white' : ''}
          >
            <Inbox className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className={activeTab === 'pending' ? 'bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white' : ''}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Button>
          <Button
            variant={activeTab === 'accepted' ? 'default' : 'outline'}
            onClick={() => setActiveTab('accepted')}
            className={activeTab === 'accepted' ? 'bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white' : ''}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accepted
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#A8C5A8]" />
          </div>
        ) : !hasNotifications ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'all' ? 'No notifications yet' :
                  activeTab === 'pending' ? 'No pending notifications' :
                    'No accepted notifications'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'all' ? 'When friends send you requests or share items, they\'ll appear here.' :
                  activeTab === 'pending' ? 'You\'re all caught up!' :
                    'Accepted friend requests and shared items will appear here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Friend Requests */}
            {filteredFriendRequests.length > 0 && (
              <Card className="border-[#A8C5A8]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#A8C5A8]" />
                    Friend Requests
                  </CardTitle>
                  <CardDescription>
                    {filteredFriendRequests.length} request{filteredFriendRequests.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredFriendRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        request.status === 'pending' ? 'bg-muted/50' : 'bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {request.user.profileImage ? (
                            <AvatarImage src={request.user.profileImage} alt={request.user.name} />
                          ) : null}
                          <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                            {request.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleFriendResponse(request.id, 'accepted')}
                            disabled={processing === request.id}
                            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                          >
                            {processing === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFriendResponse(request.id, 'rejected')}
                            disabled={processing === request.id}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Points Earned */}
            {filteredSharedItems.filter((i) => i.itemType === 'points').length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Points Earned
                  </CardTitle>
                  <CardDescription>
                    {filteredSharedItems.filter((i) => i.itemType === 'points').length} notification{filteredSharedItems.filter((i) => i.itemType === 'points').length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredSharedItems.filter((item) => item.itemType === 'points').map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg space-y-2 ${
                        item.status === 'pending' ? 'bg-yellow-50' : 'bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">From {item.sharedBy.name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="pl-11">
                        <div className="p-2 bg-background rounded border text-sm">
                          {getItemPreview(item)}
                        </div>
                      </div>

                      {item.status === 'pending' ? (
                        <div className="flex gap-2 pl-11">
                          <Button
                            size="sm"
                            onClick={() => handleSharedItemResponse(item.id, 'accepted', item)}
                            disabled={processing === item.id}
                            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                          >
                            {processing === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Dismiss
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="pl-11">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acknowledged
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Shared Items - exclude points */}
            {filteredSharedItems.filter((i) => i.itemType !== 'points').length > 0 && (
              <Card className="border-[#A8C5A8]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[#A8C5A8]" />
                    Shared With You
                  </CardTitle>
                  <CardDescription>
                    {filteredSharedItems.filter((i) => i.itemType !== 'points').length} item{filteredSharedItems.filter((i) => i.itemType !== 'points').length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredSharedItems.filter((item) => item.itemType !== 'points').map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg space-y-2 ${
                        item.status === 'pending' ? 'bg-muted/50' : 'bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          {item.sharedBy.profileImage ? (
                            <AvatarImage src={item.sharedBy.profileImage} alt={item.sharedBy.name} />
                          ) : null}
                          <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-xs">
                            {item.sharedBy.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{item.sharedBy.name}</span>
                            <span className="text-muted-foreground"> shared a {item.itemType}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {getItemIcon(item.itemType)}
                        </div>
                      </div>

                      {item.message && (
                        <p className="text-sm text-muted-foreground italic pl-11">
                          &ldquo;{item.message}&rdquo;
                        </p>
                      )}

                      <div className="pl-11">
                        <div className="p-2 bg-background rounded border text-sm">
                          {getItemPreview(item)}
                        </div>
                      </div>

                      {item.status === 'pending' ? (
                        <div className="flex gap-2 pl-11">
                          <Button
                            size="sm"
                            onClick={() => handleSharedItemResponse(item.id, 'accepted', item)}
                            disabled={processing === item.id}
                            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                          >
                            {processing === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                {item.itemType === 'trip' ? 'View Trip' : 'Accept'}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSharedItemResponse(item.id, 'rejected', item)}
                            disabled={processing === item.id}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <div className="pl-11">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accepted
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2, UserPlus, Users, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export function FriendRequests({ onUpdate }: { onUpdate?: () => void }) {
  const [requests, setRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/connections?type=received&status=pending');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    setProcessing(connectionId);
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: connectionId, status }),
      });

      if (response.ok) {
        setRequests(requests.filter((r) => r.id !== connectionId));
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error responding to request:', err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="border-[#A8C5A8]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#A8C5A8]" />
          Friend Requests
        </CardTitle>
        <CardDescription>
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleResponse(request.id, 'accepted')}
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
                onClick={() => handleResponse(request.id, 'rejected')}
                disabled={processing === request.id}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ConnectedFriendsList({ onUpdate }: { onUpdate?: () => void }) {
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/connections?accepted=true');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Error fetching connected friends:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (friends.length === 0) {
    return null;
  }

  return (
    <Card className="border-[#A8C5A8]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-[#A8C5A8]" />
          Amika Friends
        </CardTitle>
        <CardDescription>
          {friends.length} connected friend{friends.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {friends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => router.push(`/friends/amika/${friend.id}`)}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <Avatar className="w-10 h-10">
              {friend.profileImage ? (
                <AvatarImage src={friend.profileImage} alt={friend.name} />
              ) : null}
              <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                {friend.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{friend.name}</p>
              <p className="text-sm text-muted-foreground">{friend.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

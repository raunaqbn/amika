'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2, Share2, FileText, Calendar, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type SharedItem = {
  id: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  itemType: 'memory' | 'note' | 'event';
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
  };
};

export function SharedItemsInbox({ onUpdate }: { onUpdate?: () => void }) {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/shared-items?type=received&status=pending');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching shared items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (itemId: string, status: 'accepted' | 'rejected') => {
    setProcessing(itemId);
    try {
      const response = await fetch('/api/shared-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status }),
      });

      if (response.ok) {
        setItems(items.filter((i) => i.id !== itemId));
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error responding to shared item:', err);
    } finally {
      setProcessing(null);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return <ImageIcon className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getItemPreview = (item: SharedItem) => {
    if (!item.item) return 'Content unavailable';

    switch (item.itemType) {
      case 'memory':
        return item.item.content?.slice(0, 100) + (item.item.content && item.item.content.length > 100 ? '...' : '');
      case 'note':
        return item.item.title || item.item.content?.slice(0, 100) + '...';
      case 'event':
        return `${item.item.title}${item.item.eventDate ? ` - ${format(new Date(item.item.eventDate), 'MMM d, yyyy')}` : ''}`;
      default:
        return 'Shared item';
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

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="border-[#A8C5A8]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#A8C5A8]" />
          Shared With You
        </CardTitle>
        <CardDescription>
          {items.length} pending item{items.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-muted/50 rounded-lg space-y-2"
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

            <div className="flex gap-2 pl-11">
              <Button
                size="sm"
                onClick={() => handleResponse(item.id, 'accepted')}
                disabled={processing === item.id}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                {processing === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResponse(item.id, 'rejected')}
                disabled={processing === item.id}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AcceptedSharedItems() {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/shared-items?type=received&status=accepted');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching accepted items:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return <ImageIcon className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <Card className="border-[#A8C5A8]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#A8C5A8]" />
          Shared Memories
        </CardTitle>
        <CardDescription>
          Items shared by your Amika friends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
          >
            <div className="w-8 h-8 rounded-full bg-[#A8C5A8]/20 flex items-center justify-center text-[#A8C5A8]">
              {getItemIcon(item.itemType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.item?.title || item.item?.content?.slice(0, 50) || 'Shared item'}
              </p>
              <p className="text-xs text-muted-foreground">
                From {item.sharedBy.name} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Link2, Link2Off, Loader2 } from 'lucide-react';

interface EventShareDialogProps {
  eventId: string;
  eventTitle: string;
  trigger?: React.ReactNode;
}

export function EventShareDialog({ eventId, eventTitle, trigger }: EventShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchingToken, setFetchingToken] = useState(false);

  // Fetch current token when dialog opens
  useEffect(() => {
    if (open) {
      fetchCurrentToken();
    }
  }, [open, eventId]);

  const fetchCurrentToken = async () => {
    setFetchingToken(true);
    try {
      // Try to get event details with current tokens
      const response = await fetch(`/api/events?id=${eventId}`);
      if (response.ok) {
        const events = await response.json();
        const event = Array.isArray(events)
          ? events.find((e: any) => e.id === eventId)
          : events;
        if (event?.joinToken) {
          setJoinToken(event.joinToken);
        }
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setFetchingToken(false);
    }
  };

  const getInviteUrl = () => {
    if (!joinToken) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/events/join/${joinToken}`;
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const data = await response.json();
      setJoinToken(data.joinToken);
    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    if (!confirm('Are you sure you want to disable this link? Anyone with the current link will no longer be able to join.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke link');
      }

      setJoinToken(null);
    } catch (error) {
      console.error('Error revoking link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const url = getInviteUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#A8C5A8]">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#A8C5A8]" />
            Share Event
          </DialogTitle>
          <DialogDescription>
            Share &quot;{eventTitle}&quot; with friends using a link. They can sign in or create an account to join.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {fetchingToken ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#A8C5A8]" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Invite link</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={joinToken ? getInviteUrl() : 'Click generate to create a link'}
                    className="flex-1 bg-gray-50"
                  />
                  {joinToken ? (
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGenerateLink}
                      className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 shrink-0"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      Generate
                    </Button>
                  )}
                </div>
              </div>

              {joinToken && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Anyone with this link can join this event.
                  </p>
                  <Button
                    onClick={handleRevokeLink}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={loading}
                  >
                    <Link2Off className="w-4 h-4 mr-2" />
                    Disable
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

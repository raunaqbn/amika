'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, UserPlus, Check, Loader2, ArrowLeft, UserRoundPlus, Link2, Copy, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
};

type ConnectionStatus = {
  [userId: string]: 'none' | 'pending' | 'sent' | 'accepted';
};

type Mode = 'search' | 'manual' | 'invite';

export function AddFriendDialog({ onAdd }: { onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [error, setError] = useState<string | null>(null);

  // Manual form state
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthday: '',
    howWeMet: '',
    notes: '',
    lastContact: '',
  });

  // Invite link state
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMode('search');
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setFormData({
        name: '',
        email: '',
        birthday: '',
        howWeMet: '',
        notes: '',
        lastContact: '',
      });
      setInviteeName('');
      setInviteeEmail('');
      setInviteUrl(null);
      setCopied(false);
    }
  }, [open]);

  // Fetch existing connections when dialog opens
  useEffect(() => {
    if (open) {
      fetchExistingConnections();
    }
  }, [open]);

  const fetchExistingConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const connections = await response.json();
        const status: ConnectionStatus = {};
        connections.forEach((conn: any) => {
          const otherUserId = conn.user.id;
          if (conn.status === 'accepted') {
            status[otherUserId] = 'accepted';
          } else if (conn.status === 'pending') {
            status[otherUserId] = conn.requesterId === otherUserId ? 'pending' : 'sent';
          }
        });
        setConnectionStatus(status);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  // Debounced search
  useEffect(() => {
    if (mode !== 'search') return;

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const searchUsers = async () => {
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      } else {
        const data = await response.json();
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    setSendingRequest(userId);
    setError(null);
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      });

      if (response.ok) {
        setConnectionStatus({ ...connectionStatus, [userId]: 'sent' });
        onAdd();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send request');
      }
    } catch (err) {
      setError('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpen(false);
        onAdd();
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToManual = () => {
    // Pre-fill name from search query if provided
    if (searchQuery && searchQuery.length >= 2) {
      setFormData(prev => ({ ...prev, name: searchQuery }));
    }
    setMode('manual');
  };

  const switchToInvite = () => {
    // Pre-fill name from search query if provided
    if (searchQuery && searchQuery.length >= 2) {
      setInviteeName(searchQuery);
    }
    setMode('invite');
  };

  const generateInviteLink = async () => {
    setGeneratingInvite(true);
    setError(null);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeName: inviteeName || undefined,
          inviteeEmail: inviteeEmail || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInviteUrl(data.inviteUrl);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create invite');
      }
    } catch (err) {
      setError('Failed to create invite link');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = async () => {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy link');
      }
    }
  };

  const getStatusButton = (user: User) => {
    const status = connectionStatus[user.id] || 'none';

    switch (status) {
      case 'accepted':
        return (
          <Button size="sm" variant="outline" disabled className="text-green-600">
            <Check className="w-4 h-4 mr-1" />
            Friends
          </Button>
        );
      case 'sent':
        return (
          <Button size="sm" variant="outline" disabled className="text-yellow-600">
            Pending
          </Button>
        );
      case 'pending':
        return (
          <Button size="sm" variant="outline" disabled className="text-blue-600">
            Respond
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => sendFriendRequest(user.id)}
            disabled={sendingRequest === user.id}
            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
          >
            {sendingRequest === user.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {mode === 'search' ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>
                Search for friends on Amika or add them manually.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="max-h-[250px] overflow-y-auto space-y-2">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {user.profileImage ? (
                            <AvatarImage src={user.profileImage} alt={user.name} />
                          ) : null}
                          <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {getStatusButton(user)}
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No users found on Amika</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Enter a name to search Amika users</p>
                  </div>
                )}
              </div>

              {/* Add Manually and Invite Link Options */}
              <div className="border-t pt-4 space-y-3">
                <button
                  onClick={switchToInvite}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#D4A5A5]/10 border-2 border-dashed border-[#D4A5A5] text-[#D4A5A5] hover:bg-[#D4A5A5]/20 hover:border-solid rounded-lg transition-all font-medium"
                >
                  <Link2 className="w-5 h-5" />
                  <span>Create invite link</span>
                </button>
                <p className="text-xs text-center text-muted-foreground -mt-1">
                  Share a link so your friend can join and connect with you
                </p>
                <button
                  onClick={switchToManual}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#A8C5A8]/10 border-2 border-dashed border-[#A8C5A8] text-[#A8C5A8] hover:bg-[#A8C5A8]/20 hover:border-solid rounded-lg transition-all font-medium"
                >
                  <UserRoundPlus className="w-5 h-5" />
                  <span>Add friend manually</span>
                </button>
                <p className="text-xs text-center text-muted-foreground -mt-1">
                  For friends who aren&apos;t on Amika yet
                </p>
              </div>
            </div>
          </>
        ) : mode === 'manual' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('search')}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <DialogTitle>Add Friend Manually</DialogTitle>
              </div>
              <DialogDescription>
                Add someone who isn&apos;t on Amika yet.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add email to send calendar invites
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Birthday</label>
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">How We Met</label>
                <Input
                  value={formData.howWeMet}
                  onChange={(e) => setFormData({ ...formData, howWeMet: e.target.value })}
                  placeholder="College, work, etc."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Contact</label>
                <Input
                  type="date"
                  value={formData.lastContact}
                  onChange={(e) => setFormData({ ...formData, lastContact: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                {loading ? 'Adding...' : 'Add Friend'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('search')}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <DialogTitle>Create Invite Link</DialogTitle>
              </div>
              <DialogDescription>
                Generate a link to invite a friend to Amika. They&apos;ll automatically become your friend when they sign up.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              {!inviteUrl ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Friend&apos;s Name (optional)</label>
                    <Input
                      value={inviteeName}
                      onChange={(e) => setInviteeName(e.target.value)}
                      placeholder="Their name"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Helps you remember who you sent this invite to
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Friend&apos;s Email (optional)</label>
                    <Input
                      type="email"
                      value={inviteeEmail}
                      onChange={(e) => setInviteeEmail(e.target.value)}
                      placeholder="friend@example.com"
                    />
                  </div>
                  <Button
                    onClick={generateInviteLink}
                    disabled={generatingInvite}
                    className="w-full bg-[#D4A5A5] hover:bg-[#D4A5A5]/90 text-white"
                  >
                    {generatingInvite ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Generate Invite Link
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Your invite link:</p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={inviteUrl}
                        className="text-sm font-mono"
                      />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 mt-2">Link copied to clipboard!</p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this link with your friend. When they sign up using this link, they&apos;ll automatically be added as your friend with their profile picture.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This link expires in 7 days.
                  </p>
                  <Button
                    onClick={() => {
                      setInviteUrl(null);
                      setInviteeName('');
                      setInviteeEmail('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Create Another Invite
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

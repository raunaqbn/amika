'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FriendAvatar } from '@/components/friend-avatar';
import { MemoryList } from '@/components/memory-list';
import { ArrowLeft, Edit, Trash2, Check, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  howWeMet?: string | null;
  notes?: string | null;
  lastContact?: Date | null;
  profileImage?: string | null;
  memories: Memory[];
}

interface Memory {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
}

interface DiaryNote {
  id: string;
  title: string | null;
  content: string;
  analysis: string | null;
  createdAt: string;
  updatedAt: string;
  friends: { id: string; name: string }[];
}

interface Event {
  id: string;
  friendId: string;
  eventDate: Date;
}

export default function FriendProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    howWeMet: '',
    notes: '',
    lastContact: '',
  });
  const [taggedNotes, setTaggedNotes] = useState<DiaryNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFriend();
    fetchEvents();
  }, [params.id]);

  useEffect(() => {
    if (!friend) return;

    const loadNotes = async () => {
      setNotesLoading(true);
      try {
        const response = await fetch('/api/diary');
        if (!response.ok) return;
        const data = await response.json();
        setTaggedNotes(
          data.filter((note: DiaryNote) =>
            Array.isArray(note.friends)
              ? note.friends.some((f) => f.id === friend.id)
              : false
          )
        );
      } catch (error) {
        console.error('Error fetching diary notes', error);
      } finally {
        setNotesLoading(false);
      }
    };

    loadNotes();
  }, [friend]);

  const fetchFriend = async () => {
    try {
      const response = await fetch('/api/friends');
      const data = await response.json();
      const foundFriend = data.find((f: Friend) => f.id === params.id);

      if (foundFriend) {
        setFriend(foundFriend);
        setFormData({
          name: foundFriend.name,
          birthday: foundFriend.birthday
            ? format(new Date(foundFriend.birthday), 'yyyy-MM-dd')
            : '',
          howWeMet: foundFriend.howWeMet || '',
          notes: foundFriend.notes || '',
          lastContact: foundFriend.lastContact
            ? format(new Date(foundFriend.lastContact), 'yyyy-MM-dd')
            : '',
        });
      }
    } catch (error) {
      console.error('Error fetching friend:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events?friendId=${params.id}`);
      const data = await response.json();
      const upcoming = data.filter(
        (event: Event) => new Date(event.eventDate) >= new Date()
      );
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, ...formData }),
      });

      if (response.ok) {
        setEditing(false);
        fetchFriend();
      }
    } catch (error) {
      console.error('Error updating friend:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${friend?.name}?`)) return;

    try {
      const response = await fetch(`/api/friends?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/friends');
      }
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!friend) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { url } = await uploadRes.json();

      const updateRes = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: friend.id,
          profileImage: url,
        }),
      });

      if (updateRes.ok) {
        await fetchFriend();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Friend not found</h2>
          <Button onClick={() => router.push('/friends')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div className="py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/friends')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6 mb-6 border-[#A8C5A8]/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <FriendAvatar
                name={friend.name}
                profileImage={friend.profileImage}
                hasUpcomingEvent={upcomingEvents.length > 0}
                size="md"
                editable={!editing}
                onImageUpload={handleImageUpload}
              />
              {uploading && (
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                  Uploading...
                </div>
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="font-semibold text-lg mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{friend.name}</h1>
              )}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      fetchFriend();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Birthday</label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) =>
                    setFormData({ ...formData, birthday: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">
                  {friend.birthday
                    ? format(new Date(friend.birthday), 'MMMM d, yyyy')
                    : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">How We Met</label>
              {editing ? (
                <Input
                  value={formData.howWeMet}
                  onChange={(e) =>
                    setFormData({ ...formData, howWeMet: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{friend.howWeMet || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Last Contact</label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.lastContact}
                  onChange={(e) =>
                    setFormData({ ...formData, lastContact: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">
                  {friend.lastContact
                    ? format(new Date(friend.lastContact), 'MMMM d, yyyy')
                    : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              {editing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap">
                  {friend.notes || 'No notes'}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#A8C5A8]/20">
          <h2 className="text-xl font-semibold mb-4">Memories</h2>
          <MemoryList
            friendId={friend.id}
            memories={friend.memories}
            onUpdate={fetchFriend}
          />
        </Card>

        <Card className="p-6 border-[#A8C5A8]/20 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Diary</h2>
              <p className="text-sm text-gray-600">
                Notes where {friend.name} was tagged
              </p>
            </div>
          </div>

          {notesLoading ? (
            <div className="text-sm text-gray-500">Loading notes...</div>
          ) : taggedNotes.length === 0 ? (
            <p className="text-sm text-gray-500">
              No diary entries yet for this friend.
            </p>
          ) : (
            <div className="space-y-3">
              {taggedNotes.map((note) => {
                // Generate summary: use analysis first sentence or truncated content
                let summary = note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '');
                if (note.analysis) {
                  const firstSentence = note.analysis.split(/[.!?]\s/)[0];
                  summary = firstSentence.length > 150
                    ? firstSentence.substring(0, 150) + '...'
                    : firstSentence + '.';
                }

                return (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl border border-[#A8C5A8]/30 bg-white/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">
                          {note.title?.trim() || 'Untitled note'}
                        </h3>
                        <p className="text-sm text-[#D4A5A5] font-medium">
                          {summary}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(note.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

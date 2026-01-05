'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Plus, Trash2 } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
}

interface DiaryNote {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  friends: Friend[];
}

export default function DiaryPage() {
  const [notes, setNotes] = useState<DiaryNote[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<DiaryNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, friendsRes] = await Promise.all([
        fetch('/api/diary'),
        fetch('/api/friends'),
      ]);

      const notesData = await notesRes.json();
      const friendsData = await friendsRes.json();

      setNotes(notesData);
      setFriends(friendsData.map((friend: any) => ({ id: friend.id, name: friend.name })));
    } catch (error) {
      console.error('Error fetching diary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSelectedFriends([]);
    setDialogOpen(true);
  };

  const openEditDialog = (note: DiaryNote) => {
    setEditingNote(note);
    setTitle(note.title ?? '');
    setContent(note.content);
    setSelectedFriends(note.friends.map((friend) => friend.id));
    setDialogOpen(true);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim() || null,
        content,
        friendIds: selectedFriends,
      };

      const response = await fetch('/api/diary', {
        method: editingNote ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingNote ? { ...payload, id: editingNote.id } : payload
        ),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      await fetchData();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/diary?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [notes]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 max-w-2xl mx-auto">
      <div className="py-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diary</h1>
          <p className="text-gray-600 mt-1">
            Save reflections from Mirror and tag the friends involved.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New note
        </Button>
      </div>

      {sortedNotes.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-[#A8C5A8]/40">
          <p className="text-gray-600 mb-4">
            You haven't saved any notes yet. Capture your first reflection!
          </p>
          <Button onClick={openCreateDialog} variant="outline">
            Start writing
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedNotes.map((note) => (
            <Card key={note.id} className="p-4 border-[#A8C5A8]/30">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {note.title?.trim() || 'Untitled note'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.friends.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {note.friends.map((friend) => (
                        <Badge
                          key={friend.id}
                          variant="secondary"
                          className="bg-[#D4A5A5]/20 text-[#D4A5A5] border-[#D4A5A5]/40"
                        >
                          {friend.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(note)}
                    className="text-gray-500 hover:text-[#A8C5A8]"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit note' : 'New note'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="What did you and Mirror talk about?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tag friends</label>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Add friends first to tag them here.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {friends.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriend(friend.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#A8C5A8] focus:ring-[#A8C5A8]"
                      />
                      {friend.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              {saving ? 'Saving...' : editingNote ? 'Save changes' : 'Save note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

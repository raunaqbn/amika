'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow, isThisWeek, isToday, startOfWeek, endOfWeek } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Search, Plus, X, MoreVertical, Share2, Menu } from 'lucide-react';

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
  const [selectedNote, setSelectedNote] = useState<DiaryNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('entry');

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

      // Set first note as selected if none selected
      if (notesData.length > 0 && !selectedNote) {
        const sorted = [...notesData].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setSelectedNote(sorted[0]);
      }
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

      const updatedNotes = await fetch('/api/diary').then(res => res.json());
      setNotes(updatedNotes);

      // Update selected note if it was edited
      if (editingNote) {
        const updated = updatedNotes.find((n: DiaryNote) => n.id === editingNote.id);
        if (updated) setSelectedNote(updated);
      }

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

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return sortedNotes;

    const query = searchQuery.toLowerCase();
    return sortedNotes.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.friends.some((friend) => friend.name.toLowerCase().includes(query))
    );
  }, [sortedNotes, searchQuery]);

  // Group notes by date ranges
  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: DiaryNote[] } = {
      Drafts: [],
      'Last week': [],
    };

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    filteredNotes.forEach((note) => {
      const noteDate = new Date(note.updatedAt);

      if (isThisWeek(noteDate, { weekStartsOn: 1 })) {
        groups['Last week'].push(note);
      } else {
        const weekKey = `${format(startOfWeek(noteDate, { weekStartsOn: 1 }), 'MMM do')} - ${format(endOfWeek(noteDate, { weekStartsOn: 1 }), 'MMM do, yyyy')}`;
        if (!groups[weekKey]) {
          groups[weekKey] = [];
        }
        groups[weekKey].push(note);
      }
    });

    // Remove empty Drafts section for now
    if (groups.Drafts.length === 0) {
      delete groups.Drafts;
    }

    return groups;
  }, [filteredNotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main container with two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          {/* Entries list */}
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-4">No diary notes yet</p>
                <Button
                  onClick={openCreateDialog}
                  size="sm"
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New note
                </Button>
              </div>
            ) : (
              <>
                {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
                  <div key={groupName} className="mb-6">
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {groupName}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {groupNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => setSelectedNote(note)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            selectedNote?.id === note.id
                              ? 'bg-[#F0F5F0] border-r-2 border-[#A8C5A8]'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Heart className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {note.title?.trim() || 'Untitled'}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {format(new Date(note.updatedAt), 'MMM do')} @ {format(new Date(note.updatedAt), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right main content area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedNote ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 px-8 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-red-400 mt-1" />
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        {selectedNote.title?.trim() || 'Untitled'}
                      </h1>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(selectedNote.updatedAt), 'EEEE, MMMM do')} @ {format(new Date(selectedNote.updatedAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(selectedNote)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="entry">Entry</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="entry" className="space-y-6">
                    {/* Entry reflection */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Entry Reflection
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedNote.content}
                      </p>
                    </div>

                    {/* People */}
                    {selectedNote.friends.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          People
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          {selectedNote.friends.map((friend) => (
                            <Badge
                              key={friend.id}
                              variant="secondary"
                              className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1"
                            >
                              <span className="mr-2">👤</span>
                              {friend.name}
                              <button className="ml-2 hover:text-gray-900">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analysis" className="space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Analysis
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        Analysis feature coming soon. This will provide insights about your diary entry.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Diary</h2>
                <p className="text-gray-600 mb-6">
                  Save reflections from Mirror and tag the friends involved.
                </p>
                <Button
                  onClick={openCreateDialog}
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating action button for mobile */}
      <Button
        onClick={openCreateDialog}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white shadow-lg md:hidden"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit note' : 'New note'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
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

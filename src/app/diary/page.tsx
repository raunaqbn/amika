'use client';

import { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Heart, Search, Plus, X, MoreVertical, Share2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { NewNoteDialog } from '@/components/new-note-dialog';

interface Friend {
  id: string;
  name: string;
}

interface DiaryNote {
  id: string;
  title: string | null;
  content: string;
  analysis: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  friends: Friend[];
}

function DiaryPageContent() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<DiaryNote[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<DiaryNote | null>(null);
  const [selectedNote, setSelectedNote] = useState<DiaryNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Check if there's an ID in the query params
      const noteId = searchParams.get('id');

      if (noteId) {
        // Select the note from the query param
        const noteToSelect = notesData.find((n: DiaryNote) => n.id === noteId);
        if (noteToSelect) {
          setSelectedNote(noteToSelect);
          return;
        }
      }

      // Otherwise, set first note as selected if none selected
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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxSize = 1920;
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const compressedFile = await compressImage(file);

      if (compressedFile.size > 4 * 1024 * 1024) {
        alert('Image is still too large after compression. Please use a smaller image.');
        return;
      }

      setSelectedImage(compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openCreateDialog = () => {
    setNewNoteDialogOpen(true);
  };

  const openEditDialog = (note: DiaryNote) => {
    setEditingNote(note);
    setTitle(note.title ?? '');
    setContent(note.content);
    setSelectedFriends(note.friends.map((friend) => friend.id));
    setSelectedImage(null);
    setImagePreview(note.imageUrl || null);
    setEditDialogOpen(true);
  };

  const handleNoteCreated = async () => {
    // Refresh the notes list after a new note is created
    const notesRes = await fetch('/api/diary');
    const notesData = await notesRes.json();
    setNotes(notesData);

    // Select the newest note
    const sorted = [...notesData].sort(
      (a: DiaryNote, b: DiaryNote) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (sorted.length > 0) {
      setSelectedNote(sorted[0]);
    }
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
      let imageUrl = editingNote?.imageUrl || null;

      // Upload new image if one was selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        }
      }

      const payload = {
        title: title.trim() || null,
        content,
        imageUrl,
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

      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
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

      // Clear selected note if it was deleted
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
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
    <div className="h-screen md:mt-16 md:h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Main container with two-column layout - centered on desktop */}
      <div className="flex-1 flex overflow-hidden md:max-w-6xl md:mx-auto md:w-full md:border-x md:border-gray-200">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden md:flex w-80 bg-white border-r border-gray-200 flex-col">
          {/* Search bar and New Note button */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <Button
              onClick={openCreateDialog}
              className="w-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New note
            </Button>
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
          {/* Mobile List View - shown when no note selected on mobile */}
          <div className={`md:hidden flex-1 flex flex-col ${selectedNote ? 'hidden' : ''}`}>
            {/* Mobile header with new note button and search */}
            <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
              <Button
                onClick={openCreateDialog}
                className="w-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New note
              </Button>
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

            {/* Mobile entries list */}
            <div className="flex-1 overflow-y-auto pb-32">
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
                    <div key={groupName} className="mb-4">
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
                            className="w-full text-left px-4 py-3 transition-colors hover:bg-gray-50"
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

          {/* Detail View - Desktop: always visible when note selected, Mobile: only when note selected */}
          <div className={`flex-1 flex flex-col overflow-hidden ${selectedNote ? '' : 'hidden md:flex'}`}>
          {selectedNote ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setSelectedNote(null)}
                      className="md:hidden -ml-1 mr-1 p-1 text-gray-500 hover:text-gray-700"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-400 mt-0.5 md:mt-1" />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                        {selectedNote.title?.trim() || 'Untitled'}
                      </h1>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        {format(new Date(selectedNote.updatedAt), 'EEEE, MMMM do')} @ {format(new Date(selectedNote.updatedAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
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
                <div className="mt-4 md:mt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="entry">Entry</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 bg-gray-50 pb-32 md:pb-6">
                {/* Page-like container */}
                <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-4 md:p-8 mb-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="analysis" className="space-y-6">
                      {/* Analysis */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Entry Reflection
                        </h3>
                        {selectedNote.analysis ? (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {selectedNote.analysis}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">
                            No analysis available for this entry yet.
                          </p>
                        )}
                      </div>

                      {/* Feelings - Placeholder for future implementation */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Feelings
                        </h3>
                        <p className="text-gray-500 text-sm italic">
                          Emotion tagging coming soon
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
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Topics - Placeholder for future implementation */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Topics
                        </h3>
                        <p className="text-gray-500 text-sm italic">
                          Topic tagging coming soon
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="entry" className="space-y-6">
                      {/* Entry content */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          What's on your mind?
                        </h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedNote.content}
                        </p>
                      </div>

                      {/* Image */}
                      {selectedNote.imageUrl && (
                        <div>
                          <img
                            src={selectedNote.imageUrl}
                            alt="Note"
                            className="w-full h-auto object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Diary</h2>
                <p className="text-gray-600 mb-6">
                  Save reflections from Amika and tag the friends involved.
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
      </div>

      {/* Floating action button for mobile - hidden when viewing a note */}
      {!selectedNote && (
        <Button
          onClick={openCreateDialog}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white shadow-lg md:hidden"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* New Note Dialog */}
      <NewNoteDialog
        open={newNoteDialogOpen}
        onOpenChange={setNewNoteDialogOpen}
        friends={friends}
        onNoteCreated={handleNoteCreated}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
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
                placeholder="What's on your mind?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image (optional)</label>
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Note preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-[#A8C5A8]/60 text-[#A8C5A8]"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {imagePreview ? 'Change Image' : 'Add Image'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
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
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DiaryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    }>
      <DiaryPageContent />
    </Suspense>
  );
}

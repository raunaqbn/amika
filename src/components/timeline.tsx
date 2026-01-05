'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, FileText, Heart } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { formatDistanceToNow, format } from 'date-fns';

interface TimelineEntry {
  id: string;
  type: 'diary' | 'note' | 'memory';
  title: string | null;
  content: string;
  summary: string;
  createdAt: Date;
  friends?: { id: string; name: string }[];
  friendId?: string;
  imageUrl?: string | null;
}

export function Timeline() {
  const router = useRouter();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true);

        // Fetch diary notes and memories in parallel
        const [diaryRes, memoriesRes] = await Promise.all([
          fetch('/api/diary'),
          fetch('/api/memories'),
        ]);

        if (!diaryRes.ok) throw new Error('Failed to fetch diary');

        const diaryNotes = await diaryRes.json();
        const memories = memoriesRes.ok ? await memoriesRes.json() : [];

        // Process diary entries
        const diaryEntries = diaryNotes.slice(0, 10).map((note: any) => {
          // Use first line of analysis as summary, or truncate content
          let summary = note.content.substring(0, 150) + '...';

          if (note.analysis) {
            // Extract first sentence or first 150 chars of analysis
            const firstSentence = note.analysis.split(/[.!?]\s/)[0];
            summary = firstSentence.length > 150
              ? firstSentence.substring(0, 150) + '...'
              : firstSentence + '.';
          }

          return {
            id: note.id,
            type: 'diary' as const,
            title: note.title,
            content: note.content,
            summary,
            createdAt: new Date(note.createdAt),
            friends: note.friends || [],
            imageUrl: note.imageUrl || null,
          };
        });

        // Process memory entries
        const memoryEntries = memories.slice(0, 10).map((memory: any) => {
          const summary = memory.content.length > 150
            ? memory.content.substring(0, 150) + '...'
            : memory.content;

          return {
            id: memory.id,
            type: 'memory' as const,
            title: memory.friend ? `Memory with ${memory.friend.name}` : 'Memory',
            content: memory.content,
            summary,
            createdAt: new Date(memory.createdAt),
            friends: memory.friend ? [memory.friend] : [],
            friendId: memory.friendId,
            imageUrl: memory.imageUrl || null,
          };
        });

        // Combine and sort by date descending
        const allEntries = [...diaryEntries, ...memoryEntries];
        allEntries.sort(
          (a: TimelineEntry, b: TimelineEntry) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        // Limit to 15 most recent entries
        setEntries(allEntries.slice(0, 15));
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="p-4 border border-[#A8C5A8]/30 bg-white/60 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-8 border border-[#A8C5A8]/30 bg-white/60 text-center">
        <FileText className="w-12 h-12 text-[#A8C5A8] mx-auto mb-3" />
        <p className="text-gray-600">No timeline entries yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Start adding diary entries to build your timeline!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#A8C5A8]/20" />

        {entries.map((entry) => {
          const isMemory = entry.type === 'memory';
          const handleClick = () => {
            if (isMemory && entry.friendId) {
              router.push(`/friends/${entry.friendId}`);
            } else {
              router.push(`/diary?id=${entry.id}`);
            }
          };

          return (
            <div key={entry.id} className="relative pl-12 pb-6">
              {/* Timeline dot */}
              <div
                className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white ${
                  isMemory ? 'bg-[#D4A5A5]' : 'bg-[#A8C5A8]'
                }`}
              />

              <Card
                className="p-4 border border-[#A8C5A8]/30 bg-white/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleClick}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isMemory ? (
                        <Heart className="w-4 h-4 text-[#D4A5A5] flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-[#A8C5A8] flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {entry.title || (isMemory ? 'Memory' : 'Diary Entry')}
                      </h3>
                    </div>

                    <p className="text-sm text-[#D4A5A5] font-medium mb-2 line-clamp-2">
                      {entry.summary}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{format(entry.createdAt, 'PPP')}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(entry.createdAt, { addSuffix: true })}</span>
                    </div>
                  </div>

                  {entry.imageUrl && (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={entry.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                </div>

                {entry.friends && entry.friends.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.friends.map((friend) => (
                      <Badge
                        key={friend.id}
                        variant="secondary"
                        className={`text-xs ${
                          isMemory
                            ? 'bg-[#D4A5A5]/10 text-[#D4A5A5]'
                            : 'bg-[#A8C5A8]/10 text-[#A8C5A8]'
                        }`}
                      >
                        {friend.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

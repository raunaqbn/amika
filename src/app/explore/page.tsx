'use client';

import { useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, Sparkles } from 'lucide-react';
import {
  guidedJournals,
  journalCategories,
  getJournalsByCategory,
  type GuidedJournal,
  type JournalCategory,
} from '@/lib/guided-journals';

// Memoized JournalCard to prevent re-renders
const JournalCard = memo(function JournalCard({ journal, onClick }: { journal: GuidedJournal; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="p-6 border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer group min-w-[200px] flex-shrink-0"
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
          {journal.icon}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {journal.title}
        </h3>
        <p className="text-xs text-gray-500">by {journal.author}</p>
      </div>
    </Card>
  );
});

// Memoized CategorySection to prevent re-renders
const CategorySection = memo(function CategorySection({
  category,
  journals,
  onJournalClick,
}: {
  category: { id: JournalCategory; label: string };
  journals: GuidedJournal[];
  onJournalClick: (journal: GuidedJournal) => void;
}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useState<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`scroll-${category.id}`);
    if (container) {
      const scrollAmount = 220;
      const newPosition = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {category.label}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('left')}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('right')}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div
        id={`scroll-${category.id}`}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {journals.map((journal) => (
          <JournalCard
            key={journal.id}
            journal={journal}
            onClick={() => onJournalClick(journal)}
          />
        ))}
      </div>
    </div>
  );
});

export default function ExplorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'journals' | 'prompts' | 'saved'>('journals');

  const handleJournalClick = useCallback((journal: GuidedJournal) => {
    router.push(`/explore/${journal.id}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 pt-14 md:pt-16">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-14 md:top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
              <p className="text-sm text-gray-600">Guided journal entries for self-reflection</p>
            </div>
            <Button className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Write
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start gap-6 h-auto pb-0">
            <TabsTrigger
              value="journals"
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gray-900 rounded-none pb-3 px-0 text-gray-500 data-[state=active]:text-gray-900"
            >
              Journals
            </TabsTrigger>
            <TabsTrigger
              value="prompts"
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gray-900 rounded-none pb-3 px-0 text-gray-500 data-[state=active]:text-gray-900"
            >
              Prompts
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gray-900 rounded-none pb-3 px-0 text-gray-500 data-[state=active]:text-gray-900"
            >
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journals" className="mt-6">
            {journalCategories.map((category) => {
              const journals = getJournalsByCategory(category.id);
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  journals={journals}
                  onJournalClick={handleJournalClick}
                />
              );
            })}
          </TabsContent>

          <TabsContent value="prompts" className="mt-6">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompts coming soon</h3>
              <p className="text-gray-500">Quick writing prompts for daily reflection</p>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved journals yet</h3>
              <p className="text-gray-500">Save your favorite journals to access them quickly</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

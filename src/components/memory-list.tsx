'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface Memory {
  id: string;
  content: string;
  createdAt: Date;
}

interface MemoryListProps {
  friendId: string;
  memories: Memory[];
  onUpdate: () => void;
}

export function MemoryList({ friendId, memories, onUpdate }: MemoryListProps) {
  const [newMemory, setNewMemory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId, content: newMemory }),
      });

      if (response.ok) {
        setNewMemory('');
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/memories?id=${memoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Add a Memory</label>
        <Textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Something special you remember about this friend..."
          rows={3}
        />
        <Button
          onClick={handleAddMemory}
          disabled={loading || !newMemory.trim()}
          className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
        >
          {loading ? 'Adding...' : 'Add Memory'}
        </Button>
      </div>

      <div className="space-y-3">
        {memories.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No memories yet. Add your first one above!</p>
        ) : (
          memories.map((memory) => (
            <Card key={memory.id} className="p-4 border-[#A8C5A8]/20">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{memory.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

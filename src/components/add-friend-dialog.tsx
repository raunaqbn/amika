'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';

export function AddFriendDialog({ onAdd }: { onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    howWeMet: '',
    notes: '',
    lastContact: '',
    avatarUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
        setFormData({
          name: '',
          birthday: '',
          howWeMet: '',
          notes: '',
          lastContact: '',
          avatarUrl: '',
        });
        onAdd();
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setLoading(false);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a Friend</DialogTitle>
          <DialogDescription>
            Add someone you want to stay connected with.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-sm font-medium">Profile picture</label>
            <Input
              type="url"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="Image URL (optional)"
            />
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
      </DialogContent>
    </Dialog>
  );
}

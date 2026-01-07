'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Gift, Plane, Laptop, Home, Shirt, Sparkles, Package, Star } from 'lucide-react';
import type { WishlistItemData } from './wishlist-item';

const CATEGORIES = [
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'experience', label: 'Experience', icon: Sparkles },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'tech', label: 'Tech', icon: Laptop },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'fashion', label: 'Fashion', icon: Shirt },
  { value: 'other', label: 'Other', icon: Package },
];

const PRIORITIES = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Want' },
  { value: 2, label: 'Really want' },
];

interface AddWishlistItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded?: () => void;
  itemToEdit?: WishlistItemData | null;
  onItemUpdated?: () => void;
}

export function AddWishlistItemDialog({
  open,
  onOpenChange,
  onItemAdded,
  itemToEdit,
  onItemUpdated,
}: AddWishlistItemDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [priority, setPriority] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!itemToEdit;

  // Pre-fill form when editing
  useEffect(() => {
    if (itemToEdit && open) {
      setTitle(itemToEdit.title);
      setDescription(itemToEdit.description || '');
      setLink(itemToEdit.link || '');
      setPrice(itemToEdit.price || '');
      setCategory(itemToEdit.category);
      setPriority(itemToEdit.priority);
    }
  }, [itemToEdit, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLink('');
    setPrice('');
    setCategory(null);
    setPriority(0);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        link: link.trim() || null,
        price: price.trim() || null,
        category,
        priority,
      };

      if (isEditMode && itemToEdit) {
        const res = await fetch('/api/wishlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemToEdit.id, ...payload }),
        });

        if (!res.ok) throw new Error('Failed to update item');
        onItemUpdated?.();
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to add item');
        onItemAdded?.();
      }

      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(isEditMode ? 'Failed to update item' : 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#A8C5A8]" />
            {isEditMode ? 'Edit Wish' : 'Add to Wishlist'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">What do you want?</Label>
            <Input
              id="title"
              placeholder="e.g., AirPods Pro, Trip to Paris, Cooking class..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Color, size, specific model, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Link (optional)</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (optional)</Label>
            <Input
              id="price"
              placeholder="e.g., 199, 50-100, ~250"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(isSelected ? null : cat.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-[#A8C5A8] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>How much do you want it?</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    priority === p.value
                      ? 'bg-[#A8C5A8] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.value > 0 && (
                    <span className="flex">
                      {[...Array(p.value)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </span>
                  )}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="bg-[#A8C5A8] hover:bg-[#97b897] text-white"
          >
            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add to Wishlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

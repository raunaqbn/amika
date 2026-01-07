'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Plus, Share2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { WishlistItem, type WishlistItemData } from './wishlist-item';
import { AddWishlistItemDialog } from './add-wishlist-item-dialog';
import { ShareWishlistDialog } from './share-wishlist-dialog';

interface WishlistSectionProps {
  userId: string;
  userName: string;
}

export function WishlistSection({ userId, userName }: WishlistSectionProps) {
  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WishlistItemData | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      const data = await res.json();
      setItems(data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })));
    } catch (err) {
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleTogglePurchased = async (id: string, purchased: boolean) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, purchased }),
      });
      if (!res.ok) throw new Error('Failed to update item');
      setItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, purchased, updatedAt: new Date() } : item
        )
      );
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleEdit = (item: WishlistItemData) => {
    setItemToEdit(item);
    setAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setItemToEdit(null);
    }
  };

  const unpurchasedItems = items.filter(item => !item.purchased);
  const purchasedItems = items.filter(item => item.purchased);

  return (
    <Card className="border-[#A8C5A8]/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-[#A8C5A8]" />
            My Wishlist
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="text-[#A8C5A8] border-[#A8C5A8]/30 hover:bg-[#A8C5A8]/10"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#A8C5A8] hover:bg-[#97b897] text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#A8C5A8]" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-4">{error}</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Your wishlist is empty</p>
            <p className="text-sm text-gray-400 mb-4">
              Add things you want and share with friends and family
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#A8C5A8] hover:bg-[#97b897] text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add your first wish
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active wishes */}
            {unpurchasedItems.length > 0 && (
              <div className="space-y-3">
                {unpurchasedItems.map(item => (
                  <WishlistItem
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onTogglePurchased={handleTogglePurchased}
                  />
                ))}
              </div>
            )}

            {/* Purchased section */}
            {purchasedItems.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowPurchased(!showPurchased)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-2"
                >
                  {showPurchased ? 'Hide' : 'Show'} received items ({purchasedItems.length})
                </button>
                {showPurchased && (
                  <div className="space-y-3">
                    {purchasedItems.map(item => (
                      <WishlistItem
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTogglePurchased={handleTogglePurchased}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddWishlistItemDialog
        open={addDialogOpen}
        onOpenChange={handleDialogClose}
        onItemAdded={fetchItems}
        itemToEdit={itemToEdit}
        onItemUpdated={fetchItems}
      />

      <ShareWishlistDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        userId={userId}
        userName={userName}
      />
    </Card>
  );
}

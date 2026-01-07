'use client';

import { Gift, ExternalLink, Trash2, Edit2, Check, Star, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export interface WishlistItemData {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price: string | null;
  category: string | null;
  priority: number;
  imageUrl: string | null;
  purchased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WishlistItemProps {
  item: WishlistItemData;
  onEdit?: (item: WishlistItemData) => void;
  onDelete?: (id: string) => void;
  onTogglePurchased?: (id: string, purchased: boolean) => void;
  isPublic?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  gift: 'Gift',
  experience: 'Experience',
  travel: 'Travel',
  tech: 'Tech',
  home: 'Home',
  fashion: 'Fashion',
  other: 'Other',
};

const PRIORITY_LABELS: Record<number, string> = {
  0: '',
  1: 'Want',
  2: 'Really want',
};

export function WishlistItem({ item, onEdit, onDelete, onTogglePurchased, isPublic = false }: WishlistItemProps) {
  const handleDelete = () => {
    if (onDelete && confirm('Remove this item from your wishlist?')) {
      onDelete(item.id);
    }
  };

  const handleTogglePurchased = () => {
    if (onTogglePurchased) {
      onTogglePurchased(item.id, !item.purchased);
    }
  };

  return (
    <Card className={`p-4 border shadow-sm hover:shadow-md transition-all ${
      item.purchased
        ? 'border-[#A8C5A8]/50 bg-[#A8C5A8]/5'
        : 'border-[#A8C5A8]/30 bg-white/60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Purchased toggle (only for owner) */}
        {!isPublic && onTogglePurchased && (
          <button
            onClick={handleTogglePurchased}
            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.purchased
                ? 'border-[#A8C5A8] bg-[#A8C5A8] text-white'
                : 'border-gray-300 hover:border-[#A8C5A8] hover:bg-[#A8C5A8]/10'
            }`}
            title={item.purchased ? 'Mark as not received' : 'Mark as received'}
          >
            {item.purchased && <Check className="w-4 h-4" />}
          </button>
        )}

        {/* Item image or icon */}
        <div className="flex-shrink-0">
          {item.imageUrl ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-[#A8C5A8]/10 flex items-center justify-center">
              <Gift className="w-8 h-8 text-[#A8C5A8]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className={`font-semibold ${
              item.purchased ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}>
              {item.title}
            </h3>
            {item.priority > 0 && (
              <div className="flex items-center gap-0.5">
                {[...Array(item.priority)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>

          {item.description && (
            <p className={`text-sm mb-2 ${
              item.purchased ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {item.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {item.price && (
              <span className={`inline-flex items-center text-sm font-medium ${
                item.purchased ? 'text-gray-400' : 'text-[#A8C5A8]'
              }`}>
                <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                {item.price}
              </span>
            )}

            {item.category && (
              <Badge variant="secondary" className={`text-xs ${
                item.purchased ? 'opacity-50' : ''
              }`}>
                {CATEGORY_LABELS[item.category] || item.category}
              </Badge>
            )}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs hover:underline ${
                  item.purchased ? 'text-gray-400' : 'text-blue-600'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                View
              </a>
            )}
          </div>
        </div>

        {/* Actions (only for owner) */}
        {!isPublic && (onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

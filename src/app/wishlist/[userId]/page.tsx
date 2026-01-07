'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Gift, Loader2, ExternalLink, DollarSign, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface WishlistItemData {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price: string | null;
  category: string | null;
  priority: number;
  imageUrl: string | null;
}

interface PublicWishlistData {
  items: WishlistItemData[];
  user: {
    name: string;
    profileImage: string | null;
  } | null;
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

export default function PublicWishlistPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [data, setData] = useState<PublicWishlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await fetch(`/api/wishlist/public?userId=${userId}`);
        if (res.status === 404) {
          setError('Wishlist not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch wishlist');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchWishlist();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#A8C5A8]/10 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A8C5A8]" />
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#A8C5A8]/10 to-white flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">
            {error || 'Wishlist not found'}
          </h1>
          <p className="text-gray-500">
            This wishlist may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const { items, user } = data;
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A8C5A8]/10 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
            {user.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-[#A8C5A8] text-white text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {user.name}&apos;s Wishlist
          </h1>
          <p className="text-gray-500">
            {items.length} {items.length === 1 ? 'wish' : 'wishes'}
          </p>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">This wishlist is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <Card
                key={item.id}
                className="p-4 border border-[#A8C5A8]/30 bg-white/80 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Item image or icon */}
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[#A8C5A8]/10 flex items-center justify-center">
                        <Gift className="w-10 h-10 text-[#A8C5A8]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900 text-lg">
                        {item.title}
                      </h2>
                      {item.priority > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {[...Array(item.priority)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {item.price && (
                        <span className="inline-flex items-center text-sm font-medium text-[#A8C5A8]">
                          <DollarSign className="w-4 h-4 mr-0.5" />
                          {item.price}
                        </span>
                      )}

                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </Badge>
                      )}

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View item
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <a
              href="/"
              className="text-[#A8C5A8] hover:underline font-medium"
            >
              Amika
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

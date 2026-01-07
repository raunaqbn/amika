'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Share2, Copy, Check, MessageCircle, Mail, Link2 } from 'lucide-react';

interface ShareWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function ShareWishlistDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: ShareWishlistDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/wishlist/${userId}`);
    }
  }, [userId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}'s Wishlist`,
          text: `Check out ${userName}'s wishlist on Amika!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${userName}'s Wishlist`);
    const body = encodeURIComponent(`Check out ${userName}'s wishlist!\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSMSShare = () => {
    const text = encodeURIComponent(`Check out ${userName}'s wishlist: ${shareUrl}`);
    // Use sms: protocol for native messaging
    window.open(`sms:?body=${text}`);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out ${userName}'s wishlist: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#A8C5A8]" />
            Share Your Wishlist
          </DialogTitle>
          <DialogDescription>
            Share your wishlist with friends and family so they know what to get you!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Copy link section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Wishlist link</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={copied ? 'text-[#A8C5A8] border-[#A8C5A8]' : ''}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Share via</label>
            <div className="grid grid-cols-2 gap-2">
              {supportsNativeShare && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={handleSMSShare}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center">
            Anyone with this link can view your wishlist, even if they don&apos;t have Amika.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

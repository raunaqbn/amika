'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, UserPlus, Share2, FileText, Calendar, Image as ImageIcon, Plane, Check, X, Loader2, ChevronRight, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';

type Connection = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
};

type SharedItem = {
  id: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  itemType: 'memory' | 'note' | 'event' | 'trip';
  itemId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  createdAt: string;
  sharedBy: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  item?: {
    id: string;
    title?: string;
    content?: string;
    description?: string;
    eventDate?: string;
    location?: string;
    imageUrl?: string | null;
    startDate?: string;
    endDate?: string;
  };
};

type ChatNotification = {
  id: string;
  senderName: string;
  chatType: 'event_plan' | 'trip';
  chatId: string;
  chatTitle: string;
  messagePreview: string;
  messageCount: number;
  updatedAt: string;
};

interface NotificationsDropdownProps {
  pendingCount: number;
  onCountChange?: () => void;
}

export function NotificationsDropdown({ pendingCount, onCountChange }: NotificationsDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState<Connection[]>([]);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [requestsRes, itemsRes, chatRes] = await Promise.all([
        fetch('/api/connections?type=received&status=pending'),
        fetch('/api/shared-items?type=received&status=pending'),
        fetch('/api/chat-notifications?unreadOnly=true'),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setFriendRequests(data.slice(0, 3)); // Show max 3 in dropdown
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setSharedItems(data.slice(0, 3)); // Show max 3 in dropdown
      }
      if (chatRes.ok) {
        const data = await chatRes.json();
        setChatNotifications(data.slice(0, 3)); // Show max 3 in dropdown
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    setProcessing(connectionId);
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: connectionId, status }),
      });

      if (response.ok) {
        setFriendRequests(friendRequests.filter((r) => r.id !== connectionId));
        onCountChange?.();
      }
    } catch (err) {
      console.error('Error responding to request:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleSharedItemResponse = async (itemId: string, status: 'accepted' | 'rejected') => {
    setProcessing(itemId);
    try {
      const response = await fetch('/api/shared-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status }),
      });

      if (response.ok) {
        setSharedItems(sharedItems.filter((i) => i.id !== itemId));
        onCountChange?.();
      }
    } catch (err) {
      console.error('Error responding to shared item:', err);
    } finally {
      setProcessing(null);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return <ImageIcon className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'trip':
        return <Plane className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getItemPreview = (item: SharedItem) => {
    if (!item.item) return 'Content unavailable';

    switch (item.itemType) {
      case 'memory':
        return item.item.content?.slice(0, 50) + (item.item.content && item.item.content.length > 50 ? '...' : '');
      case 'note':
        return item.item.title || item.item.content?.slice(0, 50) + '...';
      case 'event':
        return `${item.item.title}${item.item.eventDate ? ` - ${format(new Date(item.item.eventDate), 'MMM d')}` : ''}`;
      case 'trip':
        let preview = item.item.title || 'Trip';
        if (item.item.location) preview += ` to ${item.item.location}`;
        return preview;
      default:
        return 'Shared item';
    }
  };

  const handleChatNotificationClick = async (notification: ChatNotification) => {
    setProcessing(notification.id);
    try {
      // Mark as read
      await fetch('/api/chat-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType: notification.chatType, chatId: notification.chatId }),
      });

      // Remove from list
      setChatNotifications(chatNotifications.filter((n) => n.id !== notification.id));
      onCountChange?.();

      // Navigate to the chat
      setIsOpen(false);
      if (notification.chatType === 'event_plan') {
        router.push(`/event-plans/${notification.chatId}`);
      } else {
        router.push(`/trips/${notification.chatId}`);
      }
    } catch (err) {
      console.error('Error handling chat notification:', err);
    } finally {
      setProcessing(null);
    }
  };

  const hasNotifications = friendRequests.length > 0 || sharedItems.length > 0 || chatNotifications.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
          isOpen
            ? 'text-[#A8C5A8] bg-[#A8C5A8]/10'
            : 'text-gray-500 hover:text-[#A8C5A8] hover:bg-gray-50'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4A5A5] text-white text-xs rounded-full flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !hasNotifications ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              <>
                {/* Friend Requests */}
                {friendRequests.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Friend Requests
                      </p>
                    </div>
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {request.user.profileImage ? (
                              <AvatarImage src={request.user.profileImage} alt={request.user.name} />
                            ) : null}
                            <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-xs">
                              {request.user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{request.user.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleFriendResponse(request.id, 'accepted')}
                              disabled={processing === request.id}
                              className="h-7 w-7 p-0 bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                            >
                              {processing === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFriendResponse(request.id, 'rejected')}
                              disabled={processing === request.id}
                              className="h-7 w-7 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shared Items */}
                {sharedItems.length > 0 && (
                  <div className="py-2 border-t border-gray-100">
                    <div className="px-4 py-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shared With You
                      </p>
                    </div>
                    {sharedItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            {item.sharedBy.profileImage ? (
                              <AvatarImage src={item.sharedBy.profileImage} alt={item.sharedBy.name} />
                            ) : null}
                            <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-xs">
                              {item.sharedBy.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">{item.sharedBy.name}</span>
                              <span className="text-gray-400">{getItemIcon(item.itemType)}</span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{getItemPreview(item)}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleSharedItemResponse(item.id, 'accepted')}
                              disabled={processing === item.id}
                              className="h-7 w-7 p-0 bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                            >
                              {processing === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSharedItemResponse(item.id, 'rejected')}
                              disabled={processing === item.id}
                              className="h-7 w-7 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Notifications */}
                {chatNotifications.length > 0 && (
                  <div className="py-2 border-t border-gray-100">
                    <div className="px-4 py-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group Chat Messages
                      </p>
                    </div>
                    {chatNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleChatNotificationClick(notification)}
                        disabled={processing === notification.id}
                        className="w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#A8C5A8]/20 flex items-center justify-center flex-shrink-0">
                            {notification.chatType === 'trip' ? (
                              <Plane className="w-4 h-4 text-[#A8C5A8]" />
                            ) : (
                              <Calendar className="w-4 h-4 text-[#A8C5A8]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">{notification.chatTitle}</span>
                              {notification.messageCount > 1 && (
                                <span className="text-xs bg-[#D4A5A5] text-white px-1.5 py-0.5 rounded-full">
                                  {notification.messageCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              <span className="font-medium">{notification.senderName}:</span> {notification.messagePreview}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                          {processing === notification.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - View All */}
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100 text-sm font-medium text-[#A8C5A8] hover:bg-gray-50 transition-colors"
          >
            View all notifications
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// Mobile version - simpler bell icon for bottom nav
export function NotificationsBellMobile({ pendingCount }: { pendingCount: number }) {
  return (
    <Link
      href="/notifications"
      className="relative flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-400 hover:text-[#A8C5A8]"
    >
      <Bell className="w-6 h-6" />
      <span className="text-xs mt-1">Alerts</span>
      {pendingCount > 0 && (
        <span className="absolute top-1 right-1/4 w-4 h-4 bg-[#D4A5A5] text-white text-[10px] rounded-full flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </Link>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, User, LogIn, Eye, Upload, CalendarDays, Heart, Plane, Shield } from 'lucide-react';
import { NotificationsDropdown, NotificationsBellMobile } from '@/components/notifications-dropdown';
import { useAuth } from '@/lib/auth-context';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function Nav() {
  const pathname = usePathname();
  const { user, loading, updateProfile, refreshSession } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevChatNotificationsRef = useRef<number>(0);
  const isFirstFetchRef = useRef(true);

  const { playNotificationSound } = useNotificationSound();

  // Check if user is currently on a chat page (event plan or trip)
  const isOnChatPage = pathname?.startsWith('/events/plan/') || pathname?.startsWith('/trips/');

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await fetch('/api/shared-items?pendingCount=true');
      if (response.ok) {
        const data = await response.json();
        const newChatNotifications = data.chatNotifications || 0;

        // Play sound if there are new chat notifications and user is not on a chat page
        // Skip sound on first fetch to avoid sound on page load
        if (
          !isFirstFetchRef.current &&
          newChatNotifications > prevChatNotificationsRef.current &&
          !isOnChatPage
        ) {
          playNotificationSound();
        }

        prevChatNotificationsRef.current = newChatNotifications;
        isFirstFetchRef.current = false;
        setPendingCount(data.connectionRequests + data.sharedItems + newChatNotifications);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  }, [isOnChatPage, playNotificationSound]);

  // Fetch pending notification count
  useEffect(() => {
    if (user) {
      fetchPendingCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchPendingCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be less than 4MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result as string;
      const result = await updateProfile({ profileImage: imageData });

      if (result.success) {
        await refreshSession();
      } else {
        alert(result.error || 'Failed to update profile picture');
      }

      setUploading(false);
      setShowDropdown(false);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Don't show nav on auth pages or when not authenticated (landing page)
  if (pathname === '/signin' || pathname === '/signup' || (!loading && !user)) {
    return null;
  }

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/memories', icon: Heart, label: 'Memories' },
    { href: '/events', icon: CalendarDays, label: 'Events' },
    { href: '/trips', icon: Plane, label: 'Trips' },
    { href: '/diary', icon: BookOpen, label: 'Diary' },
  ];

  return (
    <>
      {/* Desktop top navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-semibold text-[#A8C5A8]">
            amika
          </Link>

          {/* Center navigation */}
          <div className="flex items-center gap-1">
            {links.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#A8C5A8] bg-[#A8C5A8]/10'
                      : 'text-gray-500 hover:text-[#A8C5A8] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - Notifications & User menu */}
          <div className="flex items-center gap-2 justify-end">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <>
                {/* Notifications Dropdown */}
                <NotificationsDropdown
                  pendingCount={pendingCount}
                  onCountChange={fetchPendingCount}
                />

                {/* Profile Menu */}
                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/profile' || showDropdown
                      ? 'text-[#A8C5A8] bg-[#A8C5A8]/10'
                      : 'text-gray-500 hover:text-[#A8C5A8] hover:bg-gray-50'
                  }`}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#A8C5A8]" />
                    </div>
                  )}
                  <span className="text-sm font-medium hidden lg:block">{user.name.split(' ')[0]}</span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {user.profileImage && (
                      <button
                        onClick={() => {
                          setShowImagePreview(true);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View picture
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : user.profileImage ? 'Change picture' : 'Upload picture'}
                    </button>
                    <div className="border-t border-gray-100 my-2" />
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      View profile
                    </Link>
                    {/* Admin Dashboard - only visible to admin */}
                    {user.email === 'raunaq.naidu@gmail.com' && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <Link
                          href="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="w-full px-4 py-2 text-left text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              </>
            ) : (
              <Link
                href="/signin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#A8C5A8] hover:bg-[#A8C5A8]/10 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#A8C5A8]/20 pb-safe z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-[#A8C5A8]'
                    : 'text-gray-400 hover:text-[#A8C5A8]'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
          {/* Notifications bell for mobile */}
          {user && (
            <NotificationsBellMobile pendingCount={pendingCount} />
          )}
          {/* Profile/Sign in on mobile */}
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 h-full">
              <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
              <span className="text-xs mt-1 text-gray-400">...</span>
            </div>
          ) : user ? (
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === '/profile'
                  ? 'text-[#A8C5A8]'
                  : 'text-gray-400 hover:text-[#A8C5A8]'
              }`}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
              <span className="text-xs mt-1">Profile</span>
            </Link>
          ) : (
            <Link
              href="/signin"
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-[#A8C5A8] transition-colors"
            >
              <LogIn className="w-6 h-6" />
              <span className="text-xs mt-1">Sign In</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {user?.profileImage && (
              <img
                src={user.profileImage}
                alt={user?.name || 'Profile'}
                className="max-w-full max-h-[60vh] rounded-lg object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

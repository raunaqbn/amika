'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, User, LogIn, Eye, Upload, CalendarDays, Heart, Plane, Shield, Menu, X, Bell, MessageCircle } from 'lucide-react';
import { NotificationsDropdown, NotificationsBellMobile } from '@/components/notifications-dropdown';
import { useAuth } from '@/lib/auth-context';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useNotificationCount, useMessageUnreadCount } from '@/hooks/use-data';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevChatNotificationsRef = useRef<number>(0);
  const isFirstFetchRef = useRef(true);

  const { playNotificationSound } = useNotificationSound();

  // Check if user is currently on a chat page (event plan or trip)
  const isOnChatPage = pathname?.startsWith('/event-plans/') || pathname?.startsWith('/trips/');

  // Use SWR for notification count with 30 second refresh
  const {
    pendingCount,
    refresh: refreshPendingCount,
  } = useNotificationCount({
    refreshInterval: user ? 30000 : 0, // Only poll when user is logged in
    isPaused: !user,
  });

  // Use SWR for message unread count
  const {
    unreadCount: messageUnreadCount,
  } = useMessageUnreadCount({
    refreshInterval: user ? 30000 : 0,
    isPaused: !user,
  });

  // Handle notification sound when chat notifications change
  useEffect(() => {
    if (pendingCount > 0) {
      // We don't have granular chat notification count from SWR hook
      // Sound is better handled at notification level - keeping for compat
      isFirstFetchRef.current = false;
    }
  }, [pendingCount]);

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMobileMenu]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

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

  // Desktop navigation links (all pages)
  const desktopLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/messages', icon: MessageCircle, label: 'Messages', badge: messageUnreadCount },
    { href: '/memories', icon: Heart, label: 'Memories' },
    { href: '/events', icon: CalendarDays, label: 'Events' },
    { href: '/trips', icon: Plane, label: 'Trips' },
    { href: '/diary', icon: BookOpen, label: 'Diary' },
  ];

  // Mobile bottom navigation (streamlined - 5 items)
  const mobileBottomLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/events', icon: CalendarDays, label: 'Events' },
    { href: '/memories', icon: Heart, label: 'Memories' },
    { href: '/trips', icon: Plane, label: 'Trips' },
  ];

  // Mobile menu links (accessible from top menu)
  const mobileMenuLinks = [
    { href: '/messages', icon: MessageCircle, label: 'Messages', badge: messageUnreadCount },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/diary', icon: BookOpen, label: 'Diary' },
    { href: '/profile', icon: User, label: 'Profile' },
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
            {desktopLinks.map(({ href, icon: Icon, label, badge }) => {
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
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {badge !== undefined && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-[#D4A5A5] text-white text-[10px] font-bold rounded-full px-1">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
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
                  onCountChange={refreshPendingCount}
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

      {/* Mobile top header */}
      <nav className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-semibold text-[#A8C5A8]">
            amika
          </Link>

          {/* Right side - Profile menu */}
          <div className="relative" ref={mobileMenuRef}>
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                    showMobileMenu
                      ? 'bg-[#A8C5A8]/10'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#A8C5A8]" />
                    </div>
                  )}
                </button>

                {/* Mobile Menu Dropdown */}
                {showMobileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {/* User info */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    {/* Menu links */}
                    {mobileMenuLinks.map(({ href, icon: Icon, label, badge }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          pathname === href
                            ? 'text-[#A8C5A8] bg-[#A8C5A8]/5'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative">
                          <Icon className="w-4 h-4" />
                          {badge !== undefined && badge > 0 && (
                            <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center bg-[#D4A5A5] text-white text-[9px] font-bold rounded-full px-0.5">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </div>
                        <span className="flex-1">{label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span className="bg-[#D4A5A5] text-white text-xs font-bold rounded-full px-2 py-0.5">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    {/* Profile image options */}
                    <div className="border-t border-gray-100 my-2" />
                    {user.profileImage && (
                      <button
                        onClick={() => {
                          setShowImagePreview(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View picture
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : user.profileImage ? 'Change picture' : 'Upload picture'}
                    </button>

                    {/* Admin Dashboard - only visible to admin */}
                    {user.email === 'raunaq.naidu@gmail.com' && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <Link
                          href="/admin"
                          onClick={() => setShowMobileMenu(false)}
                          className="w-full px-4 py-2.5 text-left text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/signin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#A8C5A8] hover:bg-[#A8C5A8]/10 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation - streamlined 5 items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#A8C5A8]/20 pb-safe z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {mobileBottomLinks.map(({ href, icon: Icon, label }) => {
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
          {/* Notifications - 5th item */}
          {user && (
            <NotificationsBellMobile pendingCount={pendingCount} />
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

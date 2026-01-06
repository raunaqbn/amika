'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass, BookOpen, User, LogIn, Eye, Upload, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { href: '/events', icon: CalendarDays, label: 'Events' },
    { href: '/explore', icon: Compass, label: 'Explore' },
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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

          {/* Right side - User menu */}
          <div className="w-32 flex justify-end">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
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
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
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

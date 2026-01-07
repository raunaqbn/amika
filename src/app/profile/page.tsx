'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import {
  User,
  Camera,
  Save,
  Loader2,
  LogOut,
  Users,
  BookOpen,
  Calendar,
  Heart,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';
import { WishlistSection } from '@/components/wishlist-section';
import { InterestSelector } from '@/components/interest-selector';
import { GoogleCalendarConnect } from '@/components/google-calendar-connect';

// Component that handles search params (must be wrapped in Suspense)
function ProfileSearchParamsHandler({
  setSuccess,
  setError
}: {
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const googleConnected = searchParams.get('google_connected');
    const googleError = searchParams.get('google_error');

    if (googleConnected === 'true') {
      setSuccess('Google Calendar connected successfully!');
      router.replace('/profile', { scroll: false });
    } else if (googleError) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Google Calendar access was denied',
        invalid_request: 'Invalid request to Google',
        invalid_state: 'Invalid authorization state',
        callback_failed: 'Failed to connect Google Calendar',
      };
      setError(errorMessages[googleError] || 'Failed to connect Google Calendar');
      router.replace('/profile', { scroll: false });
    }
  }, [searchParams, router, setSuccess, setError]);

  return null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, stats, loading, signOut, updateProfile, refreshSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (user.birthday) {
        const date = new Date(user.birthday);
        setBirthday(format(date, 'yyyy-MM-dd'));
      }
      setPhone(user.phone || '');
      setLocation(user.location || '');
      setProfileImage(user.profileImage);
      setInterests(user.interests || []);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const result = await updateProfile({
      name,
      birthday: birthday || null,
      phone: phone || null,
      location: location || null,
      profileImage,
    });

    if (result.success) {
      setSuccess('Profile updated successfully');
      await refreshSession();
    } else {
      setError(result.error || 'Failed to update profile');
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A8C5A8]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Handle Google OAuth callback params */}
      <Suspense fallback={null}>
        <ProfileSearchParamsHandler setSuccess={setSuccess} setError={setError} />
      </Suspense>

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Profile</h1>

      {/* Profile Picture */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-[#A8C5A8]" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#A8C5A8] rounded-full flex items-center justify-center text-white hover:bg-[#97B497] transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-gray-400 text-sm mt-1">
              Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Users className="w-6 h-6 text-[#A8C5A8] mx-auto mb-2" />
            <div className="text-2xl font-semibold text-gray-800">{stats.friendsCount}</div>
            <div className="text-sm text-gray-500">Friends</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Heart className="w-6 h-6 text-[#A8C5A8] mx-auto mb-2" />
            <div className="text-2xl font-semibold text-gray-800">{stats.memoriesCount}</div>
            <div className="text-sm text-gray-500">Memories</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <BookOpen className="w-6 h-6 text-[#A8C5A8] mx-auto mb-2" />
            <div className="text-2xl font-semibold text-gray-800">{stats.diaryCount}</div>
            <div className="text-sm text-gray-500">Diary Entries</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Calendar className="w-6 h-6 text-[#A8C5A8] mx-auto mb-2" />
            <div className="text-2xl font-semibold text-gray-800">{stats.eventsCount}</div>
            <div className="text-sm text-gray-500">Events</div>
          </div>
        </div>
      )}

      {/* Wishlist */}
      <div className="mb-6">
        <WishlistSection userId={user.id} userName={user.name} />
      </div>

      {/* My Interests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#A8C5A8]" />
          <h3 className="text-lg font-semibold text-gray-800">My Interests</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Share your interests with friends so they can see what you enjoy.
        </p>
        <InterestSelector
          selectedInterests={interests}
          onInterestsChange={setInterests}
          editing={true}
          onSave={async (newInterests) => {
            const result = await updateProfile({ interests: newInterests });
            if (result.success) {
              await refreshSession();
            }
          }}
        />
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#A8C5A8]" />
          <h3 className="text-lg font-semibold text-gray-800">Calendar Integration</h3>
        </div>
        <GoogleCalendarConnect
          onConnectionChange={(connected) => setGoogleCalendarConnected(connected)}
        />
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h3>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
            />
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#A8C5A8]" />
                Phone Number
              </div>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
            />
            <p className="text-xs text-gray-500 mt-1">Help friends reach you for last-minute plans</p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#A8C5A8]" />
                Location
              </div>
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
            />
            <p className="text-xs text-gray-500 mt-1">Helps us suggest events and activities in your area</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-4 bg-[#A8C5A8] text-white rounded-xl font-medium hover:bg-[#97B497] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}

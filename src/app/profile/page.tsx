'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Heart,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';
import { InterestSelector } from '@/components/interest-selector';

export default function ProfilePage() {
  const router = useRouter();
  const { user, stats, loading, signOut, updateProfile, refreshSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestedStatsRef = useRef(false);

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoMessage, setPhotoMessage] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    if (user && !stats && !requestedStatsRef.current) {
      requestedStatsRef.current = true;
      void refreshSession({ includeStats: true });
    }
  }, [refreshSession, stats, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setPhotoError('Choose a JPG, PNG, WebP, or GIF image.');
      e.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setPhotoError('That photo is over 4 MB. Choose a smaller image and try again.');
      e.target.value = '';
      return;
    }

    setPhotoError('');
    setPhotoMessage('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.onerror = () => {
      setPhotoError('That photo could not be opened. Choose another image and try again.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveProfilePhoto = async () => {
    setPhotoSaving(true);
    setPhotoError('');
    setPhotoMessage('');
    const result = await updateProfile({ profileImage });
    if (result.success) {
      setPhotoMessage('Profile photo saved.');
    } else {
      setPhotoError(result.error || 'Your photo could not be saved. Try again.');
    }
    setPhotoSaving(false);
  };

  const removeProfilePhoto = async () => {
    setPhotoSaving(true);
    setPhotoError('');
    setPhotoMessage('');
    const result = await updateProfile({ profileImage: null });
    if (result.success) {
      setProfileImage(null);
      setPhotoMessage('Profile photo removed.');
    } else {
      setPhotoError(result.error || 'Your photo could not be removed. Try again.');
    }
    setPhotoSaving(false);
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
    <div className="profile-page max-w-2xl mx-auto px-4 pt-14 md:pt-16 pb-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Profile</h1>

      {/* Profile Picture */}
      <div className="profile-photo-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="profile-photo-card__content">
          <div className="profile-photo-card__avatar">
            <div>
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={`${user.name}'s profile photo`}
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User aria-hidden="true" />
              )}
            </div>
          </div>
          <div className="profile-photo-card__identity">
            <span>Your profile photo</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <small>Member since {format(new Date(user.createdAt), 'MMMM yyyy')}</small>
          </div>
          <div className="profile-photo-card__actions">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoSaving}
            >
              <Camera aria-hidden="true" />
              {profileImage ? 'Choose a new photo' : 'Add a photo'}
            </button>
            {profileImage !== user.profileImage ? (
              <>
                <button type="button" onClick={saveProfilePhoto} disabled={photoSaving}>
                  {photoSaving ? <Loader2 className="spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                  {photoSaving ? 'Saving…' : 'Save photo'}
                </button>
                <button type="button" onClick={() => setProfileImage(user.profileImage)} disabled={photoSaving}>Cancel</button>
              </>
            ) : profileImage ? (
              <button type="button" onClick={removeProfilePhoto} disabled={photoSaving}>Remove photo</button>
            ) : null}
            <input
              ref={fileInputRef}
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="sr-only"
            />
          </div>
        </div>
        <p className="profile-photo-card__help">JPG, PNG, WebP, or GIF. Maximum 4 MB.</p>
        <div className="profile-photo-card__status" aria-live="polite">
          {photoError && <p role="alert">{photoError}</p>}
          {photoMessage && <p>{photoMessage}</p>}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
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
        </div>
      )}

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
            <p className="text-xs text-gray-500 mt-1">Help close friends keep in touch beyond the app</p>
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
            <p className="text-xs text-gray-500 mt-1">Adds familiar context to the memories you keep</p>
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

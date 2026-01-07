'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Loader2, Camera, User, Users, Calendar, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type InviteData = {
  inviteCode: string;
  inviter: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  expiresAt: string;
};

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { user, signUp } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Fetch invite details
  useEffect(() => {
    async function fetchInvite() {
      try {
        const response = await fetch(`/api/invites/${code}`);
        if (response.ok) {
          const data = await response.json();
          setInvite(data);
        } else {
          const data = await response.json();
          setInviteError(data.error || 'Invalid invite link');
        }
      } catch (err) {
        setInviteError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [code]);

  // If user is already logged in, accept invite
  useEffect(() => {
    async function acceptInviteForLoggedInUser() {
      if (user && invite) {
        try {
          const response = await fetch(`/api/invites/${code}`, {
            method: 'POST',
          });
          if (response.ok) {
            router.push('/friends?invited=true');
          } else {
            const data = await response.json();
            setInviteError(data.error || 'Failed to accept invite');
          }
        } catch (err) {
          setInviteError('Failed to accept invite');
        }
      }
    }

    if (user && invite && !loading) {
      acceptInviteForLoggedInUser();
    }
  }, [user, invite, loading, code, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleGoogleSignUp = () => {
    setGoogleLoading(true);
    window.location.href = `/api/auth/google?invite=${code}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    // First create the account
    const signUpResult = await signUp(email, password, name);

    if (!signUpResult.success) {
      setError(signUpResult.error || 'Failed to create account');
      setSubmitting(false);
      return;
    }

    // Update profile image if provided
    if (profileImage) {
      try {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage }),
        });
      } catch (err) {
        // Continue even if profile image update fails
        console.error('Failed to update profile image:', err);
      }
    }

    // Accept the invite
    try {
      const response = await fetch(`/api/invites/${code}`, {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/friends?invited=true');
      } else {
        // User is created but invite acceptance failed
        router.push('/');
      }
    } catch (err) {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#A8C5A8]" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Invite Not Available</h1>
            <p className="text-gray-600 mb-6">{inviteError}</p>
            <button
              onClick={() => router.push('/signup')}
              className="w-full py-3 px-4 bg-[#A8C5A8] text-white rounded-xl font-medium hover:bg-[#97B497] transition-colors"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A8C5A8] mx-auto mb-4" />
          <p className="text-gray-600">Accepting invite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] py-8 px-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-[#A8C5A8] tracking-tight">amika</h1>
          <p className="text-gray-500 mt-1 text-sm">Plan memories, events & trips with friends</p>
        </div>

        {/* Invite Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              {invite?.inviter.profileImage ? (
                <AvatarImage src={invite.inviter.profileImage} alt={invite.inviter.name} />
              ) : null}
              <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-lg">
                {invite?.inviter.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-gray-600 text-sm">You&apos;ve been invited by</p>
              <p className="text-lg font-semibold text-gray-800">{invite?.inviter.name}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[#A8C5A8]/10 rounded-lg">
            <p className="text-sm text-gray-700">
              Join Amika to plan memories, events, and trips together. You&apos;ll automatically become friends when you sign up!
            </p>
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Profile Picture */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#A8C5A8]/10 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-[#A8C5A8]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[#A8C5A8] rounded-full flex items-center justify-center text-white hover:bg-[#97B497] transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-xs text-center text-gray-500">Add a profile picture so {invite?.inviter.name} can recognize you</p>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8] pr-12"
                  placeholder="At least 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8]"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#A8C5A8] text-white rounded-xl font-medium hover:bg-[#97B497] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Join & Add as Friend'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Sign up with Google</span>
          </button>
        </div>

        {/* Features */}
        <div className="mt-6 flex justify-center gap-6 text-center">
          <div className="flex flex-col items-center gap-1">
            <Calendar className="w-6 h-6 text-[#A8C5A8]" />
            <span className="text-xs text-gray-500">Plan Events</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MapPin className="w-6 h-6 text-[#A8C5A8]" />
            <span className="text-xs text-gray-500">Trips</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Users className="w-6 h-6 text-[#A8C5A8]" />
            <span className="text-xs text-gray-500">Friends</span>
          </div>
        </div>
      </div>
    </div>
  );
}

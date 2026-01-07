'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [friendRequestUser, setFriendRequestUser] = useState<{ id: string; name: string } | null>(null);

  // Get friend request target from URL
  const friendRequestId = searchParams.get('friendRequest');

  // Fetch friend request user info if provided
  useEffect(() => {
    async function fetchFriendRequestUser() {
      if (!friendRequestId) return;
      try {
        const res = await fetch(`/api/wishlist/public?userId=${friendRequestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setFriendRequestUser({ id: friendRequestId, name: data.user.name });
          }
        }
      } catch {
        // Ignore errors - we just won't show the personalized message
      }
    }
    fetchFriendRequestUser();
  }, [friendRequestId]);

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

    setLoading(true);

    const result = await signUp(email, password, name, birthday || undefined);

    if (result.success) {
      // Send friend request if coming from a wishlist
      if (friendRequestId) {
        try {
          await fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addresseeId: friendRequestId }),
          });
        } catch {
          // Don't block signup flow if friend request fails
        }
      }
      router.push('/');
      router.refresh();
    } else {
      setError(result.error || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Friend request banner */}
      {friendRequestUser && (
        <div className="bg-[#A8C5A8]/10 border border-[#A8C5A8]/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#A8C5A8]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-[#A8C5A8]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Connect with {friendRequestUser.name}
              </p>
              <p className="text-xs text-gray-600">
                A friend request will be sent when you sign up
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
              Birthday (optional)
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
            disabled={loading}
            className="w-full py-3 px-4 bg-[#A8C5A8] text-white rounded-xl font-medium hover:bg-[#97B497] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#A8C5A8] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-[#A8C5A8]">amika</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#A8C5A8]" />
            </div>
          </div>
        }>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}

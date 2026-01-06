'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LandingIllustration } from './landing-illustration';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);

    if (result.success) {
      router.push('/');
      router.refresh();
    } else {
      setError(result.error || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Left side - Illustration */}
        <div className="flex flex-1 items-center justify-center">
          <LandingIllustration />
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-semibold text-[#A8C5A8] tracking-tight">amika</h1>
            <p className="text-gray-500 mt-2 text-sm">Nurture your friendships</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8] text-sm transition-all"
                  placeholder="Email address"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C5A8]/50 focus:border-[#A8C5A8] pr-12 text-sm transition-all"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 bg-[#A8C5A8] text-white rounded-xl font-semibold hover:bg-[#97B497] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#A8C5A8] hover:text-[#97B497] font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 flex justify-center gap-6 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🎂</span>
              <span className="text-xs text-gray-500">Birthdays</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">☕</span>
              <span className="text-xs text-gray-500">Meetups</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">💚</span>
              <span className="text-xs text-gray-500">Connections</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

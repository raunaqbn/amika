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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <LandingIllustration />
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-serif italic text-white tracking-tight">amika</h1>
          </div>

          {/* Login Form Card */}
          <div className="bg-[#1a1a2e]/50 backdrop-blur-sm border border-white/10 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#A8C5A8]/50 text-sm"
                placeholder="Email address"
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#A8C5A8]/50 pr-12 text-sm"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 bg-gradient-to-r from-[#A8C5A8] to-[#97B497] text-white rounded-md font-semibold hover:from-[#97B497] hover:to-[#86A386] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Features highlight */}
            <div className="space-y-3 text-center">
              <p className="text-gray-400 text-sm">Never forget a friend&apos;s birthday</p>
              <div className="flex justify-center gap-4 text-2xl">
                <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎂</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>💚</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>📅</span>
              </div>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-4 bg-[#1a1a2e]/50 backdrop-blur-sm border border-white/10 rounded-lg p-5 text-center">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#A8C5A8] hover:text-[#97B497] font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          {/* App tagline */}
          <p className="text-center text-gray-600 text-xs mt-6">
            Nurture your friendships. Stay connected.
          </p>
        </div>
      </div>

      {/* Mobile illustration - shows below form on small screens */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent z-10" />
      </div>
    </div>
  );
}

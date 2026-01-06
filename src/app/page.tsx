'use client';

import { useAuth } from '@/lib/auth-context';
import { LandingPage } from '@/components/landing-page';
import { Dashboard } from '@/components/dashboard';

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users
  return <Dashboard />;
}

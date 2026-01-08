'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { Plane, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TripInfo {
  id: string;
  title: string;
  description: string | null;
  ownerName: string;
  collaboratorCount: number;
}

function JoinTripContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const { user, loading: authLoading } = useAuth();

  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track if we've already attempted auto-join to prevent loops
  const autoJoinAttempted = useRef(false);
  // Check if we should auto-join (returning from authentication)
  const shouldAutoJoin = searchParams.get('autoJoin') === 'true';

  useEffect(() => {
    fetchTripInfo();
  }, [token]);

  // Auto-join when returning from authentication
  useEffect(() => {
    if (
      shouldAutoJoin &&
      user &&
      !authLoading &&
      tripInfo &&
      !loading &&
      !joining &&
      !success &&
      !autoJoinAttempted.current
    ) {
      autoJoinAttempted.current = true;
      performJoin();
    }
  }, [shouldAutoJoin, user, authLoading, tripInfo, loading, joining, success]);

  const fetchTripInfo = async () => {
    try {
      const response = await fetch(`/api/trips/join/${token}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('This invite link is invalid or has expired.');
        } else {
          setError('Failed to load trip information.');
        }
        return;
      }
      const data = await response.json();
      setTripInfo(data);
    } catch (err) {
      setError('Failed to load trip information.');
    } finally {
      setLoading(false);
    }
  };

  const performJoin = async () => {
    setJoining(true);
    try {
      const response = await fetch(`/api/trips/join/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to join trip.');
        return;
      }

      const data = await response.json();
      setSuccess(true);

      // Redirect to the trip page after a brief delay
      setTimeout(() => {
        router.push(`/trips/${data.tripId}`);
      }, 1500);
    } catch (err) {
      setError('Failed to join trip.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      // Redirect to sign in with return URL (include autoJoin=true to auto-join after auth)
      const returnUrl = `/trips/join/${token}?autoJoin=true`;
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    await performJoin();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  // Show joining state when auto-joining
  if (shouldAutoJoin && user && !error && !success) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A8C5A8] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Joining Trip...</h2>
          <p className="text-muted-foreground">
            Please wait while we add you to <strong>{tripInfo?.title}</strong>
          </p>
        </Card>
      </div>
    );
  }

  if (error && !tripInfo) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invite Not Found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/trips')} className="bg-[#A8C5A8] hover:bg-[#97b497]">
            Go to Trips
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">You&apos;re In!</h2>
          <p className="text-muted-foreground mb-4">
            You&apos;ve successfully joined <strong>{tripInfo?.title}</strong>
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to the trip...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#A8C5A8]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-[#A8C5A8]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Join Trip</h1>
          <p className="text-muted-foreground">
            You&apos;ve been invited to collaborate on a trip
          </p>
        </div>

        {tripInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-lg mb-1">{tripInfo.title}</h2>
            {tripInfo.description && (
              <p className="text-sm text-muted-foreground mb-2">{tripInfo.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Organized by <strong>{tripInfo.ownerName}</strong></span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {tripInfo.collaboratorCount} traveler{tripInfo.collaboratorCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-[#A8C5A8] hover:bg-[#97b497]"
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : user ? (
              'Join Trip'
            ) : (
              'Sign in to Join'
            )}
          </Button>

          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              You&apos;ll need to sign in or create an account to join this trip
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function JoinTripPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
        </div>
      }
    >
      <JoinTripContent />
    </Suspense>
  );
}

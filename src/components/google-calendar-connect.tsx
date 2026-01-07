'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar, Check, Loader2, X } from 'lucide-react';

interface GoogleCalendarConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function GoogleCalendarConnect({ onConnectionChange }: GoogleCalendarConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/auth/google-calendar?action=status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setGoogleEmail(data.email);
        onConnectionChange?.(data.connected);
      }
    } catch (error) {
      console.error('Error checking Google connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/auth/google-calendar');
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error starting Google connection:', error);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? You will no longer be able to send calendar invites.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/auth/google-calendar', { method: 'DELETE' });
      if (response.ok) {
        setIsConnected(false);
        setGoogleEmail(null);
        onConnectionChange?.(false);
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Checking connection...</span>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">Google Calendar</h3>
          {isConnected ? (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
              {googleEmail && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{googleEmail}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                You can send calendar invites to friends when creating events.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              Connect your Google Calendar to send event invites to your friends.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            {disconnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Disconnect
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

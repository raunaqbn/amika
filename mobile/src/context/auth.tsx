import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_URL, api, getToken, hydrateApiCache, setToken } from '@/lib/api';
import { clearMemoryFeedCache, hydrateMemoryFeed } from '@/lib/memory-feed';
import { resetNotificationCount } from '@/lib/notification-count';
import { unregisterPushNotifications } from '@/lib/push-notifications';
import type { User } from '@/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    await Promise.all([hydrateApiCache(), hydrateMemoryFeed()]);
    try {
      const result = await api<{ user: User | null }>('/api/auth/session');
      setUser(result.user);
      if (!result.user) {
        await clearMemoryFeedCache();
        await setToken(null);
      }
    } catch {
      setUser(null);
      await clearMemoryFeedCache();
      await setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User; sessionToken: string }>('/api/auth/signin', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    await setToken(result.sessionToken);
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await api<{ user: User; sessionToken: string }>('/api/auth/signup', {
      method: 'POST', body: JSON.stringify({ name, email, password }),
    });
    await setToken(result.sessionToken);
    setUser(result.user);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const authUrl = `${API_URL}/api/auth/google?platform=mobile`;
    if (Platform.OS === 'web') {
      window.location.assign(`${API_URL}/api/auth/google`);
      return;
    }

    const redirectUrl = Linking.createURL('auth/google');
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    if (result.type === 'cancel' || result.type === 'dismiss') return;
    if (result.type !== 'success') throw new Error('Google sign-in did not finish. Please try again.');
    const parsed = Linking.parse(result.url);
    const codeValue = parsed.queryParams?.code;
    const errorValue = parsed.queryParams?.error;
    const code = Array.isArray(codeValue) ? codeValue[0] : codeValue;
    const oauthError = Array.isArray(errorValue) ? errorValue[0] : errorValue;
    if (oauthError) throw new Error('Google sign-in was canceled or could not be completed.');
    if (typeof code !== 'string' || !code) throw new Error('Google did not return a sign-in code. Please try again.');

    const exchange = await api<{ user: User; sessionToken: string }>('/api/auth/google/mobile/exchange', {
      method: 'POST', body: JSON.stringify({ code }),
    });
    await setToken(exchange.sessionToken);
    setUser(exchange.user);
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPushNotifications();
    try {
      await api('/api/auth/signout', { method: 'POST' });
    } finally {
      await clearMemoryFeedCache();
      await setToken(null);
      resetNotificationCount();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signInWithGoogle, signUp, signOut, refresh }), [user, loading, signIn, signInWithGoogle, signUp, signOut, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

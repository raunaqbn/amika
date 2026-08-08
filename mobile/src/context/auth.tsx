import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, hydrateApiCache, setToken } from '@/lib/api';
import { clearMemoryFeedCache, hydrateMemoryFeed } from '@/lib/memory-feed';
import type { User } from '@/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const signOut = useCallback(async () => {
    try { await api('/api/auth/signout', { method: 'POST' }); } finally {
      await clearMemoryFeedCache();
      await setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signUp, signOut, refresh }), [user, loading, signIn, signUp, signOut, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

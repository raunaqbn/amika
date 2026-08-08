'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNotificationCount } from '@/hooks/use-data';

const primaryLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/explore', icon: Compass, label: 'Discover' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/diary', icon: BookOpen, label: 'Journal' },
];

const utilityLinks = [
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Nav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [notificationPolling, setNotificationPolling] = useState(false);
  const { pendingCount } = useNotificationCount({
    refreshInterval: user ? 30000 : 0,
    isPaused: !user || !notificationPolling,
  });

  useEffect(() => {
    if (!user) {
      setNotificationPolling(false);
      return;
    }
    const timer = window.setTimeout(() => setNotificationPolling(true), 750);
    return () => window.clearTimeout(timer);
  }, [user]);

  if (pathname === '/signin' || pathname === '/signup' || (!loading && !user)) return null;
  if (!user) return null;

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <aside className="app-rail" aria-label="Primary navigation">
        <Link className="app-wordmark" href="/" aria-label="Amika home">amika</Link>

        <nav className="app-rail__nav">
          {primaryLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? 'is-active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="app-rail__divider" />
          {utilityLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? 'is-active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {item.href === '/notifications' && pendingCount > 0 && <strong>{pendingCount > 9 ? '9+' : pendingCount}</strong>}
              </Link>
            );
          })}
        </nav>

        <div className="app-rail__account">
          <Link href="/profile">
            <span className="app-rail__avatar">
              {user.profileImage ? (
                <Image src={user.profileImage} alt="" fill className="object-cover" unoptimized />
              ) : (
                user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
              )}
            </span>
            <span><strong>{user.name}</strong><small>View profile</small></span>
          </Link>
          <button type="button" onClick={() => signOut()} aria-label="Sign out">
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </aside>

      <header className="mobile-app-bar">
        <Link className="app-wordmark" href="/">amika</Link>
        <div>
          <Link href="/notifications" aria-label={`${pendingCount} notifications`}>
            <Bell aria-hidden="true" />
            {pendingCount > 0 && <strong>{pendingCount > 9 ? '9+' : pendingCount}</strong>}
          </Link>
          <Link href="/profile" aria-label="Profile">
            {user.profileImage ? (
              <Image src={user.profileImage} alt="" fill className="object-cover" unoptimized />
            ) : (
              <User aria-hidden="true" />
            )}
          </Link>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {primaryLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={isActive(item.href) ? 'is-active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

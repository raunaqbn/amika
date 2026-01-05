'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Sparkles, Compass, BookOpen } from 'lucide-react';

export function Nav() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/mirror', icon: Sparkles, label: 'Mirror' },
    { href: '/explore', icon: Compass, label: 'Explore' },
    { href: '/diary', icon: BookOpen, label: 'Diary' },
  ];

  return (
    <>
      {/* Desktop top navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-semibold text-[#A8C5A8]">
            amika
          </Link>

          {/* Center navigation */}
          <div className="flex items-center gap-1">
            {links.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#A8C5A8] bg-[#A8C5A8]/10'
                      : 'text-gray-500 hover:text-[#A8C5A8] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side spacer for balance */}
          <div className="w-16" />
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#A8C5A8]/20 pb-safe z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-[#A8C5A8]'
                    : 'text-gray-400 hover:text-[#A8C5A8]'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

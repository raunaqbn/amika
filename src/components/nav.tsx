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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#A8C5A8]/20 pb-safe">
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
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  Receipt,
  Wallet,
  Calendar,
  User,
  Home,
  Heart,
} from 'lucide-react';

const profiles = [
  { id: 'diego', name: 'Diego', icon: User, color: 'text-blue-400' },
  { id: 'marta', name: 'Marta', icon: Heart, color: 'text-pink-400' },
  { id: 'casa', name: 'Casa', icon: Home, color: 'text-purple-400' },
];

const navItems = [
  { href: '', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/yearly', label: 'Year to Date', icon: Calendar },
  { href: '/upload', label: 'Upload CSV', icon: Upload },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/budget', label: 'Budget', icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  // Extract current profile from path
  const currentProfile = profiles.find(p => pathname.startsWith(`/${p.id}`));

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <Wallet className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Finanzas</span>
      </div>

      {/* Profile Switcher */}
      <div className="border-b px-3 py-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Profile
        </p>
        <div className="flex flex-col gap-0.5">
          {profiles.map(profile => {
            const Icon = profile.icon;
            const isActive = currentProfile?.id === profile.id;
            return (
              <Link
                key={profile.id}
                href={`/${profile.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? profile.color : '')} />
                {profile.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        <div className="flex flex-col gap-0.5">
          {navItems.map(item => {
            const href = currentProfile
              ? `/${currentProfile.id}${item.href}`
              : `/diego${item.href}`;
            const Icon = item.icon;
            const isActive = pathname === href;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">Local data only</p>
      </div>
    </aside>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  Sun,
  Moon,
  Monitor,
  TrendingUp,
  Search,
} from 'lucide-react';

const profiles = [
  { id: 'diego', name: 'Diego', icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'marta', name: 'Marta', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { id: 'casa', name: 'Casa', icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

const budgetingItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/yearly', label: 'Year to Date', icon: Calendar },
  { href: '/upload', label: 'Upload CSV', icon: Upload },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/budget', label: 'Budget', icon: Wallet },
];

const investmentItems = [
  { href: '/investments', label: 'Portfolio', icon: TrendingUp },
  { href: '/investments/research', label: 'Research', icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentProfile = profiles.find(p => pathname.startsWith(`/${p.id}`));

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const ThemeIcon = !mounted ? Monitor : theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel = !mounted ? 'Theme' : theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

  function isActive(itemHref: string): boolean {
    const base = `/${currentProfile?.id || 'diego'}${itemHref}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  function renderNavItem(item: { href: string; label: string; icon: typeof LayoutDashboard }) {
    const href = currentProfile
      ? `/${currentProfile.id}${item.href}`
      : `/diego${item.href}`;
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <Link
        href={currentProfile ? `/${currentProfile.id}` : '/diego'}
        className="flex items-center gap-2.5 border-b px-6 py-5 transition-colors hover:bg-muted/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold tracking-tight">Finanzas</span>
      </Link>

      {/* Profile Switcher */}
      <div className="border-b px-3 py-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Profile
        </p>
        <div className="flex flex-col gap-0.5">
          {profiles.map(profile => {
            const Icon = profile.icon;
            const isProfileActive = currentProfile?.id === profile.id;
            return (
              <Link
                key={profile.id}
                href={`/${profile.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isProfileActive
                    ? `${profile.bg} ${profile.color}`
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', isProfileActive ? profile.color : '')} />
                {profile.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Budgeting
        </p>
        <div className="flex flex-col gap-0.5">
          {budgetingItems.map(renderNavItem)}
        </div>

        <p className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Investments
        </p>
        <div className="flex flex-col gap-0.5">
          {investmentItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <button
          onClick={cycleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ThemeIcon className="h-4 w-4" />
          <span>{themeLabel}</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  PanelLeftClose,
  PanelLeftOpen,
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
  const [collapsed, setCollapsed] = useState(false);

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

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                'flex items-center justify-center rounded-lg p-2 transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-card transition-all duration-200',
          collapsed ? 'w-14' : 'w-64',
        )}
      >
        {/* Logo */}
        <Link
          href={currentProfile ? `/${currentProfile.id}` : '/diego'}
          className={cn(
            'flex items-center border-b transition-colors hover:bg-muted/50',
            collapsed ? 'justify-center px-2 py-5' : 'gap-2.5 px-6 py-5',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">Finanzas</span>}
        </Link>

        {/* Profile Switcher */}
        <div className={cn('border-b py-3', collapsed ? 'px-1.5' : 'px-3')}>
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Profile
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {profiles.map(profile => {
              const Icon = profile.icon;
              const isProfileActive = currentProfile?.id === profile.id;

              if (collapsed) {
                return (
                  <Tooltip key={profile.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/${profile.id}`}
                        className={cn(
                          'flex items-center justify-center rounded-lg p-2 transition-colors',
                          isProfileActive
                            ? `${profile.bg} ${profile.color}`
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isProfileActive ? profile.color : '')} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{profile.name}</TooltipContent>
                  </Tooltip>
                );
              }

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
        <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-1.5' : 'px-3')}>
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Budgeting
            </p>
          )}
          {collapsed && <div className="mb-1 h-px bg-border" />}
          <div className="flex flex-col gap-0.5">
            {budgetingItems.map(renderNavItem)}
          </div>

          {!collapsed && (
            <p className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Investments
            </p>
          )}
          {collapsed && <div className="my-1 h-px bg-border" />}
          <div className="flex flex-col gap-0.5">
            {investmentItems.map(renderNavItem)}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn('border-t py-3', collapsed ? 'px-1.5' : 'px-4')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={cycleTheme}
                  className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ThemeIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{themeLabel}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={cycleTheme}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ThemeIcon className="h-4 w-4" />
              <span>{themeLabel}</span>
            </button>
          )}

          {/* Collapse / Expand toggle */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="mt-1 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

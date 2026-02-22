'use client';

import { use } from 'react';
import Link from 'next/link';
import { Wallet, TrendingUp } from 'lucide-react';

const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

export default function ProfileLandingPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const name = profileNames[profile] || profile;

  const apps = [
    {
      title: 'Budgeting',
      description: 'Track expenses, manage budgets, upload bank statements, and view spending dashboards.',
      href: `/${profile}/dashboard`,
      icon: Wallet,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/40',
    },
    {
      title: 'Investments',
      description: 'Track your portfolio, monitor stock prices, and research investment opportunities with AI.',
      href: `/${profile}/investments`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-8 py-5 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Choose a section to get started</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl w-full">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.title}
                href={app.href}
                className={`group flex flex-col gap-4 rounded-2xl border ${app.border} bg-card p-8 transition-all hover:shadow-lg`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${app.bg}`}>
                  <Icon className={`h-7 w-7 ${app.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{app.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {app.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

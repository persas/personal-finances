'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface HeaderProps {
  title: string;
  subtitle?: string;
  showMonthPicker?: boolean;
  showYearPicker?: boolean;
}

export function Header({ title, subtitle, showMonthPicker = false, showYearPicker = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const now = new Date();
  const currentMonth = Number(searchParams.get('month')) || now.getMonth() + 1;
  const currentYear = Number(searchParams.get('year')) || now.getFullYear();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  function updateParams(month?: number, year?: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (month !== undefined) params.set('month', String(month));
    if (year !== undefined) params.set('year', String(year));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-8 py-5 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {showMonthPicker && (
          <Select
            value={String(currentMonth)}
            onValueChange={v => updateParams(Number(v), currentYear)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(showMonthPicker || showYearPicker) && (
          <Select
            value={String(currentYear)}
            onValueChange={v => updateParams(currentMonth, Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

import { HTMLAttributes } from 'react';

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subValue?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  valueClassName = '',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 ${valueClassName}`}>
        {value}
      </p>
      {subValue && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{subValue}</p>}
    </div>
  );
}

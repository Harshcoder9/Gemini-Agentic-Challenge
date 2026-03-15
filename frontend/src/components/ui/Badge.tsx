import { HTMLAttributes } from 'react';
import type { TrendLabel, RecommendationLabel, HealthLabel } from '@/lib/types';

type Variant =
  | 'bullish'
  | 'bearish'
  | 'neutral'
  | 'buy'
  | 'hold'
  | 'sell'
  | 'positive'
  | 'negative'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'default';

const variantStyles: Record<Variant, string> = {
  bullish: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  buy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
  hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  fair: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  bearish: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  sell: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  poor: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant | TrendLabel | RecommendationLabel | HealthLabel;
  className?: string;
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const styles = variantStyles[variant as Variant] ?? variantStyles.default;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide ${styles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

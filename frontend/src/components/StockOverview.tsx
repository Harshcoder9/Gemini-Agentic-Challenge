import type { StockOverview as StockOverviewType } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';

interface Props {
  data: StockOverviewType;
}

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  return val.toLocaleString();
}

function formatVolume(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toString();
}

export function StockOverview({ data }: Props) {
  const isPositive = data.priceChange >= 0;
  const changeColor = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400';

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white">
              {data.ticker}
            </h1>
            <span className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
              {data.companyName}
            </span>
          </div>
          {data.sector && (
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              {data.sector}
              {data.industry ? ` · ${data.industry}` : ''}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold text-zinc-900 dark:text-white">
            {data.currency}{' '}
            {data.currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className={`mt-1 text-base font-semibold ${changeColor}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(data.priceChange).toFixed(2)} (
            {isPositive ? '+' : ''}
            {data.priceChangePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Market Cap"
          value={data.marketCap ? formatMarketCap(data.marketCap) : '—'}
        />
        <StatCard
          label="P/E Ratio"
          value={data.peRatio != null ? data.peRatio.toFixed(2) : '—'}
        />
        <StatCard
          label="52W High"
          value={data.fiftyTwoWeekHigh.toFixed(2)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="52W Low"
          value={data.fiftyTwoWeekLow.toFixed(2)}
          valueClassName="text-red-500 dark:text-red-400"
        />
        <StatCard
          label="Volume"
          value={formatVolume(data.volume)}
          subValue={`Avg ${formatVolume(data.avgVolume)}`}
        />
        <StatCard label="Prev Close" value={data.previousClose.toFixed(2)} />
      </div>
    </div>
  );
}

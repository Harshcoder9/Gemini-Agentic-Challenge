'use client';

import { useEffect, useMemo, useState } from 'react';

import { getMarketIndices, getStockData } from '@/lib/api';
import type { MarketIndex, StockData } from '@/lib/types';
import { PriceChart } from '@/components/PriceChart';

const FALLBACK_STATS: MarketIndex[] = [
  { label: 'S&P 500', symbol: '^GSPC', value: 5234.18, changePercent: 0.42 },
  { label: 'NASDAQ', symbol: '^IXIC', value: 16384.47, changePercent: 0.61 },
  { label: 'DOW', symbol: '^DJI', value: 38972.86, changePercent: -0.12 },
  { label: 'VIX', symbol: '^VIX', value: 14.82, changePercent: -3.2 },
  { label: 'SENSEX', symbol: '^BSESN', value: 74000.0, changePercent: 0.0 },
];

const REFRESH_MS = 60_000;

function formatValue(index: MarketIndex): string {
  const decimals = index.label === 'VIX' ? 2 : 2;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(index.value);
}

function formatChange(changePercent: number): string {
  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
}

export function MarketStats() {
  const [stats, setStats] = useState<MarketIndex[]>(FALLBACK_STATS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('^GSPC');
  const [selectedHistory, setSelectedHistory] = useState<StockData['history']>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const live = await getMarketIndices();
        if (mounted && live.length > 0) {
          setStats(live);
        }
      } catch {
        // Keep fallback/previous values if live fetch fails.
      }
    };

    void loadStats();
    const timer = window.setInterval(() => {
      void loadStats();
    }, REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadChart = async () => {
      setChartLoading(true);
      setChartError(null);
      try {
        const data = await getStockData(selectedSymbol, '1y');
        if (mounted) {
          setSelectedHistory(data.history);
        }
      } catch {
        if (mounted) {
          setChartError('Unable to load chart data for this index right now.');
        }
      } finally {
        if (mounted) {
          setChartLoading(false);
        }
      }
    };

    void loadChart();
    const timer = window.setInterval(() => {
      void loadChart();
    }, REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [selectedSymbol]);

  const cards = useMemo(() => stats, [stats]);
  const selectedLabel = cards.find(c => c.symbol === selectedSymbol)?.label ?? 'Selected Index';

  return (
    <section>
      <div className="mb-2 text-xs text-zinc-500">Click an index to view its live chart.</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setSelectedSymbol(s.symbol)}
            className={`animate-fade-up stagger-${i} rounded-xl border px-4 py-3 text-left backdrop-blur-sm transition-all hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-900/10 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-blue-600/40 dark:hover:bg-white/[0.06] ${
              selectedSymbol === s.symbol
                ? 'border-blue-400/60 bg-blue-50/60 dark:border-blue-600/60 dark:bg-blue-900/10'
                : 'border-zinc-200/60 bg-white/80'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {s.label}
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatValue(s)}
            </p>
            <p
              className={`text-xs font-semibold ${s.changePercent >= 0 ? 'text-emerald-500' : 'text-red-400'}`}
            >
              {formatChange(s.changePercent)}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {chartLoading ? (
          <div className="flex h-56 items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/80 text-sm text-zinc-500 dark:border-white/5 dark:bg-white/[0.03]">
            Loading {selectedLabel} chart...
          </div>
        ) : chartError ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/80 px-4 text-sm text-red-400 dark:border-white/5 dark:bg-white/[0.03]">
            {chartError}
          </div>
        ) : (
          <PriceChart history={selectedHistory} indicators={null} />
        )}
      </div>
    </section>
  );
}

'use client';

import { useRouter } from 'next/navigation';

interface TrendingStock {
  ticker: string;
  name: string;
  price: string;
  change: number;
  volume: string;
}

const TRENDING: TrendingStock[] = [
  { ticker: 'NVDA', name: 'NVIDIA', price: '897.42', change: 3.2, volume: '48.3M' },
  { ticker: 'TSLA', name: 'Tesla', price: '245.18', change: 2.1, volume: '92.1M' },
  { ticker: 'META', name: 'Meta', price: '519.86', change: 1.8, volume: '21.4M' },
  { ticker: 'AAPL', name: 'Apple', price: '211.34', change: 0.9, volume: '55.7M' },
  { ticker: 'MSFT', name: 'Microsoft', price: '418.92', change: 0.5, volume: '18.2M' },
  { ticker: 'AMD', name: 'AMD', price: '168.44', change: -1.4, volume: '37.6M' },
  { ticker: 'GOOGL', name: 'Alphabet', price: '172.63', change: -0.7, volume: '22.8M' },
  { ticker: 'AMZN', name: 'Amazon', price: '196.18', change: -0.3, volume: '31.5M' },
];

export function TrendingStocks() {
  const router = useRouter();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Trending Today
        </h2>
        <span className="text-xs text-zinc-400">Click any stock to analyze</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {TRENDING.map((stock, i) => {
          const isPositive = stock.change >= 0;
          return (
            <button
              key={stock.ticker}
              onClick={() => router.push(`/stock/${stock.ticker}`)}
              className={`animate-fade-up stagger-${i} group flex items-center justify-between rounded-xl border border-zinc-200/60 bg-white/80 px-4 py-3 text-left transition-all hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-900/10 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-blue-600/40 dark:hover:bg-white/[0.06]`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                  {stock.ticker}
                </p>
                <p className="truncate text-xs text-zinc-400">{stock.name}</p>
                <p className="mt-1 text-xs text-zinc-500">${stock.price}</p>
              </div>

              <div className="ml-3 text-right">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-bold ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {isPositive ? '▲' : '▼'} {Math.abs(stock.change).toFixed(1)}%
                </span>
                <p className="mt-1 text-[10px] text-zinc-400">Vol {stock.volume}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

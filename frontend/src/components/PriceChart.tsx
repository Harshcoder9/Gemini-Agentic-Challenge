'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { HistoricalDataPoint, TechnicalIndicators } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Props {
  history: HistoricalDataPoint[];
  indicators: TechnicalIndicators | null;
}

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y', '5y'] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_DAYS: Record<Period, number> = {
  '1mo': 30,
  '3mo': 90,
  '6mo': 180,
  '1y': 365,
  '2y': 730,
  '5y': 1825,
};

function sliceHistory(history: HistoricalDataPoint[], period: Period) {
  const cutoff = new Date(Date.now() - PERIOD_DAYS[period] * 86_400_000);
  return history.filter(d => new Date(d.date) >= cutoff);
}

function formatAxisDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === '1mo' || period === '3mo')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (period === '6mo') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1.5 text-xs font-semibold text-zinc-500">
        {d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize text-zinc-500">{entry.name}:</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {entry.name === 'volume'
              ? Number(entry.value).toLocaleString()
              : Number(entry.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PriceChart({ history, indicators }: Props) {
  const [period, setPeriod] = useState<Period>('6mo');
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);

  const sliced = sliceHistory(history, period);

  const chartData = sliced.map(d => ({
    date: d.date,
    close: d.close,
    volume: d.volume,
  }));

  const prices = sliced.map(d => d.close);
  const minY = prices.length ? Math.min(...prices) * 0.97 : 0;
  const maxY = prices.length ? Math.max(...prices) * 1.03 : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Price Chart</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period selector */}
            <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-semibold transition ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* SMA toggles */}
            {indicators?.sma50 && (
              <button
                onClick={() => setShowSMA50(v => !v)}
                className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                  showSMA50
                    ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                    : 'border-zinc-200 text-zinc-400 dark:border-zinc-700'
                }`}
              >
                SMA 50
              </button>
            )}
            {indicators?.sma200 && (
              <button
                onClick={() => setShowSMA200(v => !v)}
                className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                  showSMA200
                    ? 'border-purple-400 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                    : 'border-zinc-200 text-zinc-400 dark:border-zinc-700'
                }`}
              >
                SMA 200
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 pl-0 pr-2 pt-2">
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="date"
              tickFormatter={d => formatAxisDate(d as string, period)}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              yAxisId="price"
              domain={[minY, maxY]}
              tickFormatter={v => (v as number).toFixed(0)}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              tickLine={false}
              axisLine={false}
              width={58}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tickFormatter={v => `${((v as number) / 1e6).toFixed(0)}M`}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Volume bars */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#3b82f620"
              name="volume"
              radius={[2, 2, 0, 0]}
            />

            {/* Price line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="price"
            />

            {/* SMA 50 reference */}
            {showSMA50 && indicators?.sma50 && (
              <ReferenceLine
                yAxisId="price"
                y={indicators.sma50}
                stroke="#f97316"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `SMA50 ${indicators.sma50.toFixed(0)}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#f97316',
                }}
              />
            )}

            {/* SMA 200 reference */}
            {showSMA200 && indicators?.sma200 && (
              <ReferenceLine
                yAxisId="price"
                y={indicators.sma200}
                stroke="#a855f7"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `SMA200 ${indicators.sma200.toFixed(0)}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#a855f7',
                }}
              />
            )}

            {/* Support */}
            {indicators?.support && (
              <ReferenceLine
                yAxisId="price"
                y={indicators.support}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `S ${indicators.support.toFixed(0)}`,
                  position: 'insideBottomRight',
                  fontSize: 10,
                  fill: '#10b981',
                }}
              />
            )}

            {/* Resistance */}
            {indicators?.resistance && (
              <ReferenceLine
                yAxisId="price"
                y={indicators.resistance}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `R ${indicators.resistance.toFixed(0)}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#ef4444',
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

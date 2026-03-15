'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzePortfolio } from '@/lib/api';
import type { PortfolioHolding, PortfolioAnalysis } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const QUICK_ADD_STOCKS: PortfolioHolding[] = [
  { ticker: 'GOOGLE', quantity: 1 },
  { ticker: 'TCS.NS', quantity: 1 },
  { ticker: 'APPL', quantity: 1 },
  { ticker: 'HDFCBANK.NS', quantity: 1 },
  { ticker: 'BHARTIARTL.NS', quantity: 1 },
];

const SECTOR_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#ec4899',
  '#84cc16',
];

function HoldingsTable({ holdings }: { holdings: PortfolioAnalysis['holdings'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            {['Ticker', 'Company', 'Sector', 'Price (USD)', 'Value (USD)', 'Weight'].map(col => (
              <th
                key={col}
                className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2.5 pr-4 font-bold text-blue-600 dark:text-blue-400">{h.ticker}</td>
              <td className="py-2.5 pr-4 text-zinc-700 dark:text-zinc-300">{h.companyName}</td>
              <td className="py-2.5 pr-4 text-zinc-500 dark:text-zinc-400">{h.sector ?? '—'}</td>
              <td className="py-2.5 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                <div>${h.currentPrice.toFixed(2)}</div>
                {h.originalCurrency === 'INR' && (
                  <div className="text-[11px] font-normal text-zinc-400">
                    INR {Number(h.originalPrice ?? 0).toFixed(2)} converted to USD
                  </div>
                )}
              </td>
              <td className="py-2.5 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                $
                {h.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="py-2.5 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">
                {h.weightPct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortfolioAnalyzer() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([{ ticker: '', quantity: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioAnalysis | null>(null);

  const updateHolding = (index: number, field: keyof PortfolioHolding, value: string) => {
    setHoldings(prev =>
      prev.map((h, i) =>
        i === index
          ? {
              ...h,
              [field]: field === 'quantity' ? Number(value) : value.trim().toUpperCase(),
            }
          : h
      )
    );
  };

  const addRow = () => setHoldings(prev => [...prev, { ticker: '', quantity: 0 }]);

  const removeRow = (index: number) => {
    if (holdings.length === 1) return;
    setHoldings(prev => prev.filter((_, i) => i !== index));
  };

  const addQuickStock = (stock: PortfolioHolding) => {
    setHoldings(prev => {
      const existing = prev.find(h => h.ticker === stock.ticker);
      if (existing) {
        return prev.map(h =>
          h.ticker === stock.ticker ? { ...h, quantity: Number(h.quantity || 0) + stock.quantity } : h,
        );
      }
      return [...prev, stock];
    });
  };

  const handleAnalyze = async () => {
    const valid = holdings
      .map(h => ({ ...h, ticker: h.ticker.trim().toUpperCase() }))
      .filter(h => h.ticker && h.quantity > 0);
    if (valid.length === 0) {
      setError('Add at least one holding with a ticker and quantity > 0.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzePortfolio(valid);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const sectorChartData = result
    ? Object.entries(result.sectorConcentration).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Holdings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {holdings.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ticker (e.g. AAPL)"
                  value={h.ticker}
                  onChange={e => updateHolding(i, 'ticker', e.target.value)}
                  className="w-44 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  min={1}
                  value={h.quantity || ''}
                  onChange={e => updateHolding(i, 'quantity', e.target.value)}
                  className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  onClick={() => removeRow(i)}
                  disabled={holdings.length === 1}
                  className="rounded-lg border border-zinc-200 px-2.5 py-2 text-xs text-zinc-400 transition hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={addRow}
              className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-600"
            >
              + Add row
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Analyzing…' : 'Analyze with FinAI🤖'}
            </button>
          </div>

          <div className="pt-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Quick add stocks
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ADD_STOCKS.map(stock => (
                <button
                  key={stock.ticker}
                  onClick={() => addQuickStock(stock)}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-600 dark:text-zinc-300"
                >
                  + {stock.ticker}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {result.unresolvedTickers && result.unresolvedTickers.length > 0 && (
            <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
              Could not price: {result.unresolvedTickers.join(', ')}. Sector allocation is based on
              priced holdings only.
            </div>
          )}

          {/* Summary strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Total Value
              </p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                ${result.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Diversification
              </p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {result.diversificationScore}
                <span className="text-sm font-normal text-zinc-400">/100</span>
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Holdings</p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {result.holdings.length}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Portfolio Health
              </p>
              <div className="mt-1">
                <Badge variant={result.overallHealthLabel}>{result.overallHealthLabel}</Badge>
              </div>
            </div>
          </div>

          {/* Pie chart + AI suggestions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={sectorChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, value }) =>
                        `${String(name).split(' ')[0]} ${Number(value).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {sectorChartData.map((_, index) => (
                        <Cell key={index} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="mt-0.5 text-blue-500">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.topRisks.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="mt-0.5 text-amber-500">⚠</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Holdings table */}
          <Card>
            <CardHeader>
              <CardTitle>Holdings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <HoldingsTable holdings={result.holdings} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

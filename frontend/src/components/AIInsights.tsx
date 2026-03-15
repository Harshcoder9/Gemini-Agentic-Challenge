import type { AIAnalysis, StockOverview, TechnicalIndicators } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Props {
  data: AIAnalysis;
  overview?: Pick<StockOverview, 'currentPrice' | 'currency'>;
  indicators?: TechnicalIndicators | null;
}

const trendIcons = { bullish: '📈', bearish: '📉', neutral: '➡️' } as const;
const recIcons = { buy: '🟢', hold: '🟡', sell: '🔴' } as const;

function momentumTone(rsi: number): { label: string; tone: 'bullish' | 'bearish' | 'neutral' } {
  if (rsi < 30) return { label: 'Oversold', tone: 'bullish' };
  if (rsi <= 45) return { label: 'Weakening', tone: 'neutral' };
  if (rsi < 70) return { label: 'Balanced', tone: 'neutral' };
  return { label: 'Overbought', tone: 'bearish' };
}

function priceVsMovingAverages(
  currentPrice?: number,
  indicators?: TechnicalIndicators | null
): { label: string; tone: 'bullish' | 'bearish' | 'neutral' } {
  if (!currentPrice || !indicators) return { label: 'Awaiting context', tone: 'neutral' };
  const above50 = currentPrice > indicators.sma50;
  const above200 = currentPrice > indicators.sma200;
  if (above50 && above200) return { label: 'Above SMA50 & SMA200', tone: 'bullish' };
  if (!above50 && !above200) return { label: 'Below SMA50 & SMA200', tone: 'bearish' };
  return { label: 'Mixed vs moving averages', tone: 'neutral' };
}

function signalCardTone(tone: 'bullish' | 'bearish' | 'neutral'): string {
  if (tone === 'bullish') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (tone === 'bearish') return 'border-red-500/30 bg-red-500/10 text-red-300';
  return 'border-zinc-700 bg-zinc-800/70 text-zinc-200';
}

export function AIInsights({ data, overview, indicators }: Props) {
  const confidence = Math.max(0, Math.min(100, data.confidenceScore));
  const maState = priceVsMovingAverages(overview?.currentPrice, indicators);
  const rsiState = indicators ? momentumTone(indicators.rsi) : null;
  const macdTone = indicators
    ? indicators.macd.histogram > 0
      ? 'bullish'
      : indicators.macd.histogram < 0
        ? 'bearish'
        : 'neutral'
    : 'neutral';
  const macdLabel = indicators
    ? indicators.macd.histogram > 0
      ? 'MACD improving'
      : indicators.macd.histogram < 0
        ? 'MACD under pressure'
        : 'MACD flat'
    : 'Awaiting MACD';
  const recommendationTone =
    data.recommendation === 'buy'
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
      : data.recommendation === 'hold'
        ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
        : 'border-red-500/40 bg-red-500/15 text-red-200';
  const actionPlan =
    data.recommendation === 'buy'
      ? [
          'Accumulate in small tranches instead of a single entry.',
          'Use the nearest support as a risk line for stop-loss planning.',
          'Re-check the position if RSI moves into overbought territory.',
        ]
      : data.recommendation === 'hold'
        ? [
            'Maintain current position size and avoid aggressive adds.',
            'Watch for a clean break above resistance before increasing exposure.',
            'Review headline risk before the next major market session.',
          ]
        : [
            'Avoid fresh long entries until momentum and trend improve.',
            'Reduce exposure on weak rebounds if risk is above your threshold.',
            'Wait for trend confirmation above key moving averages before re-entry.',
          ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            <span className="flex items-center gap-2">
              🤖 FinAI Insights
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                powered by Gemini
              </span>
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {data.trend !== 'neutral' && (
              <Badge variant={data.trend}>
                {trendIcons[data.trend]} {data.trend}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Confidence Score */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">AI Confidence</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{confidence}%</span>
          </div>
          <progress
            className="h-2.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-zinc-100 dark:[&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-emerald-500"
            max={100}
            value={confidence}
          />
        </div>

        {/* Recommendation lane */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <span>Decision Lane</span>
            <span>{data.recommendation}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/80 p-3 text-center text-xs font-semibold uppercase tracking-wide">
            <div
              className={`rounded-xl py-3 ${
                data.recommendation === 'buy'
                  ? recommendationTone
                  : 'bg-emerald-500/10 text-zinc-300'
              }`}
            >
              <div>Buy Zone</div>
              {data.recommendation === 'buy' && (
                <div className="mt-1 text-[10px]">{confidence}% confidence</div>
              )}
            </div>
            <div
              className={`rounded-xl py-3 ${
                data.recommendation === 'hold'
                  ? recommendationTone
                  : 'bg-amber-500/10 text-zinc-300'
              }`}
            >
              <div>Hold Zone</div>
              {data.recommendation === 'hold' && (
                <div className="mt-1 text-[10px]">{confidence}% confidence</div>
              )}
            </div>
            <div
              className={`rounded-xl py-3 ${
                data.recommendation === 'sell' ? recommendationTone : 'bg-red-500/10 text-zinc-300'
              }`}
            >
              <div>Sell Zone</div>
              {data.recommendation === 'sell' && (
                <div className="mt-1 text-[10px]">{confidence}% confidence</div>
              )}
            </div>
          </div>
        </div>

        {/* Signal snapshot */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Why Gemini Leaned This Way
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-xl border p-3 ${signalCardTone(data.trend)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                Trend Regime
              </p>
              <p className="mt-1 text-sm font-semibold capitalize">{data.trend}</p>
              <p className="mt-2 text-xs opacity-80">
                Technical summary aligns with a {data.trend} setup.
              </p>
            </div>
            <div className={`rounded-xl border p-3 ${signalCardTone(rsiState?.tone ?? macdTone)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                Momentum
              </p>
              <p className="mt-1 text-sm font-semibold">
                {rsiState ? rsiState.label : 'Awaiting RSI'}
              </p>
              <p className="mt-2 text-xs opacity-80">
                {indicators
                  ? `RSI ${indicators.rsi.toFixed(1)} · ${macdLabel}`
                  : 'Indicator context not loaded.'}
              </p>
            </div>
            <div className={`rounded-xl border p-3 ${signalCardTone(maState.tone)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                Positioning
              </p>
              <p className="mt-1 text-sm font-semibold">{maState.label}</p>
              <p className="mt-2 text-xs opacity-80">
                {overview && indicators
                  ? `${overview.currency} ${overview.currentPrice.toFixed(2)} vs SMA50 ${indicators.sma50.toFixed(2)} / SMA200 ${indicators.sma200.toFixed(2)}`
                  : 'Price context not loaded.'}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Summary */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Technical Summary
          </p>
          <p className="text-sm leading-relaxed text-zinc-200">{data.technicalSummary}</p>
        </div>

        {/* Risk Factors */}
        {data.riskFactors.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Risk Factors
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.riskFactors.map((risk, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-zinc-200"
                >
                  <span className="mt-0.5 text-amber-500">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation & Action Plan */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Recommendation & Action Plan
          </p>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant={data.recommendation}>
              {recIcons[data.recommendation]} {data.recommendation}
            </Badge>
            <span className="text-xs text-zinc-400">what to do next based on current context</span>
          </div>
          <ul className="space-y-2">
            {actionPlan.map((step, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

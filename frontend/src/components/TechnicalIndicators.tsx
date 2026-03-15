import type { TechnicalIndicators as TechnicalIndicatorsData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Props {
  data: TechnicalIndicatorsData;
}

function RSIGauge({ value }: { value: number }) {
  const rsi = Math.max(0, Math.min(100, value));
  let color = 'bg-emerald-500 text-white';
  let label = '➡️Neutral';
  if (rsi < 30) {
    color = 'bg-blue-500 text-white';
    label = 'Oversold';
  } else if (rsi > 70) {
    color = 'bg-red-500 text-white';
    label = 'Overbought';
  } else if (rsi < 45) {
    color = 'bg-amber-300 text-amber-950';
    label = 'Weakening';
  } else if (rsi > 55) {
    color = 'bg-orange-500 text-white';
    label = 'Strengthening';
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">RSI (14)</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-zinc-900 dark:text-white">{rsi.toFixed(1)}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>
        </div>
      </div>
      {/* Track with zone colouring */}
      <div className="relative h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className="absolute inset-y-0 left-0 w-[30%] bg-blue-100 dark:bg-blue-900/30" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-red-100 dark:bg-red-900/30" />
        <div
          className={`absolute top-0 h-full w-1 rounded-full ${color} transition-all duration-700`}
          style={{ left: `${rsi}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
        <span>Oversold &lt;30</span>
        <span>Neutral 30–70</span>
        <span>Overbought &gt;70</span>
      </div>
    </div>
  );
}

function MACDSection({ macd }: { macd: TechnicalIndicatorsData['macd'] }) {
  const isBullish = macd.macd > macd.signal;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">MACD</span>
        <Badge variant={isBullish ? 'bullish' : 'bearish'}>
          {isBullish ? 'Bullish' : 'Bearish'} crossover
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'MACD',
            value: macd.macd,
            colored: true,
          },
          { label: 'Signal', value: macd.signal, colored: false },
          { label: 'Histogram', value: macd.histogram, colored: true },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-lg bg-zinc-50 p-2.5 text-center dark:bg-zinc-800"
          >
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{item.label}</p>
            <p
              className={`text-sm font-bold ${
                item.colored
                  ? item.value >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {item.value.toFixed(3)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TechnicalIndicators({ data }: Props) {
  const trendIcons: Record<string, string> = {
    bullish: '📈',
    bearish: '📉',
    neutral: '➡️',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Technical Indicators</CardTitle>
          <Badge variant={data.trend}>
            {trendIcons[data.trend] || '➡️'} {data.trend}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* RSI */}
        <RSIGauge value={data.rsi} />

        {/* MACD */}
        <MACDSection macd={data.macd} />

        {/* Moving Averages */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Moving Averages
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'SMA 50', value: data.sma50 },
              { label: 'SMA 200', value: data.sma200 },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">{item.label}</p>
                <p className="mt-0.5 text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {item.value.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bollinger Bands */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Bollinger Bands
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-red-50 p-2.5 text-center dark:bg-red-900/20">
              <p className="text-[10px] uppercase tracking-wide text-red-400">Upper</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {data.bollingerBands.upper.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-2.5 text-center dark:bg-zinc-800">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">Middle</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {data.bollingerBands.middle.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-center dark:bg-emerald-900/20">
              <p className="text-[10px] uppercase tracking-wide text-emerald-500">Lower</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {data.bollingerBands.lower.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Key Levels */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Key Levels</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-900/20">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Support
              </span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {data.support.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800 dark:bg-red-900/20">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                Resistance
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-300">
                {data.resistance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import type { NewsAnalysis, NewsArticle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useState } from 'react';

interface Props {
  data: NewsAnalysis;
}

const sentimentDot: Record<NewsArticle['sentiment'], string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral: 'bg-zinc-400',
};

function SentimentMeter({ score }: { score: number }) {
  const pct = ((score + 1) / 2) * 100;
  const isPositive = score > 0.2;
  const isNegative = score < -0.2;
  const label = isPositive ? 'Positive' : isNegative ? 'Negative' : 'Neutral';
  const textColor = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegative
      ? 'text-red-500 dark:text-red-400'
      : 'text-zinc-500';
  const thumbColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#a1a1aa';

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Market Sentiment
        </span>
        <span className={`text-sm font-bold ${textColor}`}>
          {label} ({score > 0 ? '+' : ''}
          {score.toFixed(2)})
        </span>
      </div>
      {/* Gradient track */}
      <div
        className="relative h-3 overflow-visible rounded-full"
        style={{ background: 'linear-gradient(to right, #ef4444, #d4d4d8 50%, #10b981)' }}
      >
        <div
          className="absolute top-1/2 h-5 w-5 rounded-full border-2 border-white shadow-md transition-all duration-700"
          style={{
            left: `${Math.max(2, Math.min(98, pct))}%`,
            transform: 'translate(-50%, -50%)',
            background: thumbColor,
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsSentiment({ data }: Props) {
  const { isSpeaking, isSupported, speak, stop } = useTextToSpeech();
  const [isReadingSentiment, setIsReadingSentiment] = useState(false);

  const generateSentimentSummary = () => {
    const sentiment = data.sentimentLabel;
    const score = data.sentimentScore.toFixed(2);
    const summary = `Market sentiment is ${sentiment}. Sentiment score is ${score}. ${data.oneLinerSummary}`;
    return summary;
  };

  const handleReadSentiment = () => {
    if (isReadingSentiment) {
      stop();
      setIsReadingSentiment(false);
    } else {
      const summary = generateSentimentSummary();
      speak(summary);
      setIsReadingSentiment(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>News &amp; Sentiment</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={data.sentimentLabel}>{data.sentimentLabel}</Badge>
            {isSupported && (
              <button
                onClick={handleReadSentiment}
                className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                title="Read sentiment aloud"
              >
                {isReadingSentiment && isSpeaking ? '⏸ Pause' : '🔊'}
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <SentimentMeter score={data.sentimentScore} />

        {/* One-liner AI summary */}
        <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
          &ldquo;{data.oneLinerSummary}&rdquo;
        </p>

        {/* Key themes */}
        {data.keyThemes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.keyThemes.map((theme, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Articles */}
        <div className="space-y-2">
          {data.articles.slice(0, 7).map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 transition hover:border-blue-300 hover:shadow-sm dark:border-zinc-700 dark:hover:border-blue-700"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sentimentDot[article.sentiment]}`}
              />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {article.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {article.source} · {timeAgo(article.publishedAt)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

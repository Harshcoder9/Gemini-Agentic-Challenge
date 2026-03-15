'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  getStockData,
  getIndicators,
  getAIAnalysis,
  getStockNews,
  APIClientError,
} from '@/lib/api';
import type {
  StockData,
  TechnicalIndicators,
  AIAnalysis,
  NewsAnalysis,
  StockOverview as StockOverviewType,
} from '@/lib/types';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { StockOverview } from '@/components/StockOverview';
import { PriceChart } from '@/components/PriceChart';
import { TechnicalIndicators as TechnicalIndicatorsPanel } from '@/components/TechnicalIndicators';
import { AIInsights } from '@/components/AIInsights';
import { NewsSentiment } from '@/components/NewsSentiment';

interface Props {
  params: Promise<{ ticker: string }>;
}

interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function init<T>(): LoadState<T> {
  return { data: null, loading: true, error: null };
}

function errMsg(err: unknown): string {
  return err instanceof APIClientError ? err.message : 'Something went wrong.';
}

export default function StockPage({ params }: Props) {
  const { ticker } = use(params);
  const symbol = decodeURIComponent(ticker).toUpperCase();

  const [stock, setStock] = useState<LoadState<StockData>>(init());
  const [indicators, setIndicators] = useState<LoadState<TechnicalIndicators>>(init());
  const [aiAnalysis, setAIAnalysis] = useState<LoadState<AIAnalysis>>(init());
  const [news, setNews] = useState<LoadState<NewsAnalysis>>(init());

  useEffect(() => {
    if (!symbol) return;

    getStockData(symbol)
      .then(data => setStock({ data, loading: false, error: null }))
      .catch(err => setStock({ data: null, loading: false, error: errMsg(err) }));

    getIndicators(symbol)
      .then(data => setIndicators({ data, loading: false, error: null }))
      .catch(err => setIndicators({ data: null, loading: false, error: errMsg(err) }));

    getAIAnalysis(symbol)
      .then(data => setAIAnalysis({ data, loading: false, error: null }))
      .catch(err => setAIAnalysis({ data: null, loading: false, error: errMsg(err) }));

    getStockNews(symbol)
      .then(data => setNews({ data, loading: false, error: null }))
      .catch(err => setNews({ data: null, loading: false, error: errMsg(err) }));
  }, [symbol]);

  /* ── Full-page loading ── */
  if (stock.loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <FullPageSpinner />
        <p className="text-sm text-zinc-500">
          Fetching <span className="font-semibold text-zinc-900 dark:text-zinc-100">{symbol}</span>…
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (stock.error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-5xl">⚠️</p>
        <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Could not load {symbol}
        </p>
        <p className="text-sm text-zinc-500">{stock.error}</p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const { history, ...overview } = stock.data!;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Dashboard
      </Link>

      {/* Stock header + stats */}
      <StockOverview data={overview as StockOverviewType} />

      {/* Price chart — full width */}
      <PriceChart history={history} indicators={indicators.data} />

      {/* Indicators + AI Insights side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Technical Indicators */}
        {indicators.loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <FullPageSpinner />
          </div>
        ) : indicators.error ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-200 p-4 text-sm text-red-400 dark:border-zinc-700">
            {indicators.error}
          </div>
        ) : indicators.data ? (
          <TechnicalIndicatorsPanel data={indicators.data} />
        ) : null}

        {/* AI Insights */}
        {aiAnalysis.loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <FullPageSpinner />
            <p className="text-xs text-zinc-400">Gemini is thinking…</p>
          </div>
        ) : aiAnalysis.error ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-200 p-4 text-sm text-red-400 dark:border-zinc-700">
            {aiAnalysis.error}
          </div>
        ) : aiAnalysis.data ? (
          <AIInsights
            data={aiAnalysis.data}
            overview={overview as StockOverviewType}
            indicators={indicators.data}
          />
        ) : null}
      </div>

      {/* News Sentiment — full width */}
      {news.loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <FullPageSpinner />
        </div>
      ) : news.error ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-zinc-200 p-4 text-sm text-red-400 dark:border-zinc-700">
          {news.error}
        </div>
      ) : news.data ? (
        <NewsSentiment data={news.data} />
      ) : null}

    </div>
  );
}

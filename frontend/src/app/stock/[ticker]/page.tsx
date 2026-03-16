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
  const [aiAnalysis, setAIAnalysis] = useState<LoadState<AIAnalysis>>({ data: null, loading: false, error: null });
  const [news, setNews] = useState<LoadState<NewsAnalysis>>(init());

  const handleRunAI = () => {
    setAIAnalysis({ data: null, loading: true, error: null });
    getAIAnalysis(symbol)
      .then(data => setAIAnalysis({ data, loading: false, error: null }))
      .catch(err => setAIAnalysis({ data: null, loading: false, error: errMsg(err) }));
  };

  useEffect(() => {
    if (!symbol) return;

    getStockData(symbol)
      .then(data => setStock({ data, loading: false, error: null }))
      .catch(err => setStock({ data: null, loading: false, error: errMsg(err) }));

    getIndicators(symbol)
      .then(data => setIndicators({ data, loading: false, error: null }))
      .catch(err => setIndicators({ data: null, loading: false, error: errMsg(err) }));

    // getAIAnalysis(symbol)  <-- REMOVED Automatic call to save quota

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
          <div className="flex h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <FullPageSpinner />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 animate-pulse">
              Gemini is performing deep technical analysis…
            </p>
          </div>
        ) : aiAnalysis.error ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-900/30 dark:bg-red-900/10">
            <p className="text-sm text-red-500">{aiAnalysis.error}</p>
            <button
              onClick={handleRunAI}
              className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95"
            >
              Retry AI Analysis
            </button>
          </div>
        ) : aiAnalysis.data ? (
          <AIInsights
            data={aiAnalysis.data}
            overview={overview as StockOverviewType}
            indicators={indicators.data}
          />
        ) : (
          <div className="flex h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 text-center transition-all hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-blue-900/50">
             <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 opacity-20 blur animate-pulse" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm dark:bg-zinc-800">
                  ✨
                </div>
             </div>
             <div className="space-y-2">
               <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Deep AI Research</h3>
               <p className="max-w-[280px] text-sm text-zinc-500">
                 Unlock institutional-grade technical insights and sentiment reasoning powered by Gemini 2.0.
               </p>
             </div>
             <button
               onClick={handleRunAI}
               className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-zinc-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
             >
                <span className="relative z-10 flex items-center gap-2">
                  Analyze with FinAI
                  <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                </span>
             </button>
          </div>
        )}
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

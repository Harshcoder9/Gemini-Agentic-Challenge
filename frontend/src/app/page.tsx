import { StockSearch } from '@/components/StockSearch';
import { TrendingStocks } from '@/components/TrendingStocks';
import { MarketStats } from '@/components/MarketStats';

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#3b82f6" fillOpacity="0.12" />
        <path d="M8 36 L16 26 L24 30 L32 18 L40 22" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 36 L16 26 L24 30 L32 18 L40 22 V36 Z" fill="#3b82f6" fillOpacity="0.12" />
        <circle cx="40" cy="22" r="3" fill="#3b82f6" />
      </svg>
    ),
    title: 'Stock Analysis',
    desc: 'Real-time price, market cap, P/E ratio, and 52-week range powered by live market data.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#8b5cf6" fillOpacity="0.12" />
        <path d="M10 34 A 14 14 0 0 1 38 34" stroke="#8b5cf6" strokeOpacity="0.25" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M10 34 A 14 14 0 0 1 29 17" stroke="#8b5cf6" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="24" y1="32" x2="31" y2="19" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="32" r="3" fill="#8b5cf6" />
      </svg>
    ),
    title: 'Technical Indicators',
    desc: 'RSI, MACD, SMA 50/200, Bollinger Bands and key support & resistance levels.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#6366f1" fillOpacity="0.12" />
        <circle cx="24" cy="24" r="5" fill="#6366f1" />
        <circle cx="24" cy="12" r="2.5" fill="#6366f1" fillOpacity="0.7" />
        <circle cx="35" cy="18" r="2.5" fill="#6366f1" fillOpacity="0.7" />
        <circle cx="35" cy="30" r="2.5" fill="#6366f1" fillOpacity="0.7" />
        <circle cx="24" cy="36" r="2.5" fill="#6366f1" fillOpacity="0.7" />
        <circle cx="13" cy="30" r="2.5" fill="#6366f1" fillOpacity="0.7" />
        <circle cx="13" cy="18" r="2.5" fill="#6366f1" fillOpacity="0.7" />
        <line x1="24" y1="19" x2="24" y2="14.5" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="28" y1="21" x2="33" y2="18" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="28" y1="27" x2="33" y2="30" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="24" y1="29" x2="24" y2="33.5" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="20" y1="27" x2="15" y2="30" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="20" y1="21" x2="15" y2="18" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
      </svg>
    ),
    title: 'Gemini AI Insights',
    desc: 'AI-generated trend analysis, risk factors, and buy/hold/sell recommendations.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#f59e0b" fillOpacity="0.12" />
        <rect x="10" y="11" width="28" height="26" rx="3" stroke="#f59e0b" strokeWidth="2" />
        <line x1="15" y1="18" x2="33" y2="18" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="15" y1="24" x2="33" y2="24" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
        <line x1="15" y1="30" x2="24" y2="30" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
        <circle cx="33" cy="30" r="3.5" fill="#10b981" />
        <path d="M31.5 30 L32.5 31.2 L35 28.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'News Sentiment',
    desc: 'Latest financial news with AI-powered sentiment scoring and theme extraction.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#10b981" fillOpacity="0.12" />
        <circle cx="24" cy="24" r="13" stroke="#3b82f6" strokeWidth="6" strokeDasharray="28.6 53.1" transform="rotate(-90 24 24)" />
        <circle cx="24" cy="24" r="13" stroke="#10b981" strokeWidth="6" strokeDasharray="24.5 57.2" strokeDashoffset="-28.6" transform="rotate(-90 24 24)" />
        <circle cx="24" cy="24" r="13" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="18 63.7" strokeDashoffset="-53.1" transform="rotate(-90 24 24)" />
      </svg>
    ),
    title: 'Portfolio Analyzer',
    desc: 'Analyze your portfolio for sector concentration, diversification, and AI suggestions.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#14b8a6" fillOpacity="0.12" />
        <line x1="8" y1="38" x2="40" y2="38" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.35" />
        <line x1="8" y1="30" x2="40" y2="30" stroke="#14b8a6" strokeWidth="1" strokeOpacity="0.2" />
        <line x1="8" y1="22" x2="40" y2="22" stroke="#14b8a6" strokeWidth="1" strokeOpacity="0.2" />
        <line x1="13" y1="13" x2="13" y2="34" stroke="#10b981" strokeWidth="1.5" />
        <rect x="10" y="19" width="6" height="10" rx="1.5" fill="#10b981" />
        <line x1="24" y1="16" x2="24" y2="36" stroke="#ef4444" strokeWidth="1.5" />
        <rect x="21" y="22" width="6" height="11" rx="1.5" fill="#ef4444" />
        <line x1="35" y1="12" x2="35" y2="31" stroke="#10b981" strokeWidth="1.5" />
        <rect x="32" y="16" width="6" height="10" rx="1.5" fill="#10b981" />
      </svg>
    ),
    title: 'Interactive Charts',
    desc: 'Zoomable price charts with moving averages, volume overlay, and level markers.',
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/5 bg-[#070f1c] px-8 py-14 text-white shadow-2xl">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
          <div className="animate-float h-72 w-[600px] rounded-full bg-blue-700/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0">
          <div className="animate-float-slow h-48 w-48 rounded-full bg-violet-600/10 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Powered by Gemini AI
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            AI Stock Research,{' '}
            <span className="animate-shimmer-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          <p className="mb-8 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Enter any stock ticker to get real-time data, technical indicators, news sentiment,
            and Gemini-powered investment insights in seconds.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <StockSearch />
          </div>
        </div>
      </section>

      {/* Market summary */}
      <MarketStats />

      {/* Trending stocks */}
      <TrendingStocks />

      {/* Features */}
      <section>
        <h2 className="mb-1 text-center text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Everything you need to research stocks
        </h2>
        <p className="mb-6 text-center text-sm text-zinc-400">Six powerful tools, one platform</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`animate-fade-up stagger-${i} group rounded-2xl border border-zinc-200/60 bg-white/80 p-5 transition-all hover:border-blue-300/40 hover:shadow-lg hover:shadow-blue-900/5 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-blue-700/30 dark:hover:bg-white/[0.05]`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                {f.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="pb-4 text-center text-xs text-zinc-500">
        Built for hackathon &middot; Data via yfinance &amp; NewsAPI &middot; AI via Google Gemini
      </p>
    </div>
  );
}
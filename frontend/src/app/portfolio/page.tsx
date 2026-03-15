import { PortfolioAnalyzer } from '@/components/PortfolioAnalyzer';

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
          Portfolio Analyzer
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your holdings below. Gemini AI will analyze diversification, sector concentration,
          and provide actionable improvement suggestions.
        </p>
      </div>
      <PortfolioAnalyzer />
    </div>
  );
}

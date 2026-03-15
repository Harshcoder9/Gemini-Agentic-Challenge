import { ChartAnalyzer } from '@/components/ChartAnalyzer';

export default function ChartVisionPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Chart Vision
        </h1>
        <p className="max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          Upload any stock chart screenshot, and Gemini will analyze patterns, identify support / resistance levels, and provide trading insights.
        </p>
      </div>

      <div className="max-w-4xl">
        <ChartAnalyzer />
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { analyzeChartImage } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { ChartAnalysis } from '@/lib/types';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceInput } from '@/hooks/useVoiceInput';

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp';

export function ChartAnalyzer() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();
  const { isListening, startListening, stopListening, transcript, resetTranscript, browserSupportsSpeechRecognition } = useVoiceInput();

  const buildNarration = useCallback((data: ChartAnalysis): string => {
    const levels = [
      data.supportLevel ? `Support is around ${data.supportLevel}.` : '',
      data.resistanceLevel ? `Resistance is around ${data.resistanceLevel}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return [
      `Signal is ${data.signal}.`,
      data.patterns.length ? `Detected patterns: ${data.patterns.join(', ')}.` : '',
      data.summary,
      levels,
      `Recommendation: ${data.recommendation}`,
    ]
      .filter(Boolean)
      .join(' ');
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      // Strip data-URL prefix -> send raw base64 + mime
      const [header, base64] = preview.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/png';
      const result = await analyzeChartImage(base64, mimeType);
      setAnalysis(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }, [preview]);

  const handleVoiceCommand = useCallback(
    (rawCommand: string) => {
      const cmd = rawCommand.trim().toLowerCase();
      if (!cmd) return;

      if (cmd.includes('reset') || cmd.includes('remove') || cmd.includes('clear')) {
        reset();
        return;
      }

      if (cmd.includes('analyze') || cmd.includes('analyse')) {
        void handleAnalyze();
        return;
      }

      if (cmd.includes('read') || cmd.includes('speak') || cmd.includes('explain')) {
        if (!analysis) {
          setError('No chart analysis available yet. Upload and analyze a chart first.');
          return;
        }
        if (isSpeaking) {
          stop();
        } else {
          speak(buildNarration(analysis));
        }
      }
    },
    [analysis, buildNarration, handleAnalyze, isSpeaking, speak, stop]
  );

  const handleVoiceButton = () => {
    if (isListening) {
      stopListening();
      setTimeout(() => {
        const latest = transcript.trim();
        resetTranscript();
        handleVoiceCommand(latest);
      }, 180);
      return;
    }

    resetTranscript();
    startListening();
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large. Max ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setAnalysis(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setPreview(null);
    setFileName(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-[10px] font-bold text-white">
                V
              </span>
              Chart Vision
            </span>
          </CardTitle>
          {preview && (
            <button
              onClick={reset}
              className="text-[11px] text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Upload any stock chart screenshot — Gemini will identify patterns, support/resistance, and give a trading view.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {browserSupportsSpeechRecognition && (
            <button
              type="button"
              onClick={handleVoiceButton}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 dark:bg-zinc-700'
              }`}
            >
              {isListening ? '⏹ Stop Voice Command' : '🎤 Voice Command'}
            </button>
          )}

          {isSupported && analysis && (
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stop();
                } else {
                  speak(buildNarration(analysis));
                }
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              {isSpeaking ? '⏸ Stop Audio Summary' : '🔊 Read Analysis'}
            </button>
          )}
        </div>

        {isListening && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Listening... Try commands like: &quot;analyze chart&quot;, &quot;read analysis&quot;, or &quot;reset&quot;.
          </p>
        )}

        {!preview ? (
          /* Drop zone */
          <label
            htmlFor="chart-upload"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all ${
              dragging
                ? 'border-teal-400 bg-teal-50/30 dark:border-teal-500 dark:bg-teal-500/10'
                : 'border-zinc-200 bg-zinc-50/50 hover:border-teal-300 hover:bg-teal-50/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-teal-600/50'
            }`}
          >
            <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12" aria-hidden="true">
              <rect width="48" height="48" rx="10" fill="#14b8a6" fillOpacity="0.12" />
              <path d="M24 16v16M16 24l8-8 8 8" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="10" y="34" width="28" height="4" rx="2" fill="#14b8a6" fillOpacity="0.25" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop a chart image here
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">or click to browse · PNG, JPEG, WebP · max {MAX_MB} MB</p>
            </div>
            <input
              ref={fileInputRef}
              id="chart-upload"
              type="file"
              accept={ACCEPT}
              onChange={onFileChange}
              aria-label="Upload chart image"
              className="hidden"
            />
          </label>
        ) : (
          /* Preview + Analyze */
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={fileName ?? 'Chart preview'}
                className="max-h-64 w-full object-contain"
              />
            </div>
            <p className="text-xs text-zinc-400 truncate">{fileName}</p>
            {!analysis && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? <Spinner size="sm" /> : null}
                {loading ? 'Gemini is reading the chart…' : '🔍 Analyze with Gemini Vision'}
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Analysis result */}
        {analysis && (
          <div className="animate-fade-up space-y-4">
            {/* Pattern + Signal strip */}
            <div className="flex flex-wrap gap-2">
              {analysis.patterns.map(p => (
                <span
                  key={p}
                  className="rounded-full border border-teal-200/60 bg-teal-50/60 px-3 py-1 text-xs font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300"
                >
                  {p}
                </span>
              ))}
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  analysis.signal === 'bullish'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : analysis.signal === 'bearish'
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400'
                }`}
              >
                {analysis.signal.toUpperCase()}
              </span>
            </div>

            {/* Summary */}
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {analysis.summary}
            </p>

            {/* Key levels */}
            {(analysis.supportLevel || analysis.resistanceLevel) && (
              <div className="grid grid-cols-2 gap-3">
                {analysis.supportLevel && (
                  <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Support</p>
                    <p className="mt-0.5 font-bold text-zinc-900 dark:text-zinc-100">{analysis.supportLevel}</p>
                  </div>
                )}
                {analysis.resistanceLevel && (
                  <div className="rounded-lg border border-red-200/50 bg-red-50/50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">Resistance</p>
                    <p className="mt-0.5 font-bold text-zinc-900 dark:text-zinc-100">{analysis.resistanceLevel}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            <div className="rounded-xl border border-indigo-200/50 bg-indigo-50/40 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">Gemini Recommendation</p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{analysis.recommendation}</p>
            </div>

            <button
              onClick={reset}
              className="w-full rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 dark:border-white/10 dark:hover:border-white/20"
            >
              Upload another chart
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveStockChat } from '@/hooks/useLiveStockChat';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import type { StockOverview, TechnicalIndicators } from '@/lib/types';

interface Props {
  symbol: string;
  overview: StockOverview;
  indicators: TechnicalIndicators | null;
}

function buildNarrationPrompt(
  symbol: string,
  overview: StockOverview,
  indicators: TechnicalIndicators | null,
): string {
  const sign = overview.priceChangePercent >= 0 ? '+' : '';
  let p = `Give me a brief spoken analyst briefing for ${symbol} (${overview.companyName}). `;
  p += `Current price is $${overview.currentPrice.toFixed(2)}, ${sign}${overview.priceChangePercent.toFixed(2)}% today. `;
  p += `52-week range: $${overview.fiftyTwoWeekLow.toFixed(2)} to $${overview.fiftyTwoWeekHigh.toFixed(2)}. `;
  if (indicators) {
    p += `RSI is ${indicators.rsi.toFixed(1)}, overall trend is ${indicators.trend}. `;
    p += `SMA 50 at $${indicators.sma50.toFixed(2)}, SMA 200 at $${indicators.sma200.toFixed(2)}. `;
    p += `Support at $${indicators.support.toFixed(2)}, resistance at $${indicators.resistance.toFixed(2)}. `;
  }
  p += `Keep your response concise and conversational, like a financial advisor speaking to a client. Do not use markdown.`;
  return p;
}

export function StockVoiceAgent({ symbol, overview, indicators }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [symbolInput, setSymbolInput] = useState(symbol);
  const [activeSymbols, setActiveSymbols] = useState<string[]>([symbol]);

  // Refs for safe async access
  const autoNarratedRef = useRef(false);
  const seenBeforeOpenRef = useRef<Set<string>>(new Set());
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef('');
  const messagesRef = useRef<ReturnType<typeof useLiveStockChat>['messages']>([]);

  const { messages, loading, connected, error, sendMessage, interrupt } = useLiveStockChat({
    symbols: isOpen ? activeSymbols : [],
  });

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useVoiceInput();

  // Keep messagesRef in sync for snapshot reads
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // === Panel open / close ===
  useEffect(() => {
    if (isOpen) {
      // Snapshot IDs that exist before this session so we don't re-speak them
      seenBeforeOpenRef.current = new Set(messagesRef.current.map(m => m.id));
      autoNarratedRef.current = false;
      spokenIdsRef.current = new Set();
    } else {
      stopSpeaking();
    }
    // intentionally omit messagesRef and stopSpeaking (stable refs / stable callbacks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // === Auto-narrate once WS connects ===
  useEffect(() => {
    if (!isOpen || !connected || autoNarratedRef.current) return;
    autoNarratedRef.current = true;
    if (activeSymbols.length === 1 && activeSymbols[0] === symbol) {
      sendMessage(buildNarrationPrompt(symbol, overview, indicators));
      return;
    }

    sendMessage(
      `Give me a concise overall chart and momentum review for these stocks: ${activeSymbols.join(', ')}. Highlight trend, relative strength, and key differences in one spoken-friendly response.`,
    );
  }, [isOpen, connected, activeSymbols, symbol, overview, indicators, sendMessage]);

  // === TTS: speak completed assistant messages ===
  useEffect(() => {
    if (!isOpen || messages.length === 0 || loading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return;
    if (seenBeforeOpenRef.current.has(lastMsg.id)) return;
    if (spokenIdsRef.current.has(lastMsg.id)) return;
    spokenIdsRef.current.add(lastMsg.id);
    speak(lastMsg.content);
  }, [messages, loading, isOpen, speak]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track transcript in ref for access after recognition ends
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // === Submit voice transcript when recognition ends ===
  useEffect(() => {
    if (isListening) return; // still listening
    const text = transcriptRef.current.trim();
    if (!text) return;
    resetTranscript();
    transcriptRef.current = '';
    if (isSpeaking) {
      stopSpeaking();
      interrupt();
    }
    sendMessage(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // === Handlers ===
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !connected) return;
    setInputText('');
    sendMessage(text);
  }, [inputText, connected, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleMicButton = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    if (isSpeaking) {
      stopSpeaking();
      interrupt();
    }
    startListening();
  }, [isListening, isSpeaking, stopListening, startListening, stopSpeaking, interrupt]);

  const handleApplySymbols = useCallback(() => {
    const parsed = symbolInput
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 5);

    const next = parsed.length > 0 ? parsed : [symbol];
    setActiveSymbols(next);
    autoNarratedRef.current = false;
    spokenIdsRef.current.clear();
  }, [symbolInput, symbol]);

  const handleClose = useCallback(() => {
    if (isListening) stopListening();
    stopSpeaking();
    setIsOpen(false);
    setInputText('');
  }, [isListening, stopListening, stopSpeaking]);

  return (
    <>
      {/* ── Floating chat panel ── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-80 flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          style={{ height: '440px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                🤖 Voice Market Bot
              </span>
              {isSpeaking && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-blue-500">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  Speaking
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? 'bg-green-500' : 'animate-pulse bg-yellow-400'
                }`}
                title={connected ? 'Connected' : 'Connecting…'}
              />
              <button
                onClick={handleClose}
                className="text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Compare symbols (comma separated, max 5)
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={symbolInput}
                  onChange={e => setSymbolInput(e.target.value)}
                  placeholder="AAPL, INFY, MSFT"
                  className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  onClick={handleApplySymbols}
                  className="h-8 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Active: {activeSymbols.join(', ')}
              </p>
              {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
            </div>

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
                  <span className="inline-flex gap-1 text-zinc-500 dark:text-zinc-400">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
                      ·
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
                      ·
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
                      ·
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Listening banner */}
          {isListening && (
            <div className="mx-3 mb-1 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              🎤 Listening… speak your question
            </div>
          )}

          {/* Input row */}
          <div className="border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!connected}
                placeholder={connected ? 'Ask for overall review or compare stocks…' : 'Connecting…'}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              <button
                onClick={handleMicButton}
                disabled={!connected}
                title={isListening ? 'Stop listening' : 'Voice input'}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-50 ${
                  isListening
                    ? 'animate-pulse bg-red-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                🎤
              </button>
              <button
                onClick={handleSend}
                disabled={!connected || !inputText.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-xl shadow-lg transition hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-zinc-700 text-white hover:bg-zinc-800'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title={isOpen ? 'Close AI Agent' : 'Talk to AI Agent about this stock'}
      >
        {isOpen ? '✕' : '🎙️'}
      </button>
    </>
  );
}

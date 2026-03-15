'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Should I buy this stock now?',
  'What are the key risks?',
  'Explain the recent price drop',
  'Compare this stock with MSFT and GOOGL',
  'What would change your buy/hold/sell view?',
];

export function StockChat({ ticker, companyName }: { ticker: string; companyName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(ticker, trimmed, messages);
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([
        ...history,
        { role: 'assistant', content: '⚠ Could not reach the AI. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                AI
              </span>
              Ask about {companyName}
            </span>
          </CardTitle>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-[11px] text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Clear chat
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Suggestion chips — shown only before first message */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Message thread */}
        {messages.length > 0 && (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <span className="mr-2 mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-white">
                    AI
                  </span>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : 'rounded-bl-sm bg-zinc-100 text-zinc-800 dark:bg-white/5 dark:text-zinc-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <span className="mr-2 mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-white">
                  AI
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 dark:bg-white/5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 dark:border-white/10 dark:bg-white/5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask anything about ${ticker}…`}
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M3.105 3.105a.75.75 0 01.814-.156l13 5.5a.75.75 0 010 1.102l-13 5.5a.75.75 0 01-1.008-.965L4.67 10 2.91 4.214a.75.75 0 01.195-.109z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-[10px] text-zinc-400">
          Powered by Gemini 2.5 Flash · Context-aware of {ticker} price, indicators &amp; news
        </p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          Educational use only. FinAgent is an AI assistant, not a licensed financial advisor.
        </p>
      </CardContent>
    </Card>
  );
}

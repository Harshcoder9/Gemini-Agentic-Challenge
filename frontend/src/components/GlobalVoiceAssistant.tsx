'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLiveStockChat } from '@/hooks/useLiveStockChat';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { motion } from 'framer-motion';

const AgenticLoader = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Synchronize fake steps to match backend latency of fetching news/stocks
    const sequence = [
      { delay: 300, action: () => setStep(1) },
      { delay: 800, action: () => setStep(2) },
      { delay: 1000, action: () => setStep(3) },
      { delay: 1100, action: () => setStep(4) },
    ];
    let totalDelay = 0;
    const timeouts = sequence.map(({ delay, action }) => {
      totalDelay += delay;
      return setTimeout(action, totalDelay);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const steps = [
    { text: 'Agent planning strategy...', done: step > 0 },
    { text: 'Tool call: Market Data & News...', done: step > 1 },
    { text: 'Synthesizing indicators...', done: step > 2 },
    { text: 'Agent formulating response...', done: step > 3 },
  ];

  return (
    <div className="flex justify-start my-2">
      <div className="flex w-64 flex-col gap-2 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 px-4 py-3 shadow-sm dark:border-indigo-500/20 dark:from-indigo-900/10 dark:to-purple-900/10">
        {steps.map((s, i) =>
          i <= step ? (
            <div key={i} className="flex animate-fade-in items-center gap-2 text-xs">
              {s.done ? (
                <span className="font-bold text-indigo-500">✓</span>
              ) : (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></span>
              )}
              <span
                className={`truncate ${
                  s.done ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {s.text}
              </span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export function GlobalVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Refs for safe async access
  const autoGreetedRef = useRef(false);
  const seenBeforeOpenRef = useRef<Set<string>>(new Set());
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef('');
  const messagesRef = useRef<ReturnType<typeof useLiveStockChat>['messages']>([]);

  // No symbols = general finance chatbot mode
  const connectionSymbols = useMemo(() => (isOpen ? ['GENERAL'] : []), [isOpen]);
  const { messages, loading, connected, error, sendMessage, interrupt } = useLiveStockChat({
    symbols: connectionSymbols,
  });

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useVoiceInput();

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // === Panel open / close ===
  useEffect(() => {
    if (isOpen) {
      seenBeforeOpenRef.current = new Set(messagesRef.current.map(m => m.id));
      autoGreetedRef.current = false;
      spokenIdsRef.current = new Set();
    } else {
      stopSpeaking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // === removed auto-greet to prevent user from sending welcome message ===

  // === TTS: speak completed assistant messages ===
  useEffect(() => {
    if (!ttsEnabled || !isOpen || messages.length === 0 || loading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return;
    if (seenBeforeOpenRef.current.has(lastMsg.id)) return;
    if (spokenIdsRef.current.has(lastMsg.id)) return;
    spokenIdsRef.current.add(lastMsg.id);
    speak(lastMsg.content);
  }, [messages, loading, isOpen, speak, ttsEnabled]);

  const toggleTts = useCallback(() => {
    setTtsEnabled(prev => {
      const next = !prev;
      if (!next) {
        stopSpeaking();
        setSpeakingId(null);
      }
      return next;
    });
  }, [stopSpeaking]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track transcript in ref
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // === Submit voice transcript when recognition ends ===
  useEffect(() => {
    if (isListening) return;
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
    [handleSend]
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
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-[4.5rem] right-6 z-40 touch-none"
        >
          {/* Panel */}
          <div className="relative z-50 flex w-[90vw] sm:w-[360px] h-[550px] max-h-[75vh] flex-col overflow-hidden rounded-[24px] border border-zinc-200 bg-white/95 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0c0f14]/95">
            {/* Header / Drag Handle */}
            <div className="flex shrink-0 cursor-grab active:cursor-grabbing items-center justify-between border-b border-white/5 bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="font-semibold">FinAI🤖</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTts}
                  className={`text-[10px] sm:text-xs rounded px-2 py-1 transition ${
                    ttsEnabled ? 'bg-white/20 text-white' : 'bg-black/20 text-white/80'
                  }`}
                  aria-label={ttsEnabled ? 'Disable auto voice' : 'Enable auto voice'}
                >
                  {ttsEnabled ? '🔊 Auto Voice On' : '🔇 Auto Voice Off'}
                </button>
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-xs">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Speaking
                  </span>
                )}
                <button onClick={handleClose} className="text-white/80 transition hover:text-white">
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && (
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => {
                            if (speakingId === msg.id) {
                              stopSpeaking();
                              setSpeakingId(null);
                            } else {
                              speak(msg.content);
                              setSpeakingId(msg.id);
                            }
                          }}
                          className="text-[10px] font-medium opacity-60 hover:opacity-100 transition"
                        >
                          {speakingId === msg.id && isSpeaking ? '⏸ Pause' : '🔊 Read'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Agentic Chain of Thought / Typing indicator */}
              {loading &&
                (messages.length > 0 && messages[messages.length - 1].role === 'user' ? (
                  <AgenticLoader />
                ) : (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
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
                ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Listening banner */}
            {isListening && (
              <div className="mx-4 mb-1 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                🎤 Listening… speak your question
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mx-4 mb-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                {error}
              </div>
            )}

            {/* Input row */}
            <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!connected}
                  placeholder={connected ? 'Ask me anything…' : 'Connecting…'}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
                <button
                  onClick={handleMicButton}
                  disabled={!connected}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-50 ${
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Floating button (bottom-right) ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open FinAI🤖 Assistant"
          title="Ask FinAI🤖 anything about finance"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg transition hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
        >
          FinAI🤖
        </button>
      </div>
    </>
  );
}

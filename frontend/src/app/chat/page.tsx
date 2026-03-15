'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { searchStocks } from '@/lib/stocks';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLiveStockChat } from '@/hooks/useLiveStockChat';

interface StockSelection {
  ticker: string;
  name: string;
  exchange: string;
}

export default function ChatPage() {
  const [selectedStocks, setSelectedStocks] = useState<StockSelection[]>([]);
  const [input, setInput] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const spokenIdsRef = useRef<Set<string>>(new Set());

  const selectedSymbols = useMemo(() => selectedStocks.map(s => s.ticker), [selectedStocks]);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    return searchStocks(searchQuery.trim()).slice(0, 8);
  }, [searchQuery]);

  const {
    messages,
    loading,
    connected,
    error: liveError,
    sendMessage,
    interrupt,
  } = useLiveStockChat({ symbols: selectedSymbols });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, isSupported, speak, stop } = useTextToSpeech();
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useVoiceInput();
  const transcriptRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep latest transcript in a ref for interruption-safe voice handoff.
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (!ttsEnabled || !isSupported || loading || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (last.role !== 'assistant') return;
    if (!last.content?.trim()) return;
    if (spokenIdsRef.current.has(last.id)) return;

    spokenIdsRef.current.add(last.id);
    speak(last.content);
  }, [messages, loading, ttsEnabled, isSupported, speak]);

  const toggleTts = useCallback(() => {
    setTtsEnabled(prev => {
      const next = !prev;
      if (!next) {
        stop();
        setSpeakingIndex(null);
      }
      return next;
    });
  }, [stop]);

  const addStock = (stock: StockSelection) => {
    if (selectedStocks.length >= 5) {
      setSelectionError('Maximum 5 stocks at a time');
      return;
    }
    if (!selectedStocks.find(s => s.ticker === stock.ticker)) {
      setSelectedStocks([...selectedStocks, stock]);
      setSearchQuery('');
      setShowDropdown(false);
      setSelectionError('');
    }
  };

  const removeStock = (ticker: string) => {
    setSelectedStocks(selectedStocks.filter(s => s.ticker !== ticker));
  };

  const handleSendMessage = async () => {
    if (!input.trim()) {
      setSelectionError('Please enter a message');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setSelectionError('');
    sendMessage(userMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header removed - nav has the title */}

        {/* Stock Selection */}
        <Card className="mb-6 border-zinc-700 bg-zinc-900 p-4">
          <p className="text-sm font-semibold text-zinc-300 mb-3">Optional Watchlist Symbols</p>

          {/* Stock Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
              placeholder="Search stocks (e.g., Apple, INFY, Reliance)..."
              className="w-full px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-48 overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 shadow-lg">
                {searchResults.map(stock => (
                  <button
                    key={stock.ticker}
                    onClick={() => addStock(stock)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-700 text-left"
                  >
                    <div>
                      <p className="font-semibold text-white">{stock.name}</p>
                      <p className="text-xs text-zinc-400">{stock.ticker}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-400">{stock.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Stocks */}
          {selectedStocks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map(stock => (
                <div
                  key={stock.ticker}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/40 border border-blue-600 text-blue-300"
                >
                  <div>
                    <span className="font-semibold">{stock.ticker}</span>
                    <span className="text-xs text-blue-400 ml-1">({stock.exchange})</span>
                  </div>
                  <button
                    onClick={() => removeStock(stock.ticker)}
                    className="ml-1 text-blue-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectionError && <p className="text-sm text-red-400 mt-2">{selectionError}</p>}
          {liveError && <p className="text-sm text-red-400 mt-2">{liveError}</p>}
          <p className="text-[11px] text-zinc-400 mt-2">
            Live mode: {connected ? 'connected' : 'connecting...'}
          </p>
          {isSupported && (
            <button
              type="button"
              onClick={toggleTts}
              className={`mt-3 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                ttsEnabled
                  ? 'bg-emerald-700/30 text-emerald-300 border border-emerald-600/60 hover:bg-emerald-700/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-600 hover:bg-zinc-700'
              }`}
            >
              {ttsEnabled ? '🔊 Auto Voice On' : '🔇 Auto Voice Off'}
            </button>
          )}
        </Card>

        {/* Chat Area */}
        <Card className="flex flex-col border-zinc-700 bg-zinc-900 h-96 md:h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={msg.id ?? idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold camelcase tracking-wide text-blue-400">
                      🤖 FinAI
                    </span>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    {msg.role === 'assistant' && isSupported && (
                      <button
                        onClick={() => {
                          if (speakingIndex === idx) {
                            stop();
                            setSpeakingIndex(null);
                          } else {
                            speak(msg.content);
                            setSpeakingIndex(idx);
                          }
                        }}
                        className="mt-2 text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition"
                      >
                        {speakingIndex === idx && isSpeaking ? '⏸ Pause' : '🔊 Read'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <Spinner />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-700 p-4 bg-zinc-950">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about any stock (e.g., Analyze TSLA today)"
                disabled={loading || !connected}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                      setTimeout(() => {
                        const latest = transcriptRef.current.trim();
                        if (latest) {
                          setInput(latest);
                          resetTranscript();
                        }
                      }, 120);
                    } else {
                      // Barge-in: stop current assistant stream as soon as user starts speaking.
                      interrupt();
                      stop();
                      resetTranscript();
                      startListening();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isListening
                      ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                      : 'bg-zinc-700 text-white hover:bg-zinc-600'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                  disabled={!connected}
                >
                  {isListening ? '⏹️ Stop' : '🎤'}
                </button>
              )}
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim() || !connected}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>
          </div>
        </Card>

        {/* Example Prompts */}
        {messages.length === 1 && (
          <div className="mt-6">
            <p className="text-sm text-zinc-400 mb-3">Example questions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'Analyze AAPL trend and risk today',
                'Is NVDA overvalued right now?',
                'Give me technical and news view on TSLA',
                'What should I watch for in MSFT this week?',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt);
                  }}
                  className="text-left p-3 rounded-lg border border-zinc-600 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 text-sm transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

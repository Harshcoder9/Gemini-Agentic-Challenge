'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { searchStocks, getTickerForCompany } from '@/lib/stocks';

// ─── Autocomplete Dropdown ────────────────────────────────────────────────────

function AutocompleteDropdown({
  suggestions,
  isOpen,
  onSelect,
  inputRef,
}: {
  suggestions: Array<{ ticker: string; exchange: 'NSE' | 'BSE' | 'US'; name: string }>;
  isOpen: boolean;
  onSelect: (ticker: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  if (!isOpen || suggestions.length === 0) return null;

  const getExchangeBadgeColor = (exchange: string) => {
    if (exchange === 'NSE')
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    if (exchange === 'BSE')
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="space-y-1 p-2">
        {suggestions.map(({ ticker, name, exchange }) => (
          <button
            key={`${ticker}-${exchange}-${name}`}
            onClick={() => {
              onSelect(ticker);
              if (inputRef.current) inputRef.current.blur();
            }}
            className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{ticker}</span>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getExchangeBadgeColor(exchange)}`}
            >
              {exchange}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Exchange Picker ───────────────────────────────────────────────────────────

function ExchangePicker({
  base,
  onSelect,
  onDismiss,
}: {
  base: string;
  onSelect: (ticker: string) => void;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={ref}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Select Exchange for
        </p>
        <p className="mb-5 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{base}</p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => onSelect(`${base}.NS`)}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                NSE · National Stock Exchange
              </p>
              <p className="text-xs text-zinc-400">{base}.NS · India</p>
            </div>
            <span className="ml-3 shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Recommended
            </span>
          </button>

          <button
            onClick={() => onSelect(`${base}.BO`)}
            className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-violet-400 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                BSE · Bombay Stock Exchange
              </p>
              <p className="text-xs text-zinc-400">{base}.BO · India</p>
            </div>
          </button>

          <button
            onClick={() => onSelect(base)}
            className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">US Market</p>
              <p className="text-xs text-zinc-400">{base} · NYSE / NASDAQ</p>
            </div>
          </button>
        </div>

        <button
          onClick={onDismiss}
          className="mt-4 w-full rounded-lg py-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const RECENT_KEY = 'finagent_recent';

export function StockSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [picker, setPicker] = useState<{ base: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
      setRecent(Array.isArray(stored) ? stored.slice(0, 5) : []);
    } catch {
      // ignore parse errors
    }
  }, []);

  // Get autocomplete suggestions
  const suggestions = query.trim().length > 0 ? searchStocks(query.trim()) : [];

  const navigate = (ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setQuery('');
    setDropdownOpen(false);
    try {
      const updated = [t, ...recent.filter(r => r !== t)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecent(updated);
    } catch {
      // ignore storage errors
    }
    router.push(`/stock/${encodeURIComponent(t)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Try direct lookup in database first
    const foundTicker = getTickerForCompany(trimmed);
    if (foundTicker) {
      navigate(foundTicker);
      return;
    }

    // Fallback to exchange picker for ambiguous entries
    if (!trimmed.includes('.') && trimmed.length < 5) {
      setPicker({ base: trimmed.toUpperCase() });
    } else {
      navigate(trimmed);
    }
  };

  return (
    <>
      <div className="w-full">
        <form onSubmit={handleSubmit} className="relative flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => {
              // Close dropdown after a small delay to allow click on suggestion
              setTimeout(() => setDropdownOpen(false), 200);
            }}
            placeholder="Search by company name or ticker... (e.g., Apple, Infosys, Google)"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Analyze
          </button>

          {/* Autocomplete dropdown */}
          <AutocompleteDropdown
            suggestions={suggestions}
            isOpen={dropdownOpen}
            onSelect={navigate}
            inputRef={inputRef}
          />
        </form>

        {/* Recent searches */}
        {mounted && recent.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Recent
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.map(t => (
                <button
                  key={t}
                  onClick={() => navigate(t)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {picker && (
        <ExchangePicker
          base={picker.base}
          onSelect={ticker => {
            navigate(ticker);
            setPicker(null);
          }}
          onDismiss={() => setPicker(null)}
        />
      )}
    </>
  );
}

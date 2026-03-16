import axios, { AxiosError } from 'axios';
import type {
  StockData,
  TechnicalIndicators,
  AIAnalysis,
  NewsAnalysis,
  PortfolioHolding,
  PortfolioAnalysis,
  ChatMessage,
  ChartAnalysis,
  MarketIndex,
} from '@/lib/types';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase ID token to every request when the user is signed in
api.interceptors.request.use(async config => {
  try {
    // Lazy-import to avoid SSR issues with Firebase
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Not authenticated – continue without token
  }
  return config;
});

// ─── Error Normaliser ─────────────────────────────────────────────────────────

export class APIClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIClientError';
    this.status = status;
  }
}

function normaliseError(err: unknown): never {
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const detail =
      (err.response?.data as { detail?: string })?.detail ?? err.message ?? 'Unknown error';
    throw new APIClientError(detail, status);
  }
  throw err;
}

// ─── Stock Overview + History ─────────────────────────────────────────────────

export async function getStockData(ticker: string, period: string = '6mo'): Promise<StockData> {
  try {
    const { data } = await api.get<StockData>(
      `/api/stock/${encodeURIComponent(ticker.toUpperCase())}`,
      { params: { period } }
    );
    return data;
  } catch (err) {
    normaliseError(err);
  }
}

export async function getMarketIndices(): Promise<MarketIndex[]> {
  const indices = [
    { label: 'S&P 500' as const, symbol: '^GSPC' },
    { label: 'NASDAQ' as const, symbol: '^IXIC' },
    { label: 'DOW' as const, symbol: '^DJI' },
    { label: 'VIX' as const, symbol: '^VIX' },
    { label: 'SENSEX' as const, symbol: '^BSESN' },
  ];

  try {
    const settled = await Promise.allSettled(
      indices.map(async idx => {
        const quote = await getStockData(idx.symbol, '5d');
        return {
          label: idx.label,
          symbol: idx.symbol,
          value: quote.currentPrice,
          changePercent: quote.priceChangePercent,
        };
      })
    );

    const success = settled
      .filter((r): r is PromiseFulfilledResult<MarketIndex> => r.status === 'fulfilled')
      .map(r => r.value);

    if (success.length === 0) {
      throw new Error('No market indices available right now.');
    }

    return indices
      .map(idx => success.find(s => s.symbol === idx.symbol))
      .filter((v): v is MarketIndex => Boolean(v));
  } catch (err) {
    normaliseError(err);
  }
}

// ─── Technical Indicators ─────────────────────────────────────────────────────

export async function getIndicators(ticker: string): Promise<TechnicalIndicators> {
  try {
    const { data } = await api.get<TechnicalIndicators>(
      `/api/stock/${encodeURIComponent(ticker.toUpperCase())}/indicators`
    );
    return data;
  } catch (err) {
    normaliseError(err);
  }
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export async function getAIAnalysis(ticker: string): Promise<AIAnalysis> {
  try {
    const { data } = await api.get<AIAnalysis>(
      `/api/stock/${encodeURIComponent(ticker.toUpperCase())}/ai-analysis`,
      { timeout: 60000 } // Gemini reasoning can take up to ~50s
    );
    return data;
  } catch (err) {
    normaliseError(err);
  }
}

// ─── News & Sentiment ─────────────────────────────────────────────────────────

export async function getStockNews(ticker: string): Promise<NewsAnalysis> {
  try {
    const { data } = await api.get<NewsAnalysis>(
      `/api/stock/${encodeURIComponent(ticker.toUpperCase())}/news`
    );
    return data;
  } catch (err) {
    normaliseError(err);
  }
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function analyzePortfolio(holdings: PortfolioHolding[]): Promise<PortfolioAnalysis> {
  try {
    const { data } = await api.post<PortfolioAnalysis>('/api/portfolio/analyze', { holdings });
    return data;
  } catch (err) {
    normaliseError(err);
  }
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  ticker: string,
  message: string,
  history: ChatMessage[]
): Promise<string> {
  try {
    const { data } = await api.post<{ reply: string }>(
      `/api/stock/${encodeURIComponent(ticker.toUpperCase())}/chat`,
      { message, history }
    );
    return data.reply;
  } catch (err) {
    normaliseError(err);
  }
}

// ─── Chart Vision ─────────────────────────────────────────────────────────────

export async function analyzeChartImage(
  base64Image: string,
  mimeType: string
): Promise<ChartAnalysis> {
  try {
    const { data } = await api.post<ChartAnalysis>(
      '/api/chart/analyze',
      {
        image: base64Image,
        mime_type: mimeType,
      },
      { timeout: 60000 }
    );
    return data;
  } catch (err) {
    normaliseError(err);
  }
}

export default api;

// ─── Stock Overview ──────────────────────────────────────────────────────────

export interface StockOverview {
  ticker: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  peRatio: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
  sector: string | null;
  industry: string | null;
  currency: string;
}

// ─── Historical Data ─────────────────────────────────────────────────────────

export interface HistoricalDataPoint {
  date: string; // ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData extends StockOverview {
  history: HistoricalDataPoint[];
}

// ─── Market Summary ──────────────────────────────────────────────────────────

export interface MarketIndex {
  label: 'S&P 500' | 'NASDAQ' | 'DOW' | 'VIX' | 'SENSEX';
  symbol: string;
  value: number;
  changePercent: number;
}

// ─── Technical Indicators ────────────────────────────────────────────────────

export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: MACDData;
  sma50: number;
  sma200: number;
  bollingerBands: BollingerBands;
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export type TrendLabel = 'bullish' | 'bearish' | 'neutral';
export type RecommendationLabel = 'buy' | 'hold' | 'sell';
export type HealthLabel = 'excellent' | 'good' | 'fair' | 'poor';

export interface AIAnalysis {
  trend: TrendLabel;
  technicalSummary: string;
  riskFactors: string[];
  recommendation: RecommendationLabel;
  confidenceScore: number; // 0–100
  reasoning: string;
}

// ─── News & Sentiment ────────────────────────────────────────────────────────

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface NewsAnalysis {
  articles: NewsArticle[];
  sentimentScore: number; // -1.0 to 1.0
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  keyThemes: string[];
  oneLinerSummary: string;
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Chart Vision Analysis ────────────────────────────────────────────────────

export type SignalLabel = 'bullish' | 'bearish' | 'neutral';

export interface ChartAnalysis {
  patterns: string[]; // e.g. ["Head & Shoulders", "Death Cross"]
  signal: SignalLabel;
  summary: string;
  supportLevel: string | null;
  resistanceLevel: string | null;
  recommendation: string;
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface PortfolioHolding {
  ticker: string;
  quantity: number;
}

export interface PortfolioHoldingDetail extends PortfolioHolding {
  companyName: string;
  currentPrice: number;
  totalValue: number;
  weightPct: number;
  sector: string | null;
  industry: string | null;
  originalPrice?: number;
  originalCurrency?: string;
  fxRateToUSD?: number;
}

export interface PortfolioAnalysis {
  holdings: PortfolioHoldingDetail[];
  totalValue: number;
  diversificationScore: number; // 0–100
  sectorConcentration: Record<string, number>; // sector → weight %
  topRisks: string[];
  suggestions: string[];
  overallHealthLabel: HealthLabel;
  unresolvedTickers?: string[];
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface APIError {
  detail: string;
  status: number;
}

// Comprehensive stock lookup: company name (lowercase) → { ticker, exchange, name }
export const STOCK_DATABASE: Record<
  string,
  { ticker: string; exchange: "NSE" | "BSE" | "US"; name: string }
> = {
  // ─── US Stocks (top 30) ─────────────────────────────────────────────────
  apple: { ticker: "AAPL", exchange: "US", name: "Apple Inc." },
  microsoft: { ticker: "MSFT", exchange: "US", name: "Microsoft Corporation" },
  google: { ticker: "GOOGL", exchange: "US", name: "Alphabet Inc." },
  alphabet: { ticker: "GOOGL", exchange: "US", name: "Alphabet Inc." },
  amazon: { ticker: "AMZN", exchange: "US", name: "Amazon.com Inc." },
  tesla: { ticker: "TSLA", exchange: "US", name: "Tesla Inc." },
  nvidia: { ticker: "NVDA", exchange: "US", name: "NVIDIA Corporation" },
  meta: { ticker: "META", exchange: "US", name: "Meta Platforms Inc." },
  facebook: { ticker: "META", exchange: "US", name: "Meta Platforms Inc." },
  berkshire: { ticker: "BRK.B", exchange: "US", name: "Berkshire Hathaway Inc." },
  brk: { ticker: "BRK.B", exchange: "US", name: "Berkshire Hathaway Inc." },
  "goldman sachs": {
    ticker: "GS",
    exchange: "US",
    name: "Goldman Sachs Group Inc.",
  },
  jpmorgan: { ticker: "JPM", exchange: "US", name: "JPMorgan Chase & Co." },
  jpm: { ticker: "JPM", exchange: "US", name: "JPMorgan Chase & Co." },
  "bank of america": { ticker: "BAC", exchange: "US", name: "Bank of America Corp." },
  coca: { ticker: "KO", exchange: "US", name: "The Coca-Cola Company" },
  "coca-cola": { ticker: "KO", exchange: "US", name: "The Coca-Cola Company" },
  pepsi: { ticker: "PEP", exchange: "US", name: "PepsiCo Inc." },
  disney: { ticker: "DIS", exchange: "US", name: "The Walt Disney Company" },
  netflix: { ticker: "NFLX", exchange: "US", name: "Netflix Inc." },
  spotify: { ticker: "SPOT", exchange: "US", name: "Spotify Technology S.A." },
  "spotify technology": {
    ticker: "SPOT",
    exchange: "US",
    name: "Spotify Technology S.A.",
  },
  uber: { ticker: "UBER", exchange: "US", name: "Uber Technologies Inc." },
  airbnb: { ticker: "ABNB", exchange: "US", name: "Airbnb Inc." },
  snap: { ticker: "SNAP", exchange: "US", name: "Snap Inc." },
  pinterest: { ticker: "PINS", exchange: "US", name: "Pinterest Inc." },
  twilio: { ticker: "TWLO", exchange: "US", name: "Twilio Inc." },
  okta: { ticker: "OKTA", exchange: "US", name: "Okta Inc." },
  zoom: { ticker: "ZM", exchange: "US", name: "Zoom Video Communications Inc." },
  slack: { ticker: "SMPL", exchange: "US", name: "Slack Technologies Inc." },
  adobe: { ticker: "ADBE", exchange: "US", name: "Adobe Inc." },
  salesforce: { ticker: "CRM", exchange: "US", name: "Salesforce Inc." },

  // ─── Indian Stocks (NSE + BSE) – Top 50 ──────────────────────────────────
  reliance: { ticker: "RELIANCE.NS", exchange: "NSE", name: "Reliance Industries" },
  "reliance industries":
    { ticker: "RELIANCE.NS", exchange: "NSE", name: "Reliance Industries" },
  tcs: { ticker: "TCS.NS", exchange: "NSE", name: "Tata Consultancy Services" },
  "tata consultancy": {
    ticker: "TCS.NS",
    exchange: "NSE",
    name: "Tata Consultancy Services",
  },
  "tata consultancy services":
    { ticker: "TCS.NS", exchange: "NSE", name: "Tata Consultancy Services" },
  infosys: { ticker: "INFY.NS", exchange: "NSE", name: "Infosys Limited" },
  infy: { ticker: "INFY.NS", exchange: "NSE", name: "Infosys Limited" },
  wipro: { ticker: "WIPRO.NS", exchange: "NSE", name: "Wipro Limited" },
  hdfc: { ticker: "HDFCBANK.NS", exchange: "NSE", name: "HDFC Bank Limited" },
  "hdfc bank": { ticker: "HDFCBANK.NS", exchange: "NSE", name: "HDFC Bank Limited" },
  icici: { ticker: "ICICIBANK.NS", exchange: "NSE", name: "ICICI Bank Limited" },
  "icici bank": { ticker: "ICICIBANK.NS", exchange: "NSE", name: "ICICI Bank Limited" },
  sbi: { ticker: "SBIN.NS", exchange: "NSE", name: "State Bank of India" },
  "state bank": { ticker: "SBIN.NS", exchange: "NSE", name: "State Bank of India" },
  "state bank of india":
    { ticker: "SBIN.NS", exchange: "NSE", name: "State Bank of India" },
  tatamotors: { ticker: "TATAMOTORS.NS", exchange: "NSE", name: "Tata Motors Limited" },
  "tata motors": { ticker: "TATAMOTORS.NS", exchange: "NSE", name: "Tata Motors Limited" },
  paytm: { ticker: "PAYTM.NS", exchange: "NSE", name: "Paytm" },
  "one97 communications":
    { ticker: "PAYTM.NS", exchange: "NSE", name: "Paytm" },
  nykaa: { ticker: "NYKAA.NS", exchange: "NSE", name: "Nykaa E-Retail Limited" },
  swiggy: { ticker: "SWIGGY.NS", exchange: "NSE", name: "Swiggy Limited" },
  zomato: { ticker: "ZOMATO.NS", exchange: "NSE", name: "Zomato Limited" },
  ola: { ticker: "OLAELEC.NS", exchange: "NSE", name: "Ola Electric Mobility" },
  "ola electric": { ticker: "OLAELEC.NS", exchange: "NSE", name: "Ola Electric Mobility" },
  bajaj: { ticker: "BAJFINANCE.NS", exchange: "NSE", name: "Bajaj Finance Limited" },
  "bajaj finance": {
    ticker: "BAJFINANCE.NS",
    exchange: "NSE",
    name: "Bajaj Finance Limited",
  },
  kotak: { ticker: "KOTAKBANK.NS", exchange: "NSE", name: "Kotak Mahindra Bank" },
  "kotak bank": { ticker: "KOTAKBANK.NS", exchange: "NSE", name: "Kotak Mahindra Bank" },
  "kotak mahindra": {
    ticker: "KOTAKBANK.NS",
    exchange: "NSE",
    name: "Kotak Mahindra Bank",
  },
  airtel: { ticker: "BHARTIARTL.NS", exchange: "NSE", name: "Bharti Airtel Limited" },
  "bharti airtel": {
    ticker: "BHARTIARTL.NS",
    exchange: "NSE",
    name: "Bharti Airtel Limited",
  },
  adani: { ticker: "ADANIENT.NS", exchange: "NSE", name: "Adani Enterprises Limited" },
  "adani enterprises":
    { ticker: "ADANIENT.NS", exchange: "NSE", name: "Adani Enterprises Limited" },
  ongc: { ticker: "ONGC.NS", exchange: "NSE", name: "Oil and Natural Gas Corporation" },
  "oil and natural gas":
    { ticker: "ONGC.NS", exchange: "NSE", name: "Oil and Natural Gas Corporation" },
  ntpc: { ticker: "NTPC.NS", exchange: "NSE", name: "NTPC Limited" },
  hcl: { ticker: "HCLTECH.NS", exchange: "NSE", name: "HCL Technologies Limited" },
  "hcl technologies":
    { ticker: "HCLTECH.NS", exchange: "NSE", name: "HCL Technologies Limited" },
  ltim: { ticker: "LTIM.NS", exchange: "NSE", name: "LTIMindtree Limited" },
  "ltimindtree": { ticker: "LTIM.NS", exchange: "NSE", name: "LTIMindtree Limited" },
  sunpharma: { ticker: "SUNPHARMA.NS", exchange: "NSE", name: "Sun Pharmaceutical" },
  "sun pharma": { ticker: "SUNPHARMA.NS", exchange: "NSE", name: "Sun Pharmaceutical" },
  "sun pharmaceutical":
    { ticker: "SUNPHARMA.NS", exchange: "NSE", name: "Sun Pharmaceutical" },
  asianpaint: { ticker: "ASIANPAINT.NS", exchange: "NSE", name: "Asian Paints Limited" },
  "asian paints": { ticker: "ASIANPAINT.NS", exchange: "NSE", name: "Asian Paints Limited" },
  nestleindia: { ticker: "NESTLEIND.NS", exchange: "NSE", name: "Nestlé India Limited" },
  nestle: { ticker: "NESTLEIND.NS", exchange: "NSE", name: "Nestlé India Limited" },
  "nestle india": { ticker: "NESTLEIND.NS", exchange: "NSE", name: "Nestlé India Limited" },
  irctc: { ticker: "IRCTC.NS", exchange: "NSE", name: "Indian Railway Catering and Tourism Corporation" },
};

export function searchStocks(query: string): typeof STOCK_DATABASE extends Record<
  string,
  infer T
>
  ? T[]
  : never {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];

  // Exact match first
  if (STOCK_DATABASE[lower]) {
    return [STOCK_DATABASE[lower]];
  }

  // Prefix match (substring match)
  const matches = Object.entries(STOCK_DATABASE)
    .filter(([key]) => key.includes(lower))
    .map(([, value]) => value)
    .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical

  const unique: typeof matches = [];
  const seen = new Set<string>();
  for (const item of matches) {
    const k = `${item.ticker}|${item.exchange}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(item);
  }

  return unique;
}

export function getTickerForCompany(companyNameOrTicker: string): string | null {
  const lower = companyNameOrTicker.toLowerCase().trim();
  const entry = STOCK_DATABASE[lower];
  if (entry) {
    return entry.ticker;
  }
  // If it looks like a ticker already (has . or is 4 chars), return as-is
  if (companyNameOrTicker.includes(".") || companyNameOrTicker.length >= 4) {
    return companyNameOrTicker.toUpperCase();
  }
  return null;
}

from __future__ import annotations

import yfinance as yf
from fastapi import HTTPException

from app.services.gemini_service import analyze_portfolio_ai


def _normalize_symbol(raw: str) -> str:
    return str(raw or "").strip().upper()


def _extract_price(info: dict) -> float:
    return float(
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or info.get("previousClose")
        or 0.0
    )


def _candidate_symbols(raw_ticker: str) -> list[str]:
    base = _normalize_symbol(raw_ticker)
    candidates: list[str] = []
    if base:
        candidates.append(base)

    # Common India market suffix fallback for plain symbols like RELIANCE.
    if base and "." not in base and " " not in base:
        candidates.extend([f"{base}.NS", f"{base}.BO"])

    return candidates


def _search_symbol(raw_ticker: str) -> str | None:
    query = str(raw_ticker or "").strip()
    if not query:
        return None
    try:
        search = yf.Search(query, max_results=5)
        for quote in search.quotes or []:
            symbol = _normalize_symbol(quote.get("symbol"))
            if symbol:
                return symbol
    except Exception:
        return None
    return None


def _resolve_quote(raw_ticker: str) -> tuple[str, float, dict]:
    base = _normalize_symbol(raw_ticker)

    tried: set[str] = set()
    for candidate in _candidate_symbols(raw_ticker):
        if candidate in tried:
            continue
        tried.add(candidate)
        try:
            ticker = yf.Ticker(candidate)
            info = ticker.info or {}
            price = _extract_price(info)
            if not price:
                fast_info = getattr(ticker, "fast_info", None)
                if fast_info and getattr(fast_info, "last_price", None):
                    price = float(fast_info.last_price)
            if not price:
                hist = ticker.history(period="5d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
            if price:
                return candidate, price, info
        except Exception:
            continue

    # If user entered company name (e.g. NVIDIA), attempt symbol discovery once.
    discovered = _search_symbol(raw_ticker)
    if discovered and discovered not in tried:
        try:
            ticker = yf.Ticker(discovered)
            info = ticker.info or {}
            price = _extract_price(info)
            if not price:
                fast_info = getattr(ticker, "fast_info", None)
                if fast_info and getattr(fast_info, "last_price", None):
                    price = float(fast_info.last_price)
            if not price:
                hist = ticker.history(period="5d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
            if price:
                return discovered, price, info
        except Exception:
            pass

    return base, 0.0, {}


def _get_usd_inr_rate() -> float:
    """Return INR per USD (e.g. ~83)."""
    pair = yf.Ticker("USDINR=X")
    try:
        info = pair.info or {}
        rate = float(
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
            or 0.0
        )
        if rate > 0:
            return rate
    except Exception:
        pass

    try:
        fast_info = getattr(pair, "fast_info", None)
        rate = float(getattr(fast_info, "last_price", 0.0) or 0.0)
        if rate > 0:
            return rate
    except Exception:
        pass

    try:
        hist = pair.history(period="5d")
        if not hist.empty:
            rate = float(hist["Close"].iloc[-1])
            if rate > 0:
                return rate
    except Exception:
        pass

    # Conservative fallback to avoid hard failures if FX quote is unavailable.
    return 83.0


def build_portfolio_snapshot(holdings: list[dict]) -> dict:
    """Fetch live prices for each holding and compute portfolio snapshot data."""
    holding_details = []
    total_value = 0.0
    usd_inr_rate = _get_usd_inr_rate()

    unresolved: list[str] = []

    for h in holdings:
        raw_symbol = h["ticker"]
        qty = h["quantity"]

        resolved_symbol, price, info = _resolve_quote(raw_symbol)
        if not price:
            unresolved.append(_normalize_symbol(raw_symbol) or str(raw_symbol))

        original_currency = str(info.get("currency") or "USD").upper()
        price_usd = float(price)
        if original_currency == "INR":
            price_usd = float(price) / usd_inr_rate

        value = float(price_usd) * float(qty)
        total_value += value

        holding_details.append(
            {
                "ticker":       resolved_symbol,
                "quantity":     qty,
                "companyName":  info.get("longName") or info.get("shortName") or resolved_symbol,
                "currentPrice": round(float(price_usd), 4),
                "totalValue":   round(value, 2),
                "weightPct":    0.0,  # filled below
                "sector":       info.get("sector"),
                "industry":     info.get("industry"),
                "originalPrice": round(float(price), 4),
                "originalCurrency": original_currency,
                "fxRateToUSD": round(1 / usd_inr_rate, 6) if original_currency == "INR" else 1.0,
            }
        )

    if total_value == 0:
        raise HTTPException(
            status_code=422, detail="Could not fetch prices for any holding.")

    # Calculate weights and sector concentration
    sector_concentration: dict[str, float] = {}
    for h in holding_details:
        h["weightPct"] = round(h["totalValue"] / total_value * 100, 2)
        sector = h.get("sector") or "Unknown"
        sector_concentration[sector] = sector_concentration.get(
            sector, 0) + h["weightPct"]

    return {
        "holdings": holding_details,
        "totalValue": round(total_value, 2),
        "sectorConcentration": sector_concentration,
        "unresolvedTickers": unresolved,
    }


async def analyze_portfolio(holdings: list[dict]) -> dict:
    """Fetch live prices for each holding and run ADK-backed portfolio analysis."""
    snapshot = build_portfolio_snapshot(holdings)

    # AI analysis
    ai = await analyze_portfolio_ai(
        snapshot["holdings"],
        snapshot["totalValue"],
        snapshot["sectorConcentration"],
    )

    return {
        "holdings":            snapshot["holdings"],
        "totalValue":          snapshot["totalValue"],
        "diversificationScore": ai.get("diversificationScore", 50),
        "sectorConcentration": snapshot["sectorConcentration"],
        "topRisks":            ai.get("topRisks", []),
        "suggestions":         ai.get("suggestions", []),
        "overallHealthLabel":  ai.get("overallHealthLabel", "fair"),
        "unresolvedTickers":   snapshot.get("unresolvedTickers", []),
    }

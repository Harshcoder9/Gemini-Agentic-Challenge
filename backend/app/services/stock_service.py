from __future__ import annotations

import yfinance as yf
from fastapi import HTTPException


def _ticker(symbol: str) -> yf.Ticker:
    return yf.Ticker(symbol)


def get_stock_data(symbol: str, period: str = "6mo") -> dict:
    """Return overview + OHLCV history."""
    t = _ticker(symbol)
    try:
        info = t.info
    except Exception:
        info = {}

    # yfinance returns an empty / minimal dict for unknown symbols
    price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
    if not price:
        try:
            price = float(t.fast_info.last_price or 0)
        except Exception:
            price = 0
    if not price:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch '{symbol}'. Yahoo Finance may be rate-limiting. Try again shortly.",
        )

    prev  = info.get("previousClose", price)

    try:
        hist = t.history(period=period)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Failed to fetch history for '{symbol}': {exc}") from exc
    if hist.empty:
        raise HTTPException(status_code=503, detail=f"No price history for '{symbol}'. Please try again.")

    history = []
    for record in hist.reset_index().to_dict(orient="records"):
        date_value = record.get("Date") or record.get("Datetime") or record.get("index")
        if date_value is None:
            date_text = ""
        elif hasattr(date_value, "date"):
            date_text = str(date_value.date())
        else:
            date_text = str(date_value)
        history.append(
            {
                "date": date_text,
                "open": round(float(record.get("Open") or 0), 4),
                "high": round(float(record.get("High") or 0), 4),
                "low": round(float(record.get("Low") or 0), 4),
                "close": round(float(record.get("Close") or 0), 4),
                "volume": int(record.get("Volume") or 0),
            }
        )

    return {
        "ticker":              symbol,
        "companyName":         info.get("longName") or info.get("shortName") or symbol,
        "currentPrice":        round(price, 4),
        "previousClose":       round(prev, 4),
        "priceChange":         round(price - prev, 4),
        "priceChangePercent":  round((price - prev) / prev * 100 if prev else 0, 2),
        "marketCap":           info.get("marketCap", 0),
        "peRatio":             info.get("trailingPE") or info.get("forwardPE"),
        "fiftyTwoWeekHigh":    info.get("fiftyTwoWeekHigh", 0),
        "fiftyTwoWeekLow":     info.get("fiftyTwoWeekLow", 0),
        "volume":              info.get("volume", 0),
        "avgVolume":           info.get("averageVolume", 0),
        "sector":              info.get("sector"),
        "industry":            info.get("industry"),
        "currency":            info.get("currency", "USD"),
        "history":             history,
    }

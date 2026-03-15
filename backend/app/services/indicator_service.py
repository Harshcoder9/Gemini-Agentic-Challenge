from __future__ import annotations

import yfinance as yf
from fastapi import HTTPException
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from ta.volatility import BollingerBands


def get_indicators(symbol: str) -> dict:
    t = yf.Ticker(symbol)
    try:
        hist = t.history(period="1y")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Failed to fetch data: {exc}") from exc

    if hist.empty:
        raise HTTPException(status_code=503, detail="Yahoo Finance returned no data. Please try again in a moment.")

    if len(hist) < 50:
        raise HTTPException(status_code=422, detail="Not enough historical data to compute indicators.")

    close = hist["Close"]

    # ── RSI ──
    rsi_series = RSIIndicator(close=close, window=14).rsi()
    rsi = round(float(rsi_series.iloc[-1]), 2)

    # ── MACD ──
    macd_obj = MACD(close=close)
    macd_val  = round(float(macd_obj.macd().iloc[-1]), 4)
    signal_val = round(float(macd_obj.macd_signal().iloc[-1]), 4)
    hist_val   = round(float(macd_obj.macd_diff().iloc[-1]), 4)

    # ── SMAs ──
    sma50  = round(float(SMAIndicator(close=close, window=50).sma_indicator().iloc[-1]), 4)
    sma200 = round(float(SMAIndicator(close=close, window=200).sma_indicator().iloc[-1]), 4) if len(close) >= 200 else sma50

    # ── Bollinger Bands ──
    bb = BollingerBands(close=close, window=20, window_dev=2)
    bb_upper  = round(float(bb.bollinger_hband().iloc[-1]), 4)
    bb_middle = round(float(bb.bollinger_mavg().iloc[-1]), 4)
    bb_lower  = round(float(bb.bollinger_lband().iloc[-1]), 4)

    # ── Support / Resistance (rolling min/max over last 60 days) ──
    window = hist.tail(60)
    support    = round(float(window["Low"].min()), 4)
    resistance = round(float(window["High"].max()), 4)

    # ── Trend ──
    current_price = float(close.iloc[-1])
    if current_price > sma50 > sma200:
        trend = "bullish"
    elif current_price < sma50 < sma200:
        trend = "bearish"
    else:
        trend = "neutral"

    return {
        "rsi": rsi,
        "macd": {"macd": macd_val, "signal": signal_val, "histogram": hist_val},
        "sma50": sma50,
        "sma200": sma200,
        "bollingerBands": {"upper": bb_upper, "middle": bb_middle, "lower": bb_lower},
        "support": support,
        "resistance": resistance,
        "trend": trend,
    }

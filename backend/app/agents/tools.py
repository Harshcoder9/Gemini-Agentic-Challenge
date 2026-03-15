from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
import logging

import yfinance as yf
from fastapi import HTTPException

from app.config import settings
from app.services.indicator_service import get_indicators
from app.services.stock_service import get_stock_data

logger = logging.getLogger(__name__)


def _fetch_recent_articles(symbol: str) -> list[dict]:
    """Fetch articles from NewsAPI with fallback to yfinance if it fails."""
    # Try NewsAPI first
    if settings.news_api_key:
        try:
            from newsapi import NewsApiClient
            client = NewsApiClient(api_key=settings.news_api_key)
            from_date = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
            response = client.get_everything(
                q=symbol,
                language="en",
                sort_by="publishedAt",
                page_size=15,
                from_param=from_date,
            )
            if response.get("status") == "ok":
                articles = response.get("articles", [])
                if articles:
                    return articles
        except Exception as exc:
            logger.warning("NewsAPI unavailable (%s) — falling back to yfinance", exc)
    
    # Fallback to yfinance news
    try:
        ticker = yf.Ticker(symbol)
        raw = ticker.news or []
        articles = []
        for item in raw[:15]:
            content = item.get("content", {})
            title = content.get("title") or item.get("title", "")
            url = (content.get("canonicalUrl") or {}).get("url") or item.get("link", "")
            pub_date = content.get("pubDate") or item.get("providerPublishTime", "")
            if isinstance(pub_date, (int, float)):
                pub_date = datetime.fromtimestamp(pub_date, tz=timezone.utc).isoformat()
            provider = (content.get("provider") or {}).get("displayName") or item.get("publisher", "Unknown")
            if title:
                articles.append({
                    "title": title,
                    "description": content.get("summary") or item.get("summary"),
                    "url": url,
                    "publishedAt": pub_date,
                    "source": {"name": provider},
                })
        if articles:
            return articles
    except Exception as exc:
        logger.warning("yfinance news fetch failed: %s", exc)
    
    raise HTTPException(status_code=404, detail=f"No news found for '{symbol}.' Check if ticker is valid.")


def _build_portfolio_snapshot(holdings: list[dict]) -> dict:
    holding_details = []
    total_value = 0.0

    for holding in holdings:
        symbol = holding["ticker"].upper()
        quantity = holding["quantity"]

        try:
            info = yf.Ticker(symbol).info
            price = (
                info.get("currentPrice")
                or info.get("regularMarketPrice")
                or info.get("previousClose")
                or 0.0
            )
        except Exception:
            info = {}
            price = 0.0

        value = float(price) * float(quantity)
        total_value += value
        holding_details.append(
            {
                "ticker": symbol,
                "quantity": quantity,
                "companyName": info.get("longName") or info.get("shortName") or symbol,
                "currentPrice": round(float(price), 4),
                "totalValue": round(value, 2),
                "weightPct": 0.0,
                "sector": info.get("sector"),
                "industry": info.get("industry"),
            }
        )

    if total_value == 0:
        raise HTTPException(status_code=422, detail="Could not fetch prices for any holding.")

    sector_concentration: dict[str, float] = {}
    for item in holding_details:
        item["weightPct"] = round(item["totalValue"] / total_value * 100, 2)
        sector = item.get("sector") or "Unknown"
        sector_concentration[sector] = sector_concentration.get(sector, 0) + item["weightPct"]

    return {
        "holdings": holding_details,
        "totalValue": round(total_value, 2),
        "sectorConcentration": sector_concentration,
    }


def lookup_stock_overview(symbol: str, period: str = "1mo") -> dict:
    """Fetch overview and recent OHLCV history for a stock ticker.

    Args:
        symbol: Stock ticker symbol such as AAPL or MSFT.
        period: Yahoo Finance history period, for example 1mo or 6mo.
    """
    data = get_stock_data(symbol.upper(), period)
    return {"status": "success", "data": data}


def lookup_technical_indicators(symbol: str) -> dict:
    """Fetch technical indicators for a stock ticker.

    Args:
        symbol: Stock ticker symbol such as AAPL or NVDA.
    """
    data = get_indicators(symbol.upper())
    return {"status": "success", "data": data}


def lookup_recent_news(symbol: str) -> dict:
    """Fetch recent news headlines and article metadata for a stock ticker.

    Args:
        symbol: Stock ticker symbol such as AAPL or TSLA.
    """
    # _fetch_recent_articles has fallback to yfinance if NewsAPI fails
    articles = _fetch_recent_articles(symbol.upper())
    headlines = [article.get("title", "")
                 for article in articles if article.get("title")]
    return {
        "status": "success",
        "symbol": symbol.upper(),
        "headlines": headlines[:10],
        "articles": articles[:10],
    }


def load_portfolio_snapshot(holdings_json: str) -> dict:
    """Build a live portfolio snapshot from a JSON holdings list.

    Args:
        holdings_json: JSON array of holdings like [{"ticker":"AAPL","quantity":10}].
    """
    holdings = json.loads(holdings_json)
    snapshot = _build_portfolio_snapshot(holdings)
    return {"status": "success", **snapshot}

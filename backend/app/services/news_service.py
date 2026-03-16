from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import yfinance as yf
from fastapi import HTTPException

from app.config import settings
from app.services.gemini_service import analyze_news_sentiment

logger = logging.getLogger(__name__)


# ─── Source 1: NewsAPI ────────────────────────────────────────────────────────

def _fetch_from_newsapi(query: str) -> list[dict] | None:
    """Return raw NewsAPI articles or None if unavailable / key invalid."""
    if not settings.news_api_key:
        return None
    try:
        from newsapi import NewsApiClient
        client = NewsApiClient(api_key=settings.news_api_key)
        from_date = (datetime.now(timezone.utc) -
                     timedelta(days=7)).strftime("%Y-%m-%d")
        response = client.get_everything(
            q=query,
            language="en",
            sort_by="publishedAt",
            page_size=15,
            from_param=from_date,
        )
        if response.get("status") != "ok":
            logger.warning("NewsAPI returned non-ok status: %s",
                           response.get("code"))
            return None
        articles = response.get("articles", [])
        return articles if articles else None
    except Exception as exc:
        logger.warning(
            "NewsAPI unavailable (%s) — falling back to yfinance news.", exc)
        return None


# ─── Source 2: yfinance built-in news (no key, no rate limit) ────────────────

def _fetch_from_yfinance(symbol: str) -> list[dict] | None:
    """Return normalised articles from yfinance .news property."""
    try:
        ticker = yf.Ticker(symbol)
        raw = ticker.news or []
        articles = []
        for item in raw[:15]:
            content = item.get("content", {})
            # yfinance v0.2.40+ nested structure
            title = content.get("title") or item.get("title", "")
            url = (
                (content.get("canonicalUrl") or {}).get("url")
                or item.get("link", "")
            )
            pub_date = (
                content.get("pubDate")
                or item.get("providerPublishTime", "")
            )
            if isinstance(pub_date, (int, float)):
                pub_date = datetime.fromtimestamp(
                    pub_date, tz=timezone.utc).isoformat()
            provider = (
                (content.get("provider") or {}).get("displayName")
                or item.get("publisher", "Unknown")
            )
            if title:
                articles.append({
                    "title":       title,
                    "description": content.get("summary") or item.get("summary"),
                    "url":         url,
                    "publishedAt": pub_date,
                    "source":      {"name": provider},
                })
        return articles if articles else None
    except Exception as exc:
        logger.warning("yfinance news fetch failed: %s", exc)
        return None


# ─── Unified fetcher ──────────────────────────────────────────────────────────

def fetch_recent_articles(symbol: str) -> list[dict]:
    """Try NewsAPI first; fall back to yfinance; raise 404 only if both empty."""
    # Use company-friendly query for NewsAPI (strip .NS/.BO suffix)
    query = symbol.split(".")[0] if "." in symbol else symbol

    articles = _fetch_from_newsapi(query) or _fetch_from_yfinance(symbol)

    if not articles:
        raise HTTPException(
            status_code=404,
            detail=f"No recent news found for '{symbol}'. Both NewsAPI and yfinance returned no results.",
        )
    return articles


async def get_stock_news(symbol: str) -> dict:
    articles_raw = fetch_recent_articles(symbol)

    # Run Gemini sentiment analysis on the headlines
    headlines = [a["title"] for a in articles_raw if a.get("title")]

    # Per-article lightweight sentiment classification
    positive_words = {"surge", "soar", "gain", "jump", "rise",
                      "beat", "record", "buy", "up", "profit", "growth"}
    negative_words = {"drop", "fall", "miss", "layoff", "loss",
                      "decline", "crash", "sell", "cut", "down", "risk"}

    # Start with a local fallback so the endpoint still succeeds when Gemini is rate-limited.
    sentiment_result = {
        "sentimentScore": 0.0,
        "sentimentLabel": "neutral",
        "keyThemes": ["market update", "company news", "analyst commentary"],
        "oneLinerSummary": f"Recent {symbol} headlines are mixed.",
    }

    if headlines:
        try:
            # Use clean name (no .NS/.BO) for Gemini prompt
            clean_symbol = symbol.split(".")[0] if "." in symbol else symbol
            sentiment_result = await analyze_news_sentiment(clean_symbol, headlines)
        except Exception as exc:
            logger.warning(
                "Gemini sentiment unavailable for %s; using local fallback sentiment (%s)",
                symbol,
                exc,
            )

    articles = []
    total_pos = 0
    total_neg = 0
    for a in articles_raw[:10]:
        title = (a.get("title") or "").lower()
        pos = sum(1 for w in positive_words if w in title)
        neg = sum(1 for w in negative_words if w in title)
        total_pos += pos
        total_neg += neg
        sentiment = "positive" if pos > neg else "negative" if neg > pos else "neutral"
        articles.append(
            {
                "title":       a.get("title", ""),
                "description": a.get("description"),
                "url":         a.get("url", ""),
                "publishedAt": a.get("publishedAt", ""),
                "source":      (a.get("source") or {}).get("name", "Unknown"),
                "sentiment":   sentiment,
            }
        )

    # If Gemini was unavailable, derive a basic aggregate sentiment from headline keywords.
    if sentiment_result.get("oneLinerSummary") == f"Recent {symbol} headlines are mixed.":
        if total_pos > total_neg:
            sentiment_result["sentimentLabel"] = "positive"
            sentiment_result["sentimentScore"] = 0.35
            sentiment_result["oneLinerSummary"] = f"Recent {symbol} headlines skew modestly positive."
        elif total_neg > total_pos:
            sentiment_result["sentimentLabel"] = "negative"
            sentiment_result["sentimentScore"] = -0.35
            sentiment_result["oneLinerSummary"] = f"Recent {symbol} headlines skew modestly negative."

    return {
        "articles":       articles,
        "sentimentScore": sentiment_result["sentimentScore"],
        "sentimentLabel": sentiment_result["sentimentLabel"],
        "keyThemes":      sentiment_result["keyThemes"],
        "oneLinerSummary": sentiment_result["oneLinerSummary"],
    }

from __future__ import annotations

import base64
import json
import re

from google.genai import types as genai_types

from app.agents.fin_agent import (
    chart_analysis_agent,
    news_sentiment_agent,
    portfolio_analysis_agent,
    stock_analysis_agent,
    stock_chat_agent,
)
from app.agents.runner import run_agent_json, run_agent_text


_ADVICE_QUERY_RE = re.compile(
    r"\b(should\s+i\s+buy|should\s+i\s+sell|buy\s+now|sell\s+now|is\s+it\s+a\s+good\s+time|worth\s+buying|invest\s+in)\b",
    re.IGNORECASE,
)

_DISCLAIMER_TEXT = (
    "Disclaimer: I am an AI assistant, not a financial advisor. "
    "Please consult a licensed financial advisor before making investment decisions."
)


def _needs_investment_disclaimer(user_message: str, reply: str) -> bool:
    """Return True when advice-like queries should include a financial disclaimer."""
    if _ADVICE_QUERY_RE.search(user_message):
        return True

    # Add a secondary safety net when the assistant gives directive advice language.
    advisory_language_re = re.compile(
        r"\b(you should|i recommend|consider buying|consider selling|buy|sell|strong buy|strong sell)\b",
        re.IGNORECASE,
    )
    return bool(advisory_language_re.search(reply))


def _append_disclaimer(reply: str) -> str:
    """Append the standard disclaimer once, preserving existing assistant output."""
    lowered = reply.lower()
    if (
        _DISCLAIMER_TEXT.lower() in lowered
        or "not a financial advisor" in lowered
        or "consult" in lowered and "financial" in lowered and "advisor" in lowered
    ):
        return reply
    return f"{reply.rstrip()}\n\n{_DISCLAIMER_TEXT}"


def _json_from_text(text: str) -> dict:
    """Extract first JSON object from a Gemini response string."""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError(f"No JSON found in Gemini response: {text[:200]}")
    return json.loads(match.group())


# ── 1. Full Stock AI Analysis ──────────────────────────────────────────────────

async def analyze_stock(symbol: str, stock_ctx: dict, indicators: dict, headlines: list[str]) -> dict:
    prompt = f"""
You are a professional equity research analyst. Analyze {symbol} ({stock_ctx.get('companyName')})
based ONLY on the data provided below. Return ONLY a JSON object — do not call any tools.

Current Price: {stock_ctx.get('currentPrice')} {stock_ctx.get('currency')}
52-Week High/Low: {stock_ctx.get('fiftyTwoWeekHigh')} / {stock_ctx.get('fiftyTwoWeekLow')}
P/E Ratio: {stock_ctx.get('peRatio')}
Market Cap: {stock_ctx.get('marketCap')}
Sector: {stock_ctx.get('sector')} | Industry: {stock_ctx.get('industry')}

Technical Indicators:
- RSI(14): {indicators.get('rsi')}
- MACD: {indicators.get('macd')}
- SMA50: {indicators.get('sma50')} | SMA200: {indicators.get('sma200')}
- Bollinger Bands: {indicators.get('bollingerBands')}
- Trend: {indicators.get('trend')}
- Support: {indicators.get('support')} | Resistance: {indicators.get('resistance')}

Recent Headlines:
{chr(10).join(f'- {h}' for h in headlines[:8])}

Return JSON with exactly these keys:
{{
  "trend": "bullish" | "bearish" | "neutral",
  "technicalSummary": "<2-3 sentence technical overview>",
  "riskFactors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommendation": "buy" | "hold" | "sell",
  "confidenceScore": <integer 0-100>,
  "reasoning": "<3-5 sentence detailed reasoning>"
}}
"""
    return await run_agent_json(stock_analysis_agent, prompt)


# ── 2. News Sentiment Analysis ─────────────────────────────────────────────────

async def analyze_news_sentiment(symbol: str, headlines: list[str]) -> dict:
    prompt = f"""
Analyze the sentiment of these recent news headlines about {symbol}.
Headlines:
{chr(10).join(f'- {h}' for h in headlines)}

Return ONLY a JSON object:
{{
  "sentimentScore": <float from -1.0 (very negative) to 1.0 (very positive)>,
  "sentimentLabel": "positive" | "negative" | "neutral",
  "keyThemes": ["<theme 1>", "<theme 2>", "<theme 3>"],
  "oneLinerSummary": "<one sentence summary of overall news sentiment>"
}}
"""
    return await run_agent_json(news_sentiment_agent, prompt)


# ── 3. Multi-turn AI Chat ──────────────────────────────────────────────────────

async def chat_about_stock(symbol: str, user_message: str, history: list[dict], stock_ctx: dict) -> str:
    history_text = "\n".join(
        f"- {msg['role']}: {msg['content']}" for msg in history[-8:]) or "- No prior history"

    system_prompt = f"""You are FinAgent, an expert AI financial analyst assistant.
You are currently helping a user research {symbol} ({stock_ctx.get('companyName', symbol)}).

Current context:
- Price: {stock_ctx.get('currentPrice')} {stock_ctx.get('currency', 'USD')}
- Change: {stock_ctx.get('priceChangePercent', 0):+.2f}%
- Market Cap: {stock_ctx.get('marketCap', 'N/A')}
- P/E Ratio: {stock_ctx.get('peRatio', 'N/A')}
- Sector: {stock_ctx.get('sector', 'N/A')} / {stock_ctx.get('industry', 'N/A')}
- 52W High: {stock_ctx.get('fiftyTwoWeekHigh')} | 52W Low: {stock_ctx.get('fiftyTwoWeekLow')}

Conversation history:
{history_text}

Voice and behavior rules:
- Keep a consistent FinAgent voice: calm, practical, transparent, and helpful.
- Be concise but complete. Use short paragraphs and plain language.
- If you quote numbers for {symbol}, use the context above.
- If the user asks about a different stock or compares multiple stocks, use tools to fetch live data for those symbols before answering.
- If data for another symbol is unavailable, say so clearly and ask for the exact ticker.
- Never fabricate prices, ratios, returns, targets, or news.
- If asked for buy/sell/investment advice, provide educational, risk-aware guidance and include a disclaimer that you are not a financial advisor.
- Respond in readable paragraphs with no markdown headers.
"""
    prompt = f"{system_prompt}\n\nUser question: {user_message}"
    reply = await run_agent_text(stock_chat_agent, prompt)
    if _needs_investment_disclaimer(user_message, reply):
        reply = _append_disclaimer(reply)
    return reply


# ── 3.5. General Finance Chat (no specific stock) ───────────────────────────────

async def chat_general_finance(user_message: str, history: list[dict]) -> str:
    """General finance Q&A without specific stock context."""
    history_text = "\n".join(
        f"- {msg['role']}: {msg['content']}" for msg in history[-8:]) or "- No prior history"

    system_prompt = """You are FinAgent, an expert AI financial assistant.
You help users with general finance questions, investment principles, market insights, 
economic trends, and financial education.

Conversation history:
""" + history_text + """

Voice and behavior rules:
- Keep a consistent FinAgent voice: calm, practical, transparent, and helpful.
- Be concise but complete. Use short paragraphs and plain language.
- Discusss general finance topics: markets, sectors, economic indicators, investment strategies, risk management, etc.
- You are highly knowledgeable about stock chart patterns and technical analysis, including all possible chart indicators (RSI, MACD, Bollinger Bands, Moving Averages, etc.). If the user asks about indicators that can help them for more profit, clearly and comprehensively explain how to use these indicators.
- If the user mentions specific stocks/symbols, acknowledge them but explain you need live data to provide current analysis.
- If asked for buy/sell/investment advice, provide educational, risk-aware guidance and include a disclaimer.
- Never fabricate specific prices, market data, or news.
- Respond in readable paragraphs with no markdown headers.
"""
    prompt = f"{system_prompt}\n\nUser question: {user_message}"
    reply = await run_agent_text(stock_chat_agent, prompt)
    if _needs_investment_disclaimer(user_message, reply):
        reply = _append_disclaimer(reply)
    return reply


# ── 4. Chart Vision Analysis ───────────────────────────────────────────────────

async def analyze_chart_image(base64_image: str, mime_type: str) -> dict:
    prompt = """You are an expert technical analyst. Analyze this stock chart image carefully.
Identify chart patterns, support/resistance levels, and provide a trading assessment.

Return ONLY a JSON object with exactly these keys:
{
  "patterns": ["<pattern 1>", "<pattern 2>"],
  "signal": "bullish" | "bearish" | "neutral",
  "summary": "<3-4 sentence analysis of the chart>",
  "supportLevel": "<price level as string, e.g. '$145.20', or null if unclear>",
  "resistanceLevel": "<price level as string, e.g. '$162.00', or null if unclear>",
  "recommendation": "<2-3 sentence actionable trading recommendation based purely on the chart>"
}

For patterns, identify things like: Head & Shoulders, Double Top/Bottom, Bull/Bear Flag,
Cup and Handle, Triangle (ascending/descending/symmetrical), Death Cross, Golden Cross,
Wedge, Channel, etc. If no clear pattern, use ["No clear pattern"].
"""

    image_bytes = base64.b64decode(base64_image)
    return await run_agent_json(
        chart_analysis_agent,
        prompt,
        inline_parts=[genai_types.Part.from_bytes(
            data=image_bytes, mime_type=mime_type)],
    )


# ── 5. Portfolio AI Analysis ───────────────────────────────────────────────────

async def analyze_portfolio_ai(holdings_ctx: list[dict], total_value: float, sector_concentration: dict) -> dict:
    holdings_text = "\n".join(
        f"- {h['ticker']} ({h.get('companyName', '')}): {h.get('weightPct', 0):.1f}% | Sector: {h.get('sector', 'Unknown')}"
        for h in holdings_ctx
    )
    sectors_text = "\n".join(
        f"- {s}: {v:.1f}%" for s, v in sector_concentration.items())

    prompt = f"""
You are a portfolio risk analyst. Evaluate this portfolio:

Total Value: ${total_value:,.2f}
Holdings:
{holdings_text}

Sector Concentration:
{sectors_text}

Return ONLY a JSON object:
{{
  "diversificationScore": <integer 0-100>,
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "topRisks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "overallHealthLabel": "excellent" | "good" | "fair" | "poor"
}}
"""
    state = {
        "holdings_json": json.dumps(
            [{"ticker": h["ticker"], "quantity": h["quantity"]}
                for h in holdings_ctx]
        )
    }
    prompt = (
        f"{prompt}\n\nCall the portfolio snapshot tool using this holdings JSON: "
        f"{state['holdings_json']}"
    )
    return await run_agent_json(portfolio_analysis_agent, prompt, state=state)

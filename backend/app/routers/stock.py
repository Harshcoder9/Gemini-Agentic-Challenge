from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.stock_service import get_stock_data
from app.services.indicator_service import get_indicators
from app.services.news_service import get_stock_news
from app.services.gemini_service import analyze_stock, chat_about_stock
from app.models import ChatRequest
from app.agents.runner import run_agent_json
import time

# ─── Simple In-Memory Cache ───────────────────────────────────────────────────
_cache = {}
_CACHE_TTL = 3600  # 1 hour in seconds

# ─── Pydantic Models ──────────────────────────────────────────────────────────


class MultiStockChatRequest(BaseModel):
    symbols: list[str]
    message: str
    history: list[dict] = []


router = APIRouter()


@router.get("/{symbol}")
async def stock_overview(symbol: str, period: str = Query("6mo")) -> dict:
    return get_stock_data(symbol.upper(), period)


@router.get("/{symbol}/indicators")
async def technical_indicators(symbol: str) -> dict:
    return get_indicators(symbol.upper())


@router.get("/{symbol}/ai-analysis")
async def ai_analysis(symbol: str) -> dict:
    cache_key = f"ai_analysis_{symbol.upper()}"
    now = time.time()
    
    if cache_key in _cache:
        data, exp = _cache[cache_key]
        if now < exp:
            return data

    stock_ctx = get_stock_data(symbol.upper(), period="1mo")
    indicators = get_indicators(symbol.upper())
    news = await get_stock_news(symbol.upper())
    headlines = [a["title"] for a in news.get("articles", [])]
    result = await analyze_stock(symbol.upper(), stock_ctx, indicators, headlines)
    
    _cache[cache_key] = (result, now + _CACHE_TTL)
    return result


@router.get("/{symbol}/news")
async def stock_news(symbol: str) -> dict:
    cache_key = f"news_{symbol.upper()}"
    now = time.time()
    
    if cache_key in _cache:
        data, exp = _cache[cache_key]
        if now < exp:
            return data

    result = await get_stock_news(symbol.upper())
    _cache[cache_key] = (result, now + _CACHE_TTL)
    return result


@router.post("/{symbol}/chat")
async def stock_chat(symbol: str, body: ChatRequest) -> dict:
    stock_ctx = get_stock_data(symbol.upper(), period="1mo")
    reply = await chat_about_stock(
        symbol=symbol.upper(),
        user_message=body.message,
        history=[m.model_dump() for m in body.history],
        stock_ctx=stock_ctx,
    )
    return {"reply": reply}


@router.post("/compare-stocks", tags=["ai"])
async def compare_stocks(body: MultiStockChatRequest) -> dict:
    """
    Compare multiple stocks head-to-head using live data.
    Returns: rankings, strengths/weaknesses per stock, diversification score.
    """
    from app.agents.fin_agent import multi_stock_comparison_agent

    symbols = [s.upper() for s in body.symbols]
    user_context = f"Compare these stocks: {', '.join(symbols)}\n\nUser question: {body.message}"

    result = await run_agent_json(
        agent=multi_stock_comparison_agent,
        user_message=user_context,
        timeout=60,
    )
    return result or {"error": "Failed to compare stocks"}


@router.post("/multi-chat", tags=["ai"])
async def multi_stock_chat(body: MultiStockChatRequest) -> dict:
    """
    Multi-turn conversation about multiple stocks with memory.
    """
    from app.agents.fin_agent import stock_chat_agent

    symbols = [s.upper() for s in body.symbols]
    stock_context_list = [get_stock_data(sym, period="1mo") for sym in symbols]

    # Build context string with all stocks
    context_str = "Analyzing stocks: " + ", ".join(symbols)
    for sym, ctx in zip(symbols, stock_context_list):
        context_str += f"\n{sym}: Price ${ctx.get('currentPrice', 'N/A')}, 52W High ${ctx.get('fiftyTwoWeekHigh', 'N/A')}"

    context_str += f"\n\nUser message: {body.message}"

    reply = await chat_about_stock(
        symbol=";".join(symbols),  # Multiple symbols separated by ;
        user_message=body.message,
        history=body.history,
        stock_ctx={"symbols": symbols, "contexts": stock_context_list},
    )

    return {"reply": reply}

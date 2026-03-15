from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import stock, portfolio, chart, live

app = FastAPI(
    title="FinAgent API",
    description="AI-powered stock research backend using Google ADK, Gemini, yfinance, and NewsAPI",
    version="1.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(stock.router,     prefix="/api/stock",     tags=["stock"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(chart.router,     prefix="/api/chart",     tags=["chart"])
app.include_router(live.router,      prefix="/api/live",      tags=["live"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    error_msg = str(exc)
    
    # Handle Gemini API 429
    if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
        return JSONResponse(
            status_code=429,
            content={"detail": "⏳ FinAI is currently analyzing too many requests. Please wait 45 seconds and try again."},
        )
        
    # Handle Yahoo Finance 429 Rate Limits / Network errors
    if "Too Many Requests" in error_msg or "429 Client Error" in error_msg:
        return JSONResponse(
            status_code=429,
            content={"detail": "Market data provider (Yahoo Finance) is currently rate-limiting your IP. This is common during local testing and will resolve automatically. Try again soon."},
        )

    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )

@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}

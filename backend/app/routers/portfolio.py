from __future__ import annotations

from fastapi import APIRouter

from app.services.portfolio_service import analyze_portfolio
from app.models                      import PortfolioRequest

router = APIRouter()


@router.post("/analyze")
async def portfolio_analyze(body: PortfolioRequest) -> dict:
    return await analyze_portfolio([h.model_dump() for h in body.holdings])

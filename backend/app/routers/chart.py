from __future__ import annotations

from fastapi import APIRouter

from app.services.gemini_service import analyze_chart_image
from app.models import ChartAnalyzeRequest

router = APIRouter()


@router.post("/analyze")
async def chart_analyze(body: ChartAnalyzeRequest) -> dict:
    return await analyze_chart_image(body.image, body.mime_type)

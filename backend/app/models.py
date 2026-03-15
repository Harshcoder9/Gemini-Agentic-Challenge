from __future__ import annotations

from pydantic import BaseModel, Field


# ─── Stock Chat ───────────────────────────────────────────────────────────────

class ChatHistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatHistoryMessage] = Field(default_factory=list)


# ─── Chart Vision ─────────────────────────────────────────────────────────────

class ChartAnalyzeRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded image bytes")
    mime_type: str = Field("image/png", pattern=r"^image/(png|jpeg|webp)$")


# ─── Portfolio ────────────────────────────────────────────────────────────────

class HoldingItem(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20)
    quantity: float = Field(..., gt=0)


class PortfolioRequest(BaseModel):
    holdings: list[HoldingItem] = Field(..., min_length=1)

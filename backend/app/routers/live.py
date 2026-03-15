from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from dataclasses import dataclass, field

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.gemini_service import chat_about_stock, chat_general_finance
from app.services.stock_service import get_stock_data

router = APIRouter()
logger = logging.getLogger(__name__)

NAME_TO_TICKER = {
    "APPLE": "AAPL",
    "MICROSOFT": "MSFT",
    "GOOGLE": "GOOGL",
    "ALPHABET": "GOOGL",
    "AMAZON": "AMZN",
    "NVIDIA": "NVDA",
    "TESLA": "TSLA",
    "INFOSYS": "INFY",
}


def _extract_symbols_from_message(text: str) -> list[str]:
    upper = text.upper()

    symbols: list[str] = []
    for name, ticker in NAME_TO_TICKER.items():
        if name in upper and ticker not in symbols:
            symbols.append(ticker)

    for token in re.findall(r"\b[A-Z]{1,5}\b", upper):
        if token not in symbols:
            symbols.append(token)

    return symbols[:1]


@dataclass
class LiveSessionState:
    symbols: list[str] = field(default_factory=list)
    history: list[dict] = field(default_factory=list)
    active_task: asyncio.Task | None = None
    send_lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    audio_chunks: list[bytes] = field(default_factory=list)
    audio_mime_type: str = "audio/webm"


async def _send_json(websocket: WebSocket, payload: dict, lock: asyncio.Lock) -> None:
    async with lock:
        await websocket.send_text(json.dumps(payload))


async def _stream_assistant_reply(
    websocket: WebSocket,
    state: LiveSessionState,
    user_message: str,
) -> None:
    try:
        primary = state.symbols[0] if state.symbols else 'GENERAL'
        reply = None

        logger.info(
            f"_stream_assistant_reply: primary={primary}, message={user_message[:60]}")

        # General finance chatbot mode (no specific stock)
        if primary == 'GENERAL' or not state.symbols:
            logger.info("Calling chat_general_finance")
            reply = await chat_general_finance(user_message, state.history)
            logger.info(f"chat_general_finance returned: {reply[:100]}")
        else:
            try:
                stock_ctx = get_stock_data(primary, period="1mo")
            except Exception as e:
                logger.error(f"get_stock_data failed: {e}")
                reply = await chat_general_finance(user_message, state.history)
                stock_ctx = None

            if stock_ctx and reply is None:
                scoped_message = (
                    f"Live market snapshot for {primary}: "
                    f"price={stock_ctx.get('currentPrice')}, "
                    f"changePct={stock_ctx.get('priceChangePercent')}, "
                    f"52wHigh={stock_ctx.get('fiftyTwoWeekHigh')}, "
                    f"52wLow={stock_ctx.get('fiftyTwoWeekLow')}, "
                    f"volume={stock_ctx.get('volume')}\n\n"
                    f"User request: {user_message}"
                )

                reply = await chat_about_stock(
                    symbol=primary,
                    user_message=scoped_message,
                    history=state.history,
                    stock_ctx=stock_ctx,
                )

        logger.info(
            f"About to stream reply: {reply[:100] if reply else 'None'}")

        assistant_id = f"assistant_{uuid.uuid4().hex}"
        await _send_json(
            websocket,
            {"type": "assistant.start", "assistantId": assistant_id},
            state.send_lock,
        )

        words = reply.split(" ")
        for i, word in enumerate(words):
            suffix = " " if i < len(words) - 1 else ""
            await _send_json(
                websocket,
                {
                    "type": "assistant.chunk",
                    "assistantId": assistant_id,
                    "delta": f"{word}{suffix}",
                },
                state.send_lock,
            )
            # Small delay makes the stream feel live while keeping latency low.
            await asyncio.sleep(0.015)

        state.history.append({"role": "assistant", "content": reply})
        await _send_json(
            websocket,
            {"type": "assistant.done", "assistantId": assistant_id},
            state.send_lock,
        )
    except asyncio.CancelledError:
        logger.info("_stream_assistant_reply cancelled")
        await _send_json(
            websocket,
            {"type": "assistant.interrupted"},
            state.send_lock,
        )
        raise
    except Exception as exc:  # pragma: no cover - network/runtime guardrail
        logger.error(f"_stream_assistant_reply error: {exc}", exc_info=True)
        error_msg = str(exc)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            error_msg = "⏳ FinAI is currently analyzing too many requests. Please wait 45 seconds and try again."
        
        await _send_json(
            websocket,
            {"type": "assistant.error", "message": error_msg},
            state.send_lock,
        )


@router.websocket("/session")
async def live_session(websocket: WebSocket) -> None:
    await websocket.accept()
    state = LiveSessionState()
    logger.info("WebSocket session started")

    try:
        while True:
            raw = await websocket.receive_text()
            event = json.loads(raw)
            event_type = event.get("type")
            logger.info(f"Received event: {event_type}")

            if event_type == "session.ping":
                await _send_json(websocket, {"type": "session.pong"}, state.send_lock)
                continue

            if event_type == "session.init":
                incoming_symbols = event.get("symbols") or []
                state.symbols = [str(s).upper()
                                 for s in incoming_symbols if str(s).strip()]
                state.history.clear()
                logger.info(
                    f"Session initialized with symbols: {state.symbols}")
                await _send_json(
                    websocket,
                    {
                        "type": "session.ready",
                        "symbols": state.symbols,
                    },
                    state.send_lock,
                )
                continue

            if event_type == "user.interrupt":
                if state.active_task and not state.active_task.done():
                    state.active_task.cancel()
                continue

            if event_type == "user.audio_chunk":
                chunk_b64 = event.get("chunk") or ""
                mime_type = event.get("mimeType") or "audio/webm"
                if not chunk_b64:
                    await _send_json(
                        websocket,
                        {"type": "assistant.error",
                            "message": "Audio chunk is empty."},
                        state.send_lock,
                    )
                    continue

                try:
                    import base64

                    raw = base64.b64decode(chunk_b64)
                except Exception:
                    await _send_json(
                        websocket,
                        {"type": "assistant.error",
                            "message": "Invalid base64 audio chunk."},
                        state.send_lock,
                    )
                    continue

                state.audio_mime_type = str(mime_type)
                state.audio_chunks.append(raw)
                await _send_json(
                    websocket,
                    {
                        "type": "session.audio_ack",
                        "chunks": len(state.audio_chunks),
                        "bytes": sum(len(c) for c in state.audio_chunks),
                    },
                    state.send_lock,
                )
                continue

            if event_type == "user.audio_commit":
                transcript = (event.get("transcript") or "").strip()

                if not transcript:
                    await _send_json(
                        websocket,
                        {
                            "type": "assistant.error",
                            "message": "Audio committed, but transcript is empty. Please retry voice input.",
                        },
                        state.send_lock,
                    )
                    state.audio_chunks.clear()
                    continue

                if state.active_task and not state.active_task.done():
                    state.active_task.cancel()

                state.history.append({"role": "user", "content": transcript})
                state.active_task = asyncio.create_task(
                    _stream_assistant_reply(websocket, state, transcript)
                )
                continue

            if event_type == "user.message":
                message = (event.get("message") or "").strip()
                if not message:
                    await _send_json(
                        websocket,
                        {"type": "assistant.error",
                            "message": "Message cannot be empty."},
                        state.send_lock,
                    )
                    continue

                detected = _extract_symbols_from_message(message)
                if detected:
                    state.symbols = detected

                if state.active_task and not state.active_task.done():
                    state.active_task.cancel()

                state.history.append({"role": "user", "content": message})
                state.active_task = asyncio.create_task(
                    _stream_assistant_reply(websocket, state, message)
                )
                continue

            await _send_json(
                websocket,
                {"type": "assistant.error",
                    "message": f"Unsupported event type: {event_type}"},
                state.send_lock,
            )
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        if state.active_task and not state.active_task.done():
            state.active_task.cancel()
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        if state.active_task and not state.active_task.done():
            state.active_task.cancel()

from __future__ import annotations
from app.config import settings
from google.genai import types
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner

import asyncio
import json
import os
import re
import uuid

# Maximum seconds to wait for a single agent run before giving up
_AGENT_TIMEOUT_SECONDS = 50


def _json_from_text(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError(f"No JSON found in agent response: {text[:200]}")
    return json.loads(match.group())


def _prepare_environment() -> None:
    os.environ["GOOGLE_API_KEY"] = settings.gemini_api_key


async def run_agent_text(
    agent,
    prompt: str,
    *,
    inline_parts: list[types.Part] | None = None,
    state: dict | None = None,
    timeout: int | None = None,
) -> str:
    _prepare_environment()

    session_service = InMemorySessionService()
    runner = Runner(
        app_name=settings.agent_app_name,
        agent=agent,
        session_service=session_service,
    )

    user_id = "finagent_api"
    session_id = f"session_{uuid.uuid4().hex}"
    await session_service.create_session(
        app_name=settings.agent_app_name,
        user_id=user_id,
        session_id=session_id,
        state=state or {},
    )

    message_parts = [types.Part.from_text(text=prompt)]
    if inline_parts:
        message_parts.extend(inline_parts)

    async def _collect() -> str:
        last = ""
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=types.Content(role="user", parts=message_parts),
        ):
            if event.error_message:
                raise RuntimeError(event.error_message)
            if not event.content or not event.content.parts or event.author != agent.name:
                continue
            event_text = "".join(
                part.text or "" for part in event.content.parts if getattr(part, "text", None))
            if event_text:
                last = event_text.strip()
        return last

    try:
        agent_timeout = timeout or _AGENT_TIMEOUT_SECONDS
        print(f"[Runner] Starting agent {agent.name} with timeout {agent_timeout}s")
        last_text = await asyncio.wait_for(_collect(), timeout=agent_timeout)
        print(f"[Runner] Agent {agent.name} finished successfully")
    except asyncio.TimeoutError:
        print(f"[Runner] TIMEOUT for agent {agent.name}")
        raise RuntimeError(
            f"Agent '{agent.name}' did not respond within {agent_timeout}s. "
            "The Gemini model may be overloaded — please retry."
        )
    except Exception as e:
        print(f"[Runner] ERROR for agent {agent.name}: {str(e)}")
        raise e

    if not last_text:
        raise RuntimeError(f"Agent '{agent.name}' returned no text output.")
    return last_text


async def run_agent_json(
    agent,
    prompt: str,
    *,
    inline_parts: list[types.Part] | None = None,
    state: dict | None = None,
    timeout: int | None = None,
) -> dict:
    return _json_from_text(
        await run_agent_text(agent, prompt, inline_parts=inline_parts, state=state, timeout=timeout)
    )

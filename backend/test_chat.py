import asyncio
import traceback

from app.services.gemini_service import chat_general_finance

async def test():
    try:
        print("calling chat_general_finance...", flush=True)
        res = await chat_general_finance("Hello", [])
        print("Success!", flush=True)
    except Exception as e:
        print("Exception:", e, flush=True)
        traceback.print_exc()

asyncio.run(test())

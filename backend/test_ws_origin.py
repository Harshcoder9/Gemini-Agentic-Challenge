import asyncio
import websockets
import json

async def test():
    try:
        async with websockets.connect(
            'ws://localhost:8000/api/live/session',
            extra_headers={"Origin": "http://localhost:3000"}
        ) as ws:
            print("Connected with Origin", flush=True)
            await ws.send(json.dumps({"type": "session.init", "symbols": ["GENERAL"]}))
            resp = await ws.recv()
            print("Received on init:", resp, flush=True)
    except Exception as e:
        print("Exception:", e, flush=True)

asyncio.run(test())

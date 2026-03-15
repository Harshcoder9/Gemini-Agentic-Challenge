import asyncio
import websockets
import json
import traceback

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/api/live/session') as ws:
            print("Connected")
            await ws.send(json.dumps({"type": "session.init", "symbols": ["GENERAL"]}))
            resp = await ws.recv()
            print("Received on init:", resp)
            
            await ws.send(json.dumps({"type": "user.message", "message": "hello"}))
            resp = await ws.recv()
            print("Received on message:", resp)
    except Exception as e:
        print("Exception:", e)
        traceback.print_exc()

asyncio.run(test())

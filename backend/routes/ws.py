from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis.asyncio as aioredis
import httpx, json, os

router = APIRouter()
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")

@router.websocket("/ws/transactions")
async def ws_transactions(websocket: WebSocket, token: str = Query(...)):
    # Verify admin session before accepting connection
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{FRONTEND_URL}/api/auth/get-session",
                                headers={"Authorization": f"Bearer {token}"})
    if resp.status_code != 200 or resp.json().get("user", {}).get("role") != "admin":
        await websocket.close(code=4001)
        return

    await websocket.accept()
    r = aioredis.from_url(REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.subscribe("transactions")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"].decode())
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe("transactions")
        await r.close()

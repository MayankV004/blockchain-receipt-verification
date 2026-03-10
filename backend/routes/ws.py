from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis
import httpx
import json
import os

router = APIRouter()
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: str):
        disconnected = []
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)


manager = ConnectionManager()


async def verify_admin(websocket: WebSocket) -> bool:
    session_cookie = websocket.cookies.get("better-auth.session_token")
    if not session_cookie:
        return False
    headers = {"Cookie": f"better-auth.session_token={session_cookie}"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{FRONTEND_URL}/api/auth/get-session", headers=headers
        )
    if resp.status_code != 200:
        return False
    data = resp.json()
    user = data.get("user", {}) if isinstance(data, dict) else {}
    return user.get("role") == "admin"


@router.websocket("/ws/transactions")
async def ws_transactions(websocket: WebSocket):
    is_admin = await verify_admin(websocket)
    if not is_admin:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket)

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
        manager.disconnect(websocket)
        await pubsub.unsubscribe("transactions")
        await r.close()

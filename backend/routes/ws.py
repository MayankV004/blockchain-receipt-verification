from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis.asyncio as aioredis
import httpx, json, os

router = APIRouter()
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")

@router.websocket("/ws/transactions")
async def ws_transactions(websocket: WebSocket):
    # Try reading Better Auth cookies (name can differ by browser, e.g. cross-site)
    session_cookie = websocket.cookies.get("better-auth.session_token")
    
    print(f"WS Connect attempt, cookies found: {websocket.cookies.keys()}")
    
    headers = {}
    if session_cookie:
        headers["Cookie"] = f"better-auth.session_token={session_cookie}"
        
    async with httpx.AsyncClient() as client:
        # Use headers to forward the cookie to the Next.js auth endpoint
        resp = await client.get(f"{FRONTEND_URL}/api/auth/get-session", headers=headers)
    
    print(f"Auth check status: {resp.status_code}")
    if resp.status_code != 200:
        print("WS Reject: Auth API returned non-200")
        await websocket.close(code=4001)
        return
    
    data = resp.json()
    if not data or not isinstance(data, dict):
        print("WS Reject: Auth API returned invalid JSON")
        await websocket.close(code=4001)
        return
        
    user = data.get("user", {})
    print(f"WS User: {user.get('email', 'Unknown')} (role: {user.get('role', 'none')})")
    if not user or user.get("role") != "admin":
        print("WS Reject: User is not admin")
        await websocket.close(code=4001)
        return

    print("WS Accept: User is admin, connection accepted.")
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

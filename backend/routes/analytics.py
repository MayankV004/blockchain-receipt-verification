import os
import json
import time
import httpx
import redis.asyncio as aioredis
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")


@router.get("/analytics/overview")
async def get_overview():
    """Combined stats for the dashboard overview."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            stats_resp = await client.get(f"{BLOCKCHAIN_URL}/chain/stats")
            stats_resp.raise_for_status()
            stats = stats_resp.json()
        except Exception as e:
            raise HTTPException(503, f"Blockchain unreachable: {str(e)}")

    try:
        r = aioredis.from_url(REDIS_URL)
        valid = int(await r.get("stats:valid_verifications") or 0)
        invalid = int(await r.get("stats:invalid_verifications") or 0)
        await r.close()
    except Exception:
        valid = stats.get("valid_verifications", 0)
        invalid = stats.get("invalid_verifications", 0)

    return {
        **stats,
        "verification_stats": {
            "valid": valid,
            "invalid": invalid,
            "total": valid + invalid,
            "success_rate": round(valid / max(valid + invalid, 1) * 100, 1),
        },
    }


@router.get("/analytics/activity")
async def get_activity(limit: int = Query(50, ge=1, le=200)):
    """Recent activity log from Redis."""
    try:
        r = aioredis.from_url(REDIS_URL)
        raw_items = await r.lrange("activity_log", 0, limit - 1)
        await r.close()
        items = [json.loads(item) for item in raw_items]
        return {"activity": items}
    except Exception:
        return {"activity": []}


@router.get("/analytics/timeline")
async def get_timeline():
    """Transaction timeline bucketed by hour for the last 24 hours."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{BLOCKCHAIN_URL}/chain/transactions",
                params={"limit": 200},
            )
            resp.raise_for_status()
            transactions = resp.json().get("transactions", [])
        except Exception:
            transactions = []

    now = time.time()
    buckets = {}
    for i in range(24):
        hour_start = now - (i + 1) * 3600
        hour_end = now - i * 3600
        label = f"{23 - i}h ago" if i > 0 else "now"
        buckets[23 - i] = {"label": label, "hour": 23 - i, "count": 0, "start": hour_start, "end": hour_end}

    for tx in transactions:
        ts = tx.get("timestamp", 0)
        hours_ago = (now - ts) / 3600
        if 0 <= hours_ago < 24:
            bucket_idx = 23 - int(hours_ago)
            if bucket_idx in buckets:
                buckets[bucket_idx]["count"] += 1

    timeline = sorted(buckets.values(), key=lambda x: x["hour"])
    return {"timeline": [{"label": b["label"], "hour": b["hour"], "count": b["count"]} for b in timeline]}


@router.get("/health/services")
async def get_service_health():
    """Check health of all connected services."""
    services = {}

    # Blockchain node
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(f"{BLOCKCHAIN_URL}/health")
            services["blockchain"] = {
                "status": "healthy" if resp.status_code == 200 else "degraded",
                "latency_ms": resp.elapsed.total_seconds() * 1000,
                "details": resp.json() if resp.status_code == 200 else {},
            }
        except Exception as e:
            services["blockchain"] = {"status": "down", "error": str(e)}

    # Redis
    try:
        r = aioredis.from_url(REDIS_URL)
        start = time.time()
        await r.ping()
        latency = (time.time() - start) * 1000
        info = await r.info("memory")
        await r.close()
        services["redis"] = {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "memory_used": info.get("used_memory_human", "N/A"),
        }
    except Exception as e:
        services["redis"] = {"status": "down", "error": str(e)}

    services["api"] = {"status": "healthy"}

    all_healthy = all(s.get("status") == "healthy" for s in services.values())
    return {
        "overall": "healthy" if all_healthy else "degraded",
        "services": services,
    }

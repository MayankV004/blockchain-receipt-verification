from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from utils import generate_hash
import os
import json
import time
import httpx
import redis.asyncio as aioredis
import qrcode
import io

router = APIRouter()

BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")


@router.post("/verify")
async def verify_receipt(file: UploadFile = File(...)):
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes, file.filename or "")
    timestamp = time.time()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{BLOCKCHAIN_URL}/chain/find",
                params={"hash": file_hash},
            )
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            raise HTTPException(503, f"Blockchain node unreachable: {str(e)}")

    is_valid = bool(data and data.get("receipt_id"))

    # Broadcast verification event
    try:
        r = aioredis.from_url(REDIS_URL)
        event = json.dumps({
            "type": "verification",
            "file_hash": file_hash,
            "filename": file.filename or "unknown",
            "is_valid": is_valid,
            "timestamp": timestamp,
            "receipt_id": data.get("receipt_id") if is_valid else None,
        })
        await r.publish("transactions", event)
        await r.lpush("activity_log", event)
        await r.ltrim("activity_log", 0, 499)
        # Update counters
        if is_valid:
            await r.incr("stats:valid_verifications")
        else:
            await r.incr("stats:invalid_verifications")
        await r.close()
    except Exception:
        pass

    if is_valid:
        return {
            "status": "verified",
            "valid": True,
            "receipt_id": data.get("receipt_id"),
            "uploader": data.get("uploader"),
            "file_hash": file_hash,
            "block_index": data.get("block_index"),
            "block_hash": data.get("block_hash"),
            "merkle_root": data.get("merkle_root"),
            "original_timestamp": data.get("timestamp"),
        }
    return {
        "status": "invalid",
        "valid": False,
        "file_hash": file_hash,
        "message": "Document not found on blockchain — possibly tampered or never registered",
    }


@router.get("/verify/{receipt_id}")
async def verify_by_id(receipt_id: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{BLOCKCHAIN_URL}/chain/find_receipt",
                params={"receipt_id": receipt_id},
            )
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            raise HTTPException(503, f"Blockchain node unreachable: {str(e)}")

    if data and data.get("receipt_id"):
        return {
            "status": "verified",
            "valid": True,
            **data,
        }
    return {
        "status": "not_found",
        "valid": False,
        "receipt_id": receipt_id,
    }


@router.get("/qr/{receipt_id}")
def get_qr(receipt_id: str):
    url = f"{FRONTEND_URL}/verify?id={receipt_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

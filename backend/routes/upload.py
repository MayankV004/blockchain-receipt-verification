from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
import uuid
import json
import time
import httpx
import redis.asyncio as aioredis
from utils import generate_hash

router = APIRouter()

BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

ALLOWED_TYPES = {
    "application/pdf", "text/plain",
    "image/jpeg", "image/png", "image/jpg",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    uploader: str = Form("anonymous"),
):
    if file.content_type and file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, "File exceeds 10MB limit")

    file_hash = generate_hash(file_bytes, file.filename or "")
    receipt_id = str(uuid.uuid4())
    filename = file.filename or "unknown"
    file_size = len(file_bytes)
    timestamp = time.time()

    # Store hash on blockchain
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(f"{BLOCKCHAIN_URL}/chain/add", json={
                "receipt_id": receipt_id,
                "file_hash": file_hash,
                "uploader": uploader,
                "filename": filename,
                "file_size": file_size,
            })
            response.raise_for_status()
            chain_result = response.json()
        except httpx.RequestError as e:
            raise HTTPException(503, f"Blockchain node unreachable: {str(e)}")

    # Broadcast upload event via Redis
    try:
        r = aioredis.from_url(REDIS_URL)
        event = json.dumps({
            "type": "upload",
            "receipt_id": receipt_id,
            "file_hash": file_hash,
            "uploader": uploader,
            "filename": filename,
            "file_size": file_size,
            "timestamp": timestamp,
        })
        await r.publish("transactions", event)
        # Store in activity log
        await r.lpush("activity_log", event)
        await r.ltrim("activity_log", 0, 499)
        await r.close()
    except Exception:
        pass  # Non-critical

    return {
        "receipt_id": receipt_id,
        "file_hash": file_hash,
        "filename": filename,
        "file_size": file_size,
        "uploader": uploader,
        "timestamp": timestamp,
        "status": "anchored",
        "blockchain": chain_result.get("transaction", {}),
    }

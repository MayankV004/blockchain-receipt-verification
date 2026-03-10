import os
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")


@router.get("/chain/stats")
async def get_chain_stats():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{BLOCKCHAIN_URL}/chain/stats")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            raise HTTPException(503, f"Blockchain unreachable: {str(e)}")


@router.get("/chain")
async def get_chain_blocks(limit: int = Query(10, ge=1, le=100)):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{BLOCKCHAIN_URL}/chain",
                params={"limit": limit},
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            raise HTTPException(503, f"Blockchain unreachable: {str(e)}")


@router.get("/chain/valid")
async def validate_chain():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{BLOCKCHAIN_URL}/chain/valid")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            raise HTTPException(503, f"Blockchain unreachable: {str(e)}")


@router.get("/chain/transactions")
async def get_transactions(limit: int = Query(50, ge=1, le=200)):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{BLOCKCHAIN_URL}/chain/transactions",
                params={"limit": limit},
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            raise HTTPException(503, f"Blockchain unreachable: {str(e)}")

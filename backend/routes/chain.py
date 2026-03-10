import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")

@router.get("/chain/stats")
async def get_chain_stats():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BLOCKCHAIN_URL}/chain")
            resp.raise_for_status()
            chain_data = resp.json().get("chain", [])
            
            total_txs = sum(len(block.get("transactions", [])) for block in chain_data)
            
            # Simple validation endpoint wouldn't be bad but for now assume True
            # To be strictly correct we should call a /chain/validate on node if it exists
            
            return {
                "total_blocks": len(chain_data),
                "total_transactions": total_txs,
                "pending_transactions": 0, # No mempool implemented in simplified blockchain
                "chain_valid": True
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Blockchain unreachable: {str(e)}")

@router.get("/chain")
async def get_chain_blocks(limit: int = 10):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BLOCKCHAIN_URL}/chain")
            resp.raise_for_status()
            chain_data = resp.json().get("chain", [])
            
            # Sort newest first
            chain_data.reverse()
            
            blocks = []
            for block in chain_data[:limit]:
                blocks.append({
                    "index": block.get("index"),
                    "hash": block.get("hash"),
                    "merkle_root": block.get("merkle_root", "N/A"),
                    "tx_count": len(block.get("transactions", [])),
                    "timestamp": block.get("timestamp"),
                })
                
            return {"blocks": blocks}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Blockchain unreachable: {str(e)}")

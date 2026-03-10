from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from blockchain import Blockchain
import redis.asyncio as aioredis
import json
import os

app = FastAPI(title="ChainVerify Blockchain Node", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

blockchain = Blockchain()
redis_client = None


@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL", "redis://redis:6379")
    )


class TransactionModel(BaseModel):
    receipt_id: str
    file_hash: str
    uploader: str
    filename: str = ""
    file_size: int = 0


@app.post("/chain/add")
async def add_transaction(tx: TransactionModel):
    result = blockchain.add_transaction(
        receipt_id=tx.receipt_id,
        file_hash=tx.file_hash,
        uploader=tx.uploader,
        filename=tx.filename,
        file_size=tx.file_size,
    )
    if redis_client:
        await redis_client.publish("transactions", json.dumps(result))
    return {"status": "accepted", "transaction": result}


@app.get("/chain/find")
def find_hash(file_hash: str = Query(..., alias="hash")):
    tx = blockchain.find_hash(file_hash)
    if tx:
        return tx
    return {}


@app.get("/chain/find_receipt")
def find_receipt(receipt_id: str = Query(...)):
    tx = blockchain.find_by_receipt_id(receipt_id)
    if tx:
        return tx
    return {}


@app.get("/chain")
def get_chain(limit: int = Query(20, ge=1, le=100)):
    return {
        "blocks": blockchain.get_recent_blocks(limit),
        "stats": blockchain.get_stats(),
    }


@app.get("/chain/stats")
def get_stats():
    return blockchain.get_stats()


@app.get("/chain/valid")
def validate():
    return {"valid": blockchain.is_valid()}


@app.get("/chain/transactions")
def get_transactions(limit: int = Query(50, ge=1, le=200)):
    return {"transactions": blockchain.get_all_transactions(limit)}


@app.post("/chain/seal")
async def force_seal():
    block = blockchain.force_seal()
    if block:
        return {"status": "sealed", "block": block.to_dict()}
    return {"status": "no_pending_transactions"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "chain_length": len(blockchain.chain),
        "valid": blockchain.is_valid(),
    }

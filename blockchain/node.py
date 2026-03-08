from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from blockchain import Blockchain

app = FastAPI(title="Blockchain Node API")

blockchain = Blockchain()

class TransactionModel(BaseModel):
    receipt_id: str
    file_hash: str
    uploader: str

@app.post("/chain/add")
def add_transaction(tx: TransactionModel):
    new_block = blockchain.add_transaction(
        receipt_id=tx.receipt_id,
        file_hash=tx.file_hash,
        uploader=tx.uploader
    )
    return {"message": "Transaction added to block", "block_index": new_block.index}

@app.get("/chain/find")
def find_hash(file_hash: str = Query(..., alias="hash")):
    tx = blockchain.find_hash(file_hash)
    if tx:
        return tx
    return {} # Changed from returning None or 404 per the original verify script expectations, maybe return empty dict or raise 404, let's just return what `requests.get().json()` expects. `backend/routes/verify.py` checks `if data:`

@app.get("/chain")
def get_chain():
    chain_data = []
    for block in blockchain.chain:
        chain_data.append(block.__dict__)
    return {"length": len(chain_data), "chain": chain_data}

import threading
import time
import os
import json
import redis
from block import Block
from typing import List, Dict, Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
CHAIN_KEY = "blockchain:chain"


class Blockchain:
    """Thread-safe blockchain with batch processing and Redis persistence."""

    BATCH_SIZE = 10
    BATCH_TIMEOUT = 5.0

    def __init__(self):
        self._lock = threading.RLock()
        self.r = redis.from_url(REDIS_URL, decode_responses=True)
        self.chain: List[Block] = []
        self._pending: List[Dict] = []
        self._stats = {
            "total_tx": 0,
            "blocks_mined": 0,
            "start_time": time.time(),
            "verifications": 0,
            "valid_verifications": 0,
            "invalid_verifications": 0,
        }
        self._load_from_redis()
        if not self.chain:
            self._create_genesis_block()
        else:
            self._stats["total_tx"] = sum(
                len(b.transactions) for b in self.chain
            )
            self._stats["blocks_mined"] = len(self.chain) - 1

        self._timer = threading.Timer(self.BATCH_TIMEOUT, self._auto_seal)
        self._timer.daemon = True
        self._timer.start()

    def _load_from_redis(self):
        raw = self.r.get(CHAIN_KEY)
        if not raw:
            return
        chain_data = json.loads(raw)
        for bd in chain_data:
            b = Block.__new__(Block)
            b.__dict__.update(bd)
            self.chain.append(b)

    def _save_to_redis(self):
        self.r.set(CHAIN_KEY, json.dumps([b.to_dict() for b in self.chain]))

    def _create_genesis_block(self):
        genesis = Block(0, [], "0")
        self.chain.append(genesis)
        self._save_to_redis()

    def add_transaction(self, receipt_id: str, file_hash: str, uploader: str,
                        filename: str = "", file_size: int = 0) -> Dict:
        tx = {
            "receipt_id": receipt_id,
            "file_hash": file_hash,
            "uploader": uploader,
            "filename": filename,
            "file_size": file_size,
            "timestamp": time.time(),
        }
        with self._lock:
            self._pending.append(tx)
            self._stats["total_tx"] += 1
            if len(self._pending) >= self.BATCH_SIZE:
                self._seal_block()
        return tx

    def _seal_block(self):
        if not self._pending:
            return None
        block = Block(len(self.chain), self._pending[:], self.chain[-1].hash)
        self.chain.append(block)
        self._pending.clear()
        self._stats["blocks_mined"] += 1
        self._save_to_redis()
        return block

    def force_seal(self) -> Optional[Block]:
        with self._lock:
            return self._seal_block()

    def _auto_seal(self):
        with self._lock:
            if self._pending:
                self._seal_block()
        self._timer = threading.Timer(self.BATCH_TIMEOUT, self._auto_seal)
        self._timer.daemon = True
        self._timer.start()

    def find_hash(self, file_hash: str) -> Optional[Dict]:
        with self._lock:
            self._stats["verifications"] += 1
            for block in reversed(self.chain):
                for tx in block.transactions:
                    if tx["file_hash"] == file_hash:
                        self._stats["valid_verifications"] += 1
                        return {
                            **tx,
                            "block_index": block.index,
                            "block_hash": block.hash,
                            "merkle_root": block.merkle_root,
                        }
            for tx in self._pending:
                if tx["file_hash"] == file_hash:
                    self._stats["valid_verifications"] += 1
                    return {**tx, "block_index": "pending", "block_hash": None}
            self._stats["invalid_verifications"] += 1
        return None

    def find_by_receipt_id(self, receipt_id: str) -> Optional[Dict]:
        with self._lock:
            for block in reversed(self.chain):
                for tx in block.transactions:
                    if tx["receipt_id"] == receipt_id:
                        return {
                            **tx,
                            "block_index": block.index,
                            "block_hash": block.hash,
                        }
        return None

    def is_valid(self) -> bool:
        with self._lock:
            for i in range(1, len(self.chain)):
                curr, prev = self.chain[i], self.chain[i - 1]
                if curr.previous_hash != prev.hash:
                    return False
                if curr.hash != curr.compute_hash():
                    return False
        return True

    def get_stats(self) -> Dict:
        with self._lock:
            uptime = time.time() - self._stats["start_time"]
            return {
                "total_blocks": len(self.chain),
                "total_transactions": self._stats["total_tx"],
                "pending_transactions": len(self._pending),
                "chain_valid": self.is_valid(),
                "uptime_seconds": round(uptime, 1),
                "tx_per_second": round(self._stats["total_tx"] / max(uptime, 1), 4),
                "blocks_mined": self._stats["blocks_mined"],
                "verifications": self._stats["verifications"],
                "valid_verifications": self._stats["valid_verifications"],
                "invalid_verifications": self._stats["invalid_verifications"],
            }

    def get_recent_blocks(self, limit: int = 10) -> List[Dict]:
        with self._lock:
            return [b.to_dict() for b in reversed(self.chain[-limit:])]

    def get_all_transactions(self, limit: int = 50) -> List[Dict]:
        with self._lock:
            txs = []
            for block in reversed(self.chain):
                for tx in reversed(block.transactions):
                    txs.append({
                        **tx,
                        "block_index": block.index,
                        "block_hash": block.hash,
                    })
                    if len(txs) >= limit:
                        return txs
            return txs

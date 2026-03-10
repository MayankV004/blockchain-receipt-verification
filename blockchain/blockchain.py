import time, os, json, redis
from block import Block

# Bug #5 fix: persist chain to Redis so data survives container restarts
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
CHAIN_KEY = "blockchain:chain"

class Blockchain:
    def __init__(self):
        self.r = redis.from_url(REDIS_URL, decode_responses=True)
        self.chain = self._load_from_redis()
        if not self.chain:
            self._create_genesis_block()

    def _load_from_redis(self):
        """Reload chain from Redis on startup."""
        raw = self.r.get(CHAIN_KEY)
        if not raw:
            return []
        chain_data = json.loads(raw)
        blocks = []
        for bd in chain_data:
            b = Block.__new__(Block)
            b.__dict__.update(bd)
            blocks.append(b)
        return blocks

    def _save_to_redis(self):
        """Persist every block as a dict in Redis."""
        self.r.set(CHAIN_KEY, json.dumps([b.__dict__ for b in self.chain]))

    def _create_genesis_block(self):
        genesis = Block(0, [], "0")
        self.chain.append(genesis)
        self._save_to_redis()

    def add_transaction(self, receipt_id, file_hash, uploader):
        transaction = {
            "receipt_id": receipt_id,
            "file_hash": file_hash,
            "uploader": uploader,
            "timestamp": time.time()
        }
        last_block = self.chain[-1]
        new_block = Block(len(self.chain), [transaction], last_block.hash)
        self.chain.append(new_block)
        self._save_to_redis()  # persist after every write
        return new_block

    def find_hash(self, file_hash):
        for block in self.chain:
            for tx in block.transactions:
                if tx["file_hash"] == file_hash:
                    return tx
        return None

    def is_valid(self):
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.previous_hash != prev.hash:
                return False
        return True

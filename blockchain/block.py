import hashlib, json, time
from typing import List, Dict


class MerkleTree:
    """Compute a Merkle root from a list of transaction dicts."""

    @staticmethod
    def compute_root(transactions: List[Dict]) -> str:
        if not transactions:
            return hashlib.sha256(b"empty").hexdigest()
        leaves = [
            hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest()
            for tx in transactions
        ]
        while len(leaves) > 1:
            if len(leaves) % 2 != 0:
                leaves.append(leaves[-1])
            leaves = [
                hashlib.sha256((leaves[i] + leaves[i + 1]).encode()).hexdigest()
                for i in range(0, len(leaves), 2)
            ]
        return leaves[0]


class Block:
    def __init__(self, index: int, transactions: List[Dict], previous_hash: str):
        self.index = index
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.merkle_root = MerkleTree.compute_root(transactions)
        self.nonce = 0
        self.hash = self.compute_hash()

    def compute_hash(self) -> str:
        block_data = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "merkle_root": self.merkle_root,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
        }, sort_keys=True)
        return hashlib.sha256(block_data.encode()).hexdigest()

    def to_dict(self) -> Dict:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "merkle_root": self.merkle_root,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
            "nonce": self.nonce,
            "tx_count": len(self.transactions),
        }

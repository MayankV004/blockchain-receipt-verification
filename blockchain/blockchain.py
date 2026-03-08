import time
from block import Block

class Blockchain:
    def __init__(self):
        self.chain = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        genesis = Block(0, [], "0")
        self.chain.append(genesis)

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

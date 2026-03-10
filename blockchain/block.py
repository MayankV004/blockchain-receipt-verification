import hashlib, json, time

class Block:
    def __init__(self, index, transactions, previous_hash):
        self.index = index
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.hash = self.compute_hash()

    def compute_hash(self):
        # Bug #10 fix: exclude 'hash' key from serialization to avoid circular reference
        # Previously, self.__dict__ included self.hash=None during construction,
        # meaning the hash was computed over None which is incorrect.
        data = {k: v for k, v in self.__dict__.items() if k != "hash"}
        block_data = json.dumps(data, sort_keys=True)
        return hashlib.sha256(block_data.encode()).hexdigest()

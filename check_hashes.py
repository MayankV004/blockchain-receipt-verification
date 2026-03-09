import hashlib

with open('bill1.txt', 'rb') as f:
    print('bill1:', hashlib.sha256(f.read()).hexdigest())

with open('bill2.txt', 'rb') as f:
    print('bill2:', hashlib.sha256(f.read()).hexdigest())

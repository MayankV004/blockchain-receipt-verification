import os

# Using local mock storage as cloud credentials were not provided

os.makedirs("local_storage", exist_ok=True)

def upload_file(file_bytes: bytes, filename: str) -> str:
    with open(os.path.join("local_storage", filename), "wb") as f:
        f.write(file_bytes)
    return filename

def get_file(filename: str) -> bytes:
    with open(os.path.join("local_storage", filename), "rb") as f:
        return f.read()

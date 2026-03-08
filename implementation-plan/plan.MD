# 🔗 Digital Bill / Receipt Verification System
## Full Project Plan — Due: Thursday

> **Team Size:** 5 Members | **Stack:** Python (FastAPI) + Custom Blockchain + Cloudflare R2 + Docker + Next.js (optional)

---

## 📅 Day-by-Day Schedule

### ✅ Day 1 — Sunday (Today): Setup & Core Blockchain
**Goal:** Everyone has the repo running locally. Core blockchain logic is working.

### ✅ Day 2 — Monday: Backend API + Storage
**Goal:** FastAPI endpoints are live. Files upload to Cloudflare R2. Hashes are stored on-chain.

### ✅ Day 3 — Tuesday: Frontend + QR Code + Verification Flow
**Goal:** Full upload → verify cycle works end-to-end through the UI.

### ✅ Day 4 — Wednesday: Docker, Integration & Testing
**Goal:** Everything runs with a single `docker compose up`. All flows tested and stable.

### ✅ Day 5 — Thursday: Demo Day
**Goal:** Clean demo, no surprises. Each member knows what to say.

---

## 👥 Team Member Role Assignments

| Member | Role | Core Responsibility |
|--------|------|---------------------|
| **Member 1** | Blockchain Engineer | Custom Python blockchain, block/transaction structure, immutability logic |
| **Member 2** | Backend Developer | FastAPI app, upload endpoint, hash generation, DB models |
| **Member 3** | Storage & Verification | Cloudflare R2 integration, verification endpoint, QR code generation |
| **Member 4** | Frontend Developer | Next.js UI (or HTML fallback), upload form, verification page |
| **Member 5** | DevOps & Integration | Docker, docker-compose, networking, final integration & demo prep |

---

## 🏗️ Project Folder Structure

```
receipt-verification/
├── blockchain/
│   ├── block.py              # Block class
│   ├── blockchain.py         # Blockchain class
│   └── node.py               # Blockchain node (Flask/FastAPI mini-server)
├── backend/
│   ├── main.py               # FastAPI app
│   ├── routes/
│   │   ├── upload.py         # POST /upload
│   │   └── verify.py         # POST /verify
│   ├── models.py             # DB models (SQLite)
│   ├── storage.py            # Cloudflare R2 client
│   └── requirements.txt
├── frontend/                 # Next.js or plain HTML
│   ├── pages/
│   │   ├── index.js          # Upload page
│   │   └── verify.js         # Verify page
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.blockchain
└── README.md
```

---

## 📋 Step-by-Step Implementation Guide

---

### 🔷 MEMBER 1 — Blockchain Core (`/blockchain/`)

#### Step 1: Create `block.py`
```python
import hashlib, json, time

class Block:
    def __init__(self, index, transactions, previous_hash):
        self.index = index
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_data = json.dumps(self.__dict__, sort_keys=True)
        return hashlib.sha256(block_data.encode()).hexdigest()
```

#### Step 2: Create `blockchain.py`
```python
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
            "timestamp": __import__('time').time()
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
```

#### Step 3: Expose blockchain as an internal API (`node.py`)
- Use FastAPI or a simple in-memory singleton
- Expose `POST /chain/add` and `GET /chain/find?hash=...`

---

### 🔷 MEMBER 2 — Backend API (`/backend/`)

#### Step 1: Install dependencies
```
fastapi
uvicorn
python-multipart
sqlalchemy
aiofiles
boto3
qrcode[pil]
```

#### Step 2: Create `main.py`
```python
from fastapi import FastAPI
from routes import upload, verify

app = FastAPI(title="Receipt Verification API")
app.include_router(upload.router)
app.include_router(verify.router)

@app.get("/")
def root():
    return {"status": "Receipt Verification System Running"}
```

#### Step 3: Create `models.py` (SQLite via SQLAlchemy)
```python
from sqlalchemy import Column, String, Float, create_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Receipt(Base):
    __tablename__ = "receipts"
    receipt_id = Column(String, primary_key=True)
    file_hash = Column(String, unique=True)
    uploader = Column(String)
    timestamp = Column(Float)
    r2_key = Column(String)

engine = create_engine("sqlite:///receipts.db")
Base.metadata.create_all(engine)
```

#### Step 4: Hash generation utility
```python
import hashlib

def generate_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()
```

---

### 🔷 MEMBER 3 — Storage & Verification (`/backend/routes/`)

#### Step 1: R2 Setup on Cloudflare
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → Create a bucket named `receipts`
2. Go to R2 → **Manage R2 API Tokens** → Create token with **Read & Write** permissions
3. Note down your **Account ID**, **Access Key ID**, and **Secret Access Key**
4. Create a `.env` file in `/backend/`:
```
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY=your_access_key_here
R2_SECRET_KEY=your_secret_key_here
R2_BUCKET=receipts
```
> ⚠️ Add `.env` to `.gitignore` — never commit credentials to GitHub

#### Step 2: Cloudflare R2 client (`storage.py`)
```python
import boto3, os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
    region_name="auto"
)
BUCKET = os.getenv("R2_BUCKET", "receipts")

def upload_file(file_bytes: bytes, filename: str) -> str:
    s3.put_object(Bucket=BUCKET, Key=filename, Body=file_bytes)
    return filename

def get_file(filename: str) -> bytes:
    response = s3.get_object(Bucket=BUCKET, Key=filename)
    return response["Body"].read()
```

Add `python-dotenv` to `requirements.txt` as well.

#### Step 2: Upload route (`routes/upload.py`)
```python
from fastapi import APIRouter, UploadFile, File
import uuid, requests
from storage import upload_file
from utils import generate_hash

router = APIRouter()

@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...), uploader: str = "anonymous"):
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes)
    receipt_id = str(uuid.uuid4())
    
    # Store file in Cloudflare R2
    upload_file(file_bytes, receipt_id + "_" + file.filename)
    
    # Store hash on blockchain
    requests.post("http://blockchain:8001/chain/add", json={
        "receipt_id": receipt_id,
        "file_hash": file_hash,
        "uploader": uploader
    })
    
    return {"receipt_id": receipt_id, "file_hash": file_hash, "status": "Stored on blockchain"}
```

#### Step 3: Verify route + QR code (`routes/verify.py`)
```python
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from utils import generate_hash
import requests, qrcode, io

router = APIRouter()

@router.post("/verify")
async def verify_receipt(file: UploadFile = File(...)):
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes)
    
    response = requests.get(f"http://blockchain:8001/chain/find?hash={file_hash}")
    data = response.json()
    
    if data:
        return {"status": "VALID ✅", "receipt_id": data["receipt_id"], "uploader": data["uploader"]}
    return {"status": "INVALID ❌ — Receipt not found or tampered"}

@router.get("/qr/{receipt_id}")
def get_qr(receipt_id: str):
    url = f"http://localhost:8000/verify-id/{receipt_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
```

---

### 🔷 MEMBER 4 — Frontend (`/frontend/`)

#### Step 1: Bootstrap the Next.js app
```bash
npx create-next-app@latest frontend --js --tailwind --no-app --no-src-dir
cd frontend
npm install axios
```

#### Step 2: Configure API base URL
Create `frontend/lib/api.js`:
```js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export default api;
```

Add to `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Step 3: Upload Page (`pages/index.js`)
```jsx
import { useState } from "react";
import api from "../lib/api";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploader, setUploader] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploader", uploader || "anonymous");

    try {
      const { data } = await api.post("/upload", formData);
      setResult(data);
    } catch (err) {
      setResult({ error: "Upload failed. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📄 Upload Receipt</h1>

        <input
          type="text"
          placeholder="Your name"
          className="w-full border rounded-lg p-2 mb-4 text-sm"
          value={uploader}
          onChange={(e) => setUploader(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf,image/*"
          className="w-full mb-4 text-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload & Store on Blockchain"}
        </button>

        {result && !result.error && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-green-700 mb-1">✅ Stored on Blockchain</p>
            <p><span className="font-medium">Receipt ID:</span> {result.receipt_id}</p>
            <p className="break-all"><span className="font-medium">Hash:</span> {result.file_hash}</p>
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/qr/${result.receipt_id}`}
              alt="QR Code"
              className="mt-4 w-36 h-36 mx-auto"
            />
            <p className="text-center text-xs text-gray-400 mt-1">Scan to verify</p>
          </div>
        )}
        {result?.error && (
          <p className="mt-4 text-red-500 text-sm">{result.error}</p>
        )}
      </div>
    </div>
  );
}
```

#### Step 4: Verify Page (`pages/verify.js`)
```jsx
import { useState } from "react";
import api from "../lib/api";

export default function VerifyPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/verify", formData);
      setResult(data);
    } catch (err) {
      setResult({ status: "ERROR — Could not reach backend" });
    } finally {
      setLoading(false);
    }
  };

  const isValid = result?.status?.includes("VALID ✅");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">🔍 Verify Receipt</h1>

        <input
          type="file"
          accept=".pdf,image/*"
          className="w-full mb-4 text-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Against Blockchain"}
        </button>

        {result && (
          <div className={`mt-6 rounded-lg p-4 text-sm border ${
            isValid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <p className="font-bold text-lg mb-2">{result.status}</p>
            {isValid && (
              <>
                <p><span className="font-medium">Receipt ID:</span> {result.receipt_id}</p>
                <p><span className="font-medium">Uploaded by:</span> {result.uploader}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Step 5: Add navigation (`pages/_app.js`)
```jsx
import Link from "next/link";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <nav className="bg-white shadow-sm px-8 py-4 flex gap-6 text-sm font-medium">
        <Link href="/" className="text-blue-600 hover:underline">Upload</Link>
        <Link href="/verify" className="text-indigo-600 hover:underline">Verify</Link>
      </nav>
      <Component {...pageProps} />
    </>
  );
}
```

#### Key UI elements for the demo:
- ✅ Green result card with Receipt ID, uploader name, and QR code — shown after upload
- ❌ Red "INVALID / TAMPERED" card — shown when verifying a modified file
- Clean two-page layout with top navigation

---

### 🔷 MEMBER 5 — Docker & DevOps (`/`)

#### Step 1: `Dockerfile.backend`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Step 2: `Dockerfile.blockchain`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY blockchain/ .
RUN pip install fastapi uvicorn
CMD ["uvicorn", "node:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### Step 3: `docker-compose.yml`
```yaml
version: "3.9"
services:
  blockchain:
    build:
      context: .
      dockerfile: Dockerfile.blockchain
    ports:
      - "8001:8001"
    networks:
      - app-net

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env          # R2 credentials loaded here
    depends_on:
      - blockchain
    networks:
      - app-net

  frontend:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: sh -c "npm install && npm run dev"
    ports:
      - "3000:3000"
    networks:
      - app-net

networks:
  app-net:
```

#### Step 4: Test the full stack
```bash
docker compose up --build
# Backend:    http://localhost:8000
# Frontend:   http://localhost:3000
# Blockchain: http://localhost:8001
# Storage:    Cloudflare R2 (external — check via Cloudflare dashboard)
```

---

## 🎬 Demo Script (Thursday)

### Who does what during the demo:

| Step | Action | Who Presents |
|------|--------|--------------|
| 1 | `docker compose up` — show all services starting | Member 5 |
| 2 | Open frontend, upload a sample receipt PDF | Member 4 |
| 3 | Show response: receipt ID, hash, "Stored on Blockchain" | Member 2 |
| 4 | Show QR code generated for the receipt | Member 3 |
| 5 | Verify the same file → show ✅ VALID | Member 3 |
| 6 | Open the file in a text editor, change one byte, re-upload for verify → show ❌ INVALID | Member 1 |
| 7 | Explain the blockchain chain structure (`/chain` endpoint) | Member 1 |
| 8 | Open Cloudflare R2 dashboard → show uploaded receipt files in bucket | Member 3 |

### Key talking points:
- "We store only the SHA-256 hash on-chain, not the file itself — privacy by design"
- "Changing even one character in the receipt changes the hash completely — tamper detection"
- "Each block contains the previous block's hash — breaking the chain is detectable"
- "Docker Compose lets us spin up all services with one command — R2 is external so no storage container needed"
- "Using Cloudflare R2 gives us zero-egress-fee cloud storage with an S3-compatible API"

---

## ⚠️ Risk & Contingency

| Risk | Mitigation |
|------|-----------|
| R2 credentials misconfigured | Double-check `.env` file; test with a standalone `boto3` script before integrating |
| R2 bucket permissions error | Ensure API token has Read & Write on the correct bucket |
| Docker networking issues | Run services locally without Docker for demo |
| Frontend not ready | Use FastAPI's built-in `/docs` (Swagger UI) for demo — it works perfectly |
| Blockchain node crashes | Use an in-memory singleton instead of separate service |
| Short on time on frontend | Use FastAPI's `/docs` (Swagger UI) for demo — fully functional without any frontend |

---

## ✅ Daily Checklist

### Sunday EOD
- [ ] Repo created on GitHub, everyone cloned
- [ ] Blockchain `block.py` and `blockchain.py` working (Member 1)
- [ ] FastAPI app boots with `uvicorn` (Member 2)

### Monday EOD
- [ ] `POST /upload` returns hash + receipt ID
- [ ] Hash stored in blockchain
- [ ] File saved in Cloudflare R2

### Tuesday EOD
- [ ] `POST /verify` returns VALID/INVALID
- [ ] QR code endpoint working
- [ ] Next.js upload page (`/`) working end-to-end
- [ ] Next.js verify page (`/verify`) shows green/red result card

### Wednesday EOD
- [ ] `docker compose up` starts everything cleanly
- [ ] Full upload → verify flow tested 3+ times
- [ ] Tamper demo tested (modify file → INVALID)
- [ ] Demo script rehearsed once

### Thursday
- [ ] Demo ready 30 min before presentation
- [ ] Each member knows their part
- [ ] Have sample receipts (PDFs/images) ready to upload

---

## 📦 Sample Files to Prepare for Demo
- 2-3 sample PDF receipts (can be fake bills made in Word)
- A "tampered" version of one receipt (open in Notepad, change one character, save)
- These should be tested the night before

---

*Good luck — this is a solid, demonstrable project. The tamper detection moment in the demo is always impressive to instructors!* 🚀
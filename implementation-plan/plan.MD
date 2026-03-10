# 🔗 Digital Bill / Receipt Verification System
## Production-Level Plan — Full Stack Rebuild

> **Team Size:** 5 Members | **Stack:** Python (FastAPI) + Custom Blockchain + PostgreSQL + Cloudflare R2 + Next.js 16 + Better Auth + Docker + WebSockets + Redis

---

## 🧱 Architecture Overview

```
                        ┌──────────────────────────────────────┐
                        │          Next.js 16 Frontend          │
                        │  Upload │ Verify │ Dashboard │ Login  │
                        └──────────────┬───────────────────────┘
                                       │ HTTP + WebSocket
                                       │ Better Auth session (cookie)
                        ┌──────────────▼───────────────────────┐
                        │           FastAPI Backend              │
                        │  /upload │ /verify │ /chain │ /admin  │
                        │     JWT middleware on protected routes │
                        └──┬──────────┬───────────┬────────────┘
                           │          │           │
              ┌────────────▼──┐  ┌────▼────┐  ┌──▼──────────┐
              │  Blockchain    │  │PostgreSQL│  │Cloudflare R2│
              │  Node (FastAPI)│  │  + Auth  │  │  (Storage)  │
              └───────────────┘  │  Tables  │  └─────────────┘
                           │     └─────────┘
                        ┌──▼──────┐
                        │  Redis   │
                        │ (PubSub) │
                        └──────────┘
```

---

## 🔐 Authentication Strategy (Better Auth)

### Route Protection Matrix

| Route / Endpoint | Public | Admin Only |
|------------------|--------|------------|
| `POST /api/upload` | ✅ | — |
| `POST /api/verify` | ✅ | — |
| `GET /api/verify/:id` | ✅ | — |
| `GET /api/qr/:id` | ✅ | — |
| `GET /api/thumbnail/:id` | ✅ | — |
| `GET /api/chain` | — | ✅ |
| `GET /api/chain/stats` | — | ✅ |
| `DELETE /api/chain/reset` | — | ✅ |
| `/dashboard` page | — | ✅ |
| `/admin` page | — | ✅ |
| `/login` page | ✅ | — |

### Why Better Auth over NextAuth
- **Native Postgres support** — sessions stored directly in your existing DB, no adapter needed
- **Built-in role system** — `admin` plugin out of the box, no manual RBAC wiring
- **End-to-end TypeScript** — fully typed client hooks for Next.js App Router
- **Faster setup** — single `auth.ts` config file handles everything
- **App Router native** — no legacy Pages Router hacks required

---

## 📁 Production Folder Structure

```
receipt-verification/
├── blockchain/
│   ├── block.py                  # Block class with Merkle root
│   ├── blockchain.py             # Thread-safe blockchain engine
│   ├── node.py                   # FastAPI node — exposes chain API
│   └── requirements.txt
├── backend/
│   ├── main.py                   # FastAPI app with CORS, lifespan
│   ├── routes/
│   │   ├── upload.py             # POST /upload (multi-format, public)
│   │   ├── verify.py             # POST /verify + GET /verify/{id} (public)
│   │   ├── chain.py              # GET /chain, /stats, DELETE /reset (admin only)
│   │   └── ws.py                 # WebSocket /ws/transactions (admin only)
│   ├── auth/
│   │   └── middleware.py         # JWT verification from Better Auth sessions
│   ├── models.py                 # SQLAlchemy + PostgreSQL models
│   ├── database.py               # Async DB session
│   ├── storage.py                # Cloudflare R2 (boto3, async)
│   ├── utils/
│   │   ├── hash.py               # SHA-256 + file fingerprinting
│   │   ├── image_proc.py         # PDF/image normalization
│   │   └── qr.py                 # QR generation utility
│   └── requirements.txt
├── frontend/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Upload page (public)
│   │   ├── verify/page.tsx       # Verify page (public)
│   │   ├── verify/[id]/page.tsx  # QR scan landing page (public)
│   │   ├── login/page.tsx        # Google / GitHub OAuth login
│   │   ├── dashboard/page.tsx    # Live blockchain dashboard (admin)
│   │   ├── admin/page.tsx        # Chain management (admin)
│   │   └── api/auth/[...all]/route.ts  # Better Auth handler
│   ├── components/
│   │   ├── UploadZone.tsx        # Drag & drop multi-format
│   │   ├── VerifyResult.tsx      # Valid/Invalid result card
│   │   ├── BlockchainViewer.tsx  # Live chain visualizer
│   │   ├── TxFeed.tsx            # Real-time transaction feed
│   │   ├── StatsBar.tsx          # Blocks, Tx, Hash rate stats
│   │   ├── QRModal.tsx           # QR code modal
│   │   └── AuthGuard.tsx         # Session-aware navbar
│   ├── lib/
│   │   ├── auth.ts               # Better Auth server config
│   │   ├── auth-client.ts        # Better Auth client hooks
│   │   ├── api.ts                # Axios instance with auth interceptor
│   │   └── useWebSocket.ts       # WS hook for real-time
│   ├── middleware.ts             # Next.js route protection
│   └── package.json
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.blockchain
├── Dockerfile.frontend
└── README.md
```

---

## 👥 Team Member Role Assignments

| Member | Role | Owns |
|--------|------|------|
| **Member 1** | Blockchain Engineer | Merkle tree blocks, thread-safe chain, `/chain` endpoints, tamper proof logic |
| **Member 2** | Backend Developer | FastAPI app, PostgreSQL models, async upload pipeline, `require_admin` middleware |
| **Member 3** | Storage & Verification | R2 client, multi-format receipt processing, verify endpoint, QR code |
| **Member 4** | Frontend Developer | Next.js 16, Better Auth setup, Dashboard, live TX feed, upload/verify UI |
| **Member 5** | DevOps & Integration | Docker, Redis, nginx, load testing, final integration & demo prep |

---

## 📅 Day-by-Day Schedule

### ✅ Day 1 — Sunday: Setup + Production Blockchain Core
**Goal:** Repo running locally. Production-grade blockchain logic complete.

- [ ] Repo init, branching strategy agreed (`main`, `dev`, feature branches)
- [ ] Member 1: `block.py`, `blockchain.py`, `node.py` with thread lock + Merkle root
- [ ] Member 2: FastAPI skeleton + PostgreSQL connection + `models.py`
- [ ] Member 3: Cloudflare R2 bucket created, `storage.py` working
- [ ] Member 4: Next.js 16 scaffolded with Tailwind + shadcn/ui + Better Auth installed
- [ ] Member 5: `docker-compose.yml` skeleton, Redis + Postgres containers spinning

### ✅ Day 2 — Monday: Full Backend API + Storage + DB
**Goal:** Upload pipeline end-to-end. Files in R2. Hashes in DB + chain.

- [ ] `POST /upload` working with PDF, PNG, JPG, JPEG support
- [ ] Hash stored in PostgreSQL + blockchain simultaneously
- [ ] R2 upload confirmed via Cloudflare dashboard
- [ ] Redis pub/sub broadcasting new transactions
- [ ] `GET /chain` returning full chain with stats

### ✅ Day 3 — Tuesday: Auth + Frontend + Dashboard + WebSocket
**Goal:** Better Auth live. Full UI working. Dashboard protected behind admin login.

- [ ] Better Auth configured — Google + GitHub OAuth working
- [ ] `/login` page functional with both providers
- [ ] Next.js `middleware.ts` protecting `/dashboard` and `/admin`
- [ ] FastAPI `require_admin` middleware protecting `/api/chain/*`
- [ ] WebSocket `/ws/transactions` with token verification
- [ ] Upload page: drag-drop, thumbnail preview, QR code (public)
- [ ] Verify page: VALID ✅ / INVALID ❌ card (public)
- [ ] Dashboard: live TX feed + stats + blockchain visualizer (admin)
- [ ] First team member promoted to admin via `make-admin.ts`

### ✅ Day 4 — Wednesday: Docker, Performance & Integration
**Goal:** `docker compose up` starts everything. Load tested. Demo rehearsed.

- [ ] All services in Docker with health checks
- [ ] nginx reverse proxy configured
- [ ] Load test: 100+ simultaneous uploads handled
- [ ] Full flow tested 5+ times (upload → verify → tamper → invalidate)
- [ ] Auth flow tested: login → dashboard access → logout → redirect to `/login`
- [ ] Demo script rehearsed with all 5 members

### ✅ Day 5 — Thursday: Demo Day 🚀
**Goal:** Flawless, impressive demonstration.

---

## 🔷 MEMBER 1 — Production Blockchain Core (`/blockchain/`)

### `block.py` — Block with Merkle Root
```python
import hashlib, json, time
from typing import List, Dict

class MerkleTree:
    @staticmethod
    def compute_root(transactions: List[Dict]) -> str:
        if not transactions:
            return hashlib.sha256(b"empty").hexdigest()
        leaves = [hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest()
                  for tx in transactions]
        while len(leaves) > 1:
            if len(leaves) % 2 != 0:
                leaves.append(leaves[-1])
            leaves = [hashlib.sha256((leaves[i] + leaves[i+1]).encode()).hexdigest()
                      for i in range(0, len(leaves), 2)]
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
            "tx_count": len(self.transactions),
        }
```

### `blockchain.py` — Thread-Safe, High-Throughput Engine
```python
import threading
from block import Block
from typing import List, Dict, Optional
import time

class Blockchain:
    BATCH_SIZE = 10
    BATCH_TIMEOUT = 5.0

    def __init__(self):
        self._lock = threading.RLock()
        self.chain: List[Block] = []
        self._pending: List[Dict] = []
        self._stats = {"total_tx": 0, "blocks_mined": 0, "start_time": time.time()}
        self._create_genesis_block()
        self._timer = threading.Timer(self.BATCH_TIMEOUT, self._auto_seal)
        self._timer.daemon = True
        self._timer.start()

    def _create_genesis_block(self):
        self.chain.append(Block(0, [], "0"))

    def add_transaction(self, receipt_id: str, file_hash: str, uploader: str,
                        filename: str, file_size: int) -> Dict:
        tx = {"receipt_id": receipt_id, "file_hash": file_hash, "uploader": uploader,
              "filename": filename, "file_size": file_size, "timestamp": time.time()}
        with self._lock:
            self._pending.append(tx)
            self._stats["total_tx"] += 1
            if len(self._pending) >= self.BATCH_SIZE:
                self._seal_block()
        return tx

    def _seal_block(self):
        if not self._pending:
            return
        block = Block(len(self.chain), self._pending[:], self.chain[-1].hash)
        self.chain.append(block)
        self._pending.clear()
        self._stats["blocks_mined"] += 1

    def _auto_seal(self):
        with self._lock:
            if self._pending:
                self._seal_block()
        self._timer = threading.Timer(self.BATCH_TIMEOUT, self._auto_seal)
        self._timer.daemon = True
        self._timer.start()

    def find_hash(self, file_hash: str) -> Optional[Dict]:
        with self._lock:
            for block in reversed(self.chain):
                for tx in block.transactions:
                    if tx["file_hash"] == file_hash:
                        return {**tx, "block_index": block.index, "block_hash": block.hash}
            for tx in self._pending:
                if tx["file_hash"] == file_hash:
                    return {**tx, "block_index": "pending", "block_hash": None}
        return None

    def is_valid(self) -> bool:
        with self._lock:
            for i in range(1, len(self.chain)):
                curr, prev = self.chain[i], self.chain[i - 1]
                if curr.previous_hash != prev.hash or curr.hash != curr.compute_hash():
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
                "tx_per_second": round(self._stats["total_tx"] / max(uptime, 1), 2),
            }

    def get_recent_blocks(self, limit: int = 10) -> List[Dict]:
        with self._lock:
            return [b.to_dict() for b in reversed(self.chain[-limit:])]
```

### `node.py` — FastAPI Blockchain Node
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from blockchain import Blockchain
from pydantic import BaseModel
import redis.asyncio as aioredis, json, os

app = FastAPI(title="Blockchain Node", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

chain = Blockchain()
redis_client = None

@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"))

class TxPayload(BaseModel):
    receipt_id: str
    file_hash: str
    uploader: str
    filename: str
    file_size: int

@app.post("/chain/add")
async def add_transaction(payload: TxPayload):
    tx = chain.add_transaction(**payload.dict())
    if redis_client:
        await redis_client.publish("transactions", json.dumps(tx))
    return {"status": "accepted", "transaction": tx}

@app.get("/chain/find")
def find_hash(hash: str):
    return chain.find_hash(hash) or {"found": False}

@app.get("/chain")
def get_chain(limit: int = 20):
    return {"blocks": chain.get_recent_blocks(limit), "stats": chain.get_stats()}

@app.get("/chain/stats")
def get_stats():
    return chain.get_stats()

@app.get("/chain/valid")
def validate():
    return {"valid": chain.is_valid()}
```

---

## 🔷 MEMBER 2 — Backend API + PostgreSQL (`/backend/`)

### `requirements.txt`
```
fastapi>=0.111.0
uvicorn[standard]
python-multipart
sqlalchemy[asyncio]
asyncpg
aiofiles
boto3
qrcode[pil]
Pillow
PyMuPDF
python-dotenv
redis[asyncio]
httpx
python-jose[cryptography]
pydantic-settings
```

### `database.py`
```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@postgres:5432/receipts")
engine = create_async_engine(DATABASE_URL, pool_size=20, max_overflow=40)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### `models.py`
```python
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, BigInteger, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from database import Base
import uuid

class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id = Column(String(64), unique=True, nullable=False, index=True)
    file_hash = Column(String(64), unique=True, nullable=False, index=True)
    uploader = Column(String(128), nullable=False)
    filename = Column(String(255))
    file_size = Column(BigInteger)
    file_type = Column(String(32))
    r2_key = Column(String(512))
    thumbnail_key = Column(String(512))
    block_index = Column(Integer, nullable=True)
    block_hash = Column(String(64), nullable=True)
    timestamp = Column(Float, nullable=False)
    is_verified = Column(Boolean, default=False)
    verify_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    __table_args__ = (
        Index("idx_receipt_hash", "file_hash"),
        Index("idx_receipt_uploader", "uploader"),
        Index("idx_receipt_timestamp", "timestamp"),
    )
```

### `auth/middleware.py` — FastAPI Admin Guard
```python
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx, os

security = HTTPBearer()

async def require_admin(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Better Auth stores sessions in Postgres and issues a session token.
    The frontend passes this token as a Bearer header for FastAPI calls.
    FastAPI verifies it by calling Better Auth's /api/auth/get-session endpoint.
    """
    token = credentials.credentials
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{os.getenv('FRONTEND_URL', 'http://frontend:3000')}/api/auth/get-session",
            headers={"Authorization": f"Bearer {token}"}
        )
    if resp.status_code != 200:
        raise HTTPException(401, "Unauthorized — invalid session")
    user = resp.json().get("user", {})
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user
```

### `routes/chain.py` — Admin-Only Chain Routes
```python
from fastapi import APIRouter, Depends
from auth.middleware import require_admin
import httpx, os

router = APIRouter()
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")

@router.get("/chain", dependencies=[Depends(require_admin)])
async def get_chain(limit: int = 20):
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BLOCKCHAIN_URL}/chain", params={"limit": limit})
    return r.json()

@router.get("/chain/stats", dependencies=[Depends(require_admin)])
async def get_stats():
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BLOCKCHAIN_URL}/chain/stats")
    return r.json()

@router.get("/chain/valid", dependencies=[Depends(require_admin)])
async def validate_chain():
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BLOCKCHAIN_URL}/chain/valid")
    return r.json()
```

### `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import upload, verify, chain, ws
from database import engine, Base
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Receipt Verification API", version="2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,   # Required for Better Auth cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(verify.router, prefix="/api", tags=["Verify"])
app.include_router(chain.router, prefix="/api", tags=["Chain"])
app.include_router(ws.router, tags=["WebSocket"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## 🔷 MEMBER 3 — Storage, Multi-Format Processing & Verification

### `utils/image_proc.py`
```python
import fitz
from PIL import Image
import io
from pathlib import Path

def detect_type(file_bytes: bytes, filename: str) -> str:
    if file_bytes[:4] == b"%PDF": return "pdf"
    if file_bytes[:8] == b"\x89PNG\r\n\x1a\n": return "png"
    if file_bytes[:3] == b"\xff\xd8\xff": return "jpeg"
    return Path(filename).suffix.lstrip(".").lower()

def generate_thumbnail(file_bytes: bytes, file_type: str, size=(256, 256)) -> bytes:
    try:
        if file_type == "pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            pix = doc.load_page(0).get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
        else:
            img = Image.open(io.BytesIO(file_bytes))
        img.thumbnail(size, Image.LANCZOS)
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=80)
        return buf.getvalue()
    except Exception:
        return b""

def normalize_for_hashing(file_bytes: bytes, file_type: str) -> bytes:
    """Canonicalize images to PNG before hashing — prevents format-conversion duplicates."""
    if file_type == "pdf":
        return file_bytes
    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        return file_bytes
```

### `storage.py` — Cloudflare R2 Async
```python
import boto3, os, asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from dotenv import load_dotenv

load_dotenv()
_executor = ThreadPoolExecutor(max_workers=8)
s3 = boto3.client("s3",
    endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
    region_name="auto",
)
BUCKET = os.getenv("R2_BUCKET", "receipts")

async def upload_file_async(file_bytes: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_executor,
        partial(s3.put_object, Bucket=BUCKET, Key=key, Body=file_bytes, ContentType=content_type))
    return key

async def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor,
        partial(s3.generate_presigned_url, "get_object",
                Params={"Bucket": BUCKET, "Key": key}, ExpiresIn=expires_in))
```

---

## 🔷 MEMBER 4 — Next.js 16 Frontend + Better Auth

### Step 1: Install Dependencies
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install better-auth @better-auth/client
npm install axios lucide-react recharts framer-motion
npx shadcn@latest init
```

### Step 2: `lib/auth.ts` — Better Auth Server Config
```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [admin()],   // Enables role field: "admin" | "user"
  session: {
    expiresIn: 60 * 60 * 24 * 7,       // 7 days
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});
```

### Step 3: `lib/auth-client.ts` — Client Hooks
```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
```

### Step 4: `app/api/auth/[...all]/route.ts`
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Step 5: `middleware.ts` — Protect Dashboard & Admin
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED = ["/dashboard", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some(r => pathname.startsWith(r))) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
    headers: { cookie: request.headers.get("cookie") || "" },
  });

  if (!sessionRes.ok) return NextResponse.redirect(new URL("/login", request.url));

  const session = await sessionRes.json();
  if (session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
```

### Step 6: `app/login/page.tsx`
```tsx
"use client";
import { signIn } from "@/lib/auth-client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: "google" | "github") => {
    setLoading(provider);
    await signIn.social({ provider, callbackURL: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">⛓️ ChainVerify</h1>
          <p className="text-gray-400 text-sm">Admin access only. Sign in to continue.</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => handleSignIn("google")} disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900
                       font-semibold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50">
            {loading === "google" ? "Redirecting..." : "Continue with Google"}
          </button>
          <button onClick={() => handleSignIn("github")} disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white
                       font-semibold py-3 rounded-xl hover:bg-gray-700 transition disabled:opacity-50">
            {loading === "github" ? "Redirecting..." : "Continue with GitHub"}
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-8">
          Receipt upload and verification are available publicly without login.
        </p>
      </div>
    </div>
  );
}
```

### Step 7: `components/AuthGuard.tsx` — Session-Aware Navbar
```tsx
"use client";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";

export default function AuthGuard() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
      <div className="flex gap-6 text-sm font-medium">
        <Link href="/" className="text-blue-400 hover:text-blue-300">Upload</Link>
        <Link href="/verify" className="text-indigo-400 hover:text-indigo-300">Verify</Link>
        {isAdmin && (
          <>
            <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">Dashboard</Link>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300">Admin</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <span className="text-gray-400 text-sm">{session.user.email}</span>
            <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
              {session.user.role}
            </span>
            <button onClick={() => signOut()} className="text-sm text-red-400 hover:text-red-300">
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login"
            className="text-sm text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">
            Admin Login
          </Link>
        )}
      </div>
    </nav>
  );
}
```

### Step 8: `lib/api.ts` — Axios with Auth Interceptor
```typescript
import axios from "axios";
import { getSession } from "@/lib/auth-client";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

// Attach Better Auth session token for admin API calls to FastAPI
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.session?.token) {
    config.headers.Authorization = `Bearer ${session.session.token}`;
  }
  return config;
});

export default api;
```

### Step 9: `lib/useWebSocket.ts` — Authenticated WS Hook
```typescript
import { useEffect, useRef, useState } from "react";
import { getSession } from "@/lib/auth-client";

export function useWebSocket(url: string, maxMessages = 50) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      const session = await getSession();
      const token = session?.session?.token;
      if (!token) return;

      // Pass token as query param (WebSocket can't set headers)
      ws.current = new WebSocket(`${url}?token=${token}`);
      ws.current.onopen = () => setConnected(true);
      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [data, ...prev].slice(0, maxMessages));
      };
    };
    connect();
    return () => ws.current?.close();
  }, [url]);

  return { messages, connected };
}
```

### Step 10: Promote First Admin
```typescript
// scripts/make-admin.ts — run once after first login
// Usage: npx ts-node scripts/make-admin.ts your@email.com
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function makeAdmin(email: string) {
  const { rowCount } = await pool.query(
    `UPDATE "user" SET role = 'admin' WHERE email = $1`, [email]
  );
  console.log(rowCount ? `✅ ${email} is now admin` : `❌ User not found: ${email}`);
  await pool.end();
}

makeAdmin(process.argv[2]);
```

### Environment Variables (`frontend/.env.local`)
```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/transactions

# Better Auth
BETTER_AUTH_SECRET=your-32-char-random-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth — console.developers.google.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth — github.com/settings/developers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Shared DB
DATABASE_URL=postgresql://receipts:receipts_secret@localhost:5432/receipts
```

---

## 🔷 MEMBER 5 — Docker, Redis, nginx & Performance

### `docker-compose.yml`
```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: receipts
      POSTGRES_PASSWORD: receipts_secret
      POSTGRES_DB: receipts
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks: [app-net]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U receipts"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks: [app-net]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  blockchain:
    build:
      context: .
      dockerfile: Dockerfile.blockchain
    environment:
      REDIS_URL: redis://redis:6379
    ports:
      - "8001:8001"
    networks: [app-net]
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgresql+asyncpg://receipts:receipts_secret@postgres:5432/receipts
      REDIS_URL: redis://redis:6379
      BLOCKCHAIN_URL: http://blockchain:8001
      FRONTEND_URL: http://frontend:3000
    ports:
      - "8000:8000"
    networks: [app-net]
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      blockchain:
        condition: service_started

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    env_file:
      - ./frontend/.env.local
    ports:
      - "3000:3000"
    networks: [app-net]
    restart: unless-stopped
    depends_on: [backend]

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    networks: [app-net]
    depends_on: [backend, frontend]

volumes:
  pg_data:

networks:
  app-net:
    driver: bridge
```

### `routes/ws.py` — Authenticated WebSocket
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis.asyncio as aioredis
import httpx, json, os

router = APIRouter()
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")

@router.websocket("/ws/transactions")
async def ws_transactions(websocket: WebSocket, token: str = Query(...)):
    # Verify admin session before accepting connection
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{FRONTEND_URL}/api/auth/get-session",
                                headers={"Authorization": f"Bearer {token}"})
    if resp.status_code != 200 or resp.json().get("user", {}).get("role") != "admin":
        await websocket.close(code=4001)
        return

    await websocket.accept()
    r = aioredis.from_url(REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.subscribe("transactions")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"].decode())
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe("transactions")
        await r.close()
```

### Load Testing (Wednesday)
```bash
pip install locust

# locustfile.py
from locust import HttpUser, task, between

class PublicUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(3)
    def upload_receipt(self):
        self.client.post("/api/upload",
            files={"file": ("test.pdf", b"%PDF fake content", "application/pdf")},
            data={"uploader": "load_test"})

    @task(1)
    def verify_receipt(self):
        self.client.post("/api/verify",
            files={"file": ("test.pdf", b"%PDF fake content", "application/pdf")})

# Run: locust -f locustfile.py --host http://localhost:8000 --users 100 --spawn-rate 10
```

---

## 🎬 Demo Script (Thursday)

| Step | Action | WOW Factor | Who |
|------|--------|-----------|-----|
| 1 | `docker compose up` — 6 services start cleanly | DevOps magic | M5 |
| 2 | Open `/` — public upload page, zero login required | Clean public UX | M4 |
| 3 | Upload a PDF receipt — thumbnail + QR code appear instantly | Slick upload flow | M3 |
| 4 | Click "Admin Login" → Google OAuth → redirect to Dashboard | Seamless auth | M4 |
| 5 | Dashboard loads — TX feed live, block counter ticking | Real-time blockchain | M4 |
| 6 | Upload 10 receipts rapidly — blocks fill up in the visualizer | Batching in action | M2 |
| 7 | Verify original PDF → ✅ VALID with full metadata | End-to-end proof | M3 |
| 8 | Tamper PDF (one byte) → re-verify → ❌ INVALID | Tamper detection 🔥 | M1 |
| 9 | Hit `/api/chain` without token → 401. Login → chain visible | Auth working | M2 |
| 10 | Open Cloudflare R2 dashboard → files + thumbnails in bucket | Cloud storage proof | M3 |
| 11 | Load test: 100 users → TX/sec chart spikes live on dashboard | Production scale | M5 |
| 12 | Sign out → try `/dashboard` → redirect to `/login` | Security tight | M4 |

### Key Talking Points
- **"Better Auth"** — modern OAuth (Google + GitHub), sessions in Postgres, built-in admin roles, zero config overhead
- **"Public by design"** — anyone can upload/verify; only blockchain internals are admin-gated
- **"SHA-256 + Merkle tree"** — cryptographic proofs on-chain, actual files in R2 — privacy by design
- **"Batch processing"** — 10 TXs per block, auto-sealed every 5 seconds — high throughput by design
- **"Thread-safe blockchain"** — RLock ensures zero race conditions under load
- **"PostgreSQL + Redis"** — production-grade persistence + real-time pub/sub
- **"Multi-format"** — PDFs, JPEGs, PNGs hash-normalized identically to prevent false positives
- **"WebSocket feed"** — Redis → FastAPI → Next.js in real time, zero polling

---

## ⚠️ Risk & Contingency

| Risk | Mitigation |
|------|-----------|
| OAuth redirect URI mismatch | Set `http://localhost:3000/api/auth/callback/google` in Google Console before Tuesday |
| Better Auth session not reaching FastAPI | Test `/api/auth/get-session` manually with curl before integration |
| No admin user for demo | Run `make-admin.ts` the night before, verify login works |
| R2 credentials fail | Pre-test with standalone `boto3` script; fall back to local disk |
| PostgreSQL slow to start | `depends_on: condition: service_healthy` in compose |
| WebSocket disconnects | Auto-reconnect with 3s delay in `useWebSocket` hook |
| Frontend build fails | `docker-compose.override.yml` with `npm run dev` fallback |
| Blockchain node crashes | `restart: unless-stopped` in compose |
| Load test overwhelms demo machine | Cap at 50 users; have pre-recorded video as fallback |

---

## ✅ Daily Checklist

### Sunday EOD
- [ ] GitHub repo + branch strategy set
- [ ] `block.py`, `blockchain.py` with Merkle + thread lock (M1)
- [ ] FastAPI boots, PostgreSQL connected, tables auto-created (M2)
- [ ] R2 bucket created, standalone upload test passing (M3)
- [ ] Next.js 16 scaffolded + Better Auth installed (M4)
- [ ] Redis + Postgres containers healthy in Docker (M5)

### Monday EOD
- [ ] `POST /upload` handles PDF, JPEG, PNG, JPG (M3)
- [ ] File in R2 + hash in PostgreSQL + TX in blockchain (M2/M3)
- [ ] Redis pub/sub broadcasting new transactions (M1)
- [ ] `GET /chain` and `GET /chain/stats` working (M1)

### Tuesday EOD
- [ ] Better Auth — Google + GitHub OAuth working (M4)
- [ ] `/login` page functional (M4)
- [ ] Next.js middleware protecting `/dashboard` + `/admin` (M4)
- [ ] FastAPI `require_admin` guarding `/api/chain/*` (M2)
- [ ] WebSocket with token verification working (M5)
- [ ] Dashboard: live TX feed + stats + blockchain visualizer (M4)
- [ ] Upload + Verify pages complete (M4)
- [ ] First team member promoted to admin via `make-admin.ts` (M4)

### Wednesday EOD
- [ ] `docker compose up --build` starts all 6 services cleanly (M5)
- [ ] Full flow tested 5+ times end-to-end (all)
- [ ] Auth flow tested: login → dashboard → logout → redirect (M4)
- [ ] Tamper demo tested and reliable (M1)
- [ ] Load test run: 50+ concurrent users (M5)
- [ ] Demo rehearsed with all 5 members (all)

### Thursday
- [ ] Sample receipts prepared (3× PDF, 2× JPEG, 1× PNG)
- [ ] Tampered receipt ready and tested
- [ ] Admin account verified — login working
- [ ] Demo run 30 min before presentation
- [ ] Each member knows exactly what to click and say

---

## 📦 Sample Files for Demo
- `receipt_amazon.pdf` — fake Amazon order PDF
- `receipt_electricity_bill.jpg` — scanned bill image
- `receipt_restaurant.png` — restaurant receipt PNG
- `receipt_amazon_TAMPERED.pdf` — same file, one byte changed in a text editor
- All files must be tested the night before — upload each, verify each, confirm tamper fails

---

*Production-grade auth, real-time blockchain dashboard, multi-format receipts, load-tested infrastructure, and a login screen that impresses from the first click. Go build something great.* 🚀
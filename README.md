<div align="center">

# 🔮 Origyn

### Enterprise Document Verification, Anchored On-Chain

**Every document has an origin. Origyn proves it.**

---

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)

</div>

---

## 🧭 The Problem

Receipts, invoices, and business documents are trivially easy to forge. Open any PDF, edit it, save it — there is no way for the recipient to know whether what they received is genuine. This enables:

- Financial fraud via fake invoices
- Fake warranty claims using tampered receipts
- Manipulated tax documents
- Counterfeit business records

## 💡 The Solution

**Origyn** binds every uploaded document to a **SHA-256 cryptographic fingerprint** and permanently records it on a **custom-built blockchain**. Once anchored, the record is immutable. To verify a document, the system re-computes the hash and looks it up on the chain — any modification, no matter how small, produces a completely different hash and fails verification.

> ✅ **If the hashes match → Document is genuine and untampered**
> ❌ **If the hashes differ → Document has been modified or is a fake**

---

## 🏗️ Architecture Overview

```
                         ┌─────────────────────────────────────────┐
                         │              USER (Browser)              │
                         └─────────────────┬───────────────────────┘
                                           │ HTTP / WebSocket
                                           ▼
                         ┌─────────────────────────────────────────┐
                         │         NGINX  ·  Port 80               │
                         │  Reverse Proxy · Rate Limiter           │
                         │  Security Headers · Gzip Compression    │
                         └─────────┬───────────────────┬───────────┘
                                   │                   │
                        ┌──────────▼──────┐   ┌────────▼──────────┐
                        │   Frontend      │   │   Backend API      │
                        │   Next.js 14    │   │   FastAPI          │
                        │   Port 3000     │   │   Port 8000        │
                        └─────────────────┘   └────────┬──────────┘
                                                        │
                          ┌─────────────────────────────┤
                          │                             │
                   ┌──────▼──────┐             ┌────────▼──────┐
                   │  Blockchain │             │     Redis      │
                   │  Node       │             │  Pub/Sub·Cache │
                   │  Port 8001  │             │  Port 6379     │
                   └──────┬──────┘             └───────────────┘
                          │ Persist state
                   ┌──────▼──────┐             ┌───────────────┐
                   │    Redis    │             │  PostgreSQL    │
                   │ (chain JSON)│             │  Port 5432    │
                   └─────────────┘             │  Auth Tables  │
                                               └───────────────┘

                                               ┌───────────────┐
                                               │ Cloudflare R2 │
                                               │ Object Storage│
                                               └───────────────┘
```

All six services run in **Docker containers** on a shared private bridge network (`app-net`). The outside world only reaches port 80 (Nginx). All inter-service communication uses Docker's internal DNS (e.g., `http://blockchain:8001`).

---

## 🧰 Tech Stack

### Backend & Blockchain
| Technology | Role |
|---|---|
| **Python 3.11** | Primary language for backend and blockchain node |
| **FastAPI** | Async REST API framework with automatic OpenAPI docs |
| **Uvicorn** | Production-grade ASGI server |
| **Redis 7** | Pub/Sub event bus · blockchain state persistence · activity log |
| **SQLAlchemy** | ORM for PostgreSQL auth database |
| **httpx** | Async HTTP client for backend-to-blockchain communication |
| **boto3** | S3-compatible SDK for Cloudflare R2 file storage |
| **PyPDF2** | PDF text extraction for content-aware hashing |
| **hashlib** | SHA-256 cryptographic fingerprinting |
| **qrcode** | QR code generation for receipt verification links |

### Frontend
| Technology | Role |
|---|---|
| **Next.js 14** | React meta-framework with server components and app router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **Framer Motion** | Smooth page and component animations |
| **Axios** | HTTP client with auth-header interceptor |
| **Better Auth** | Full-stack auth: Google/GitHub OAuth, admin roles, sessions |
| **react-dropzone** | Drag-and-drop file upload UI |

### Infrastructure
| Technology | Role |
|---|---|
| **Docker + Compose** | Containerization and multi-service orchestration |
| **Nginx** | Reverse proxy, rate limiting, security headers, WebSocket proxying |
| **PostgreSQL 16** | ACID-compliant relational database for authentication data |
| **Cloudflare R2** | S3-compatible object storage for uploaded files (no egress fees) |

---

## 🔬 How the Blockchain Works

### Block Structure

Every block contains:
- `index` — Sequential block number
- `timestamp` — Unix timestamp of block creation
- `transactions` — All receipt records stored in this block
- `previous_hash` — Hash of the prior block (creates the chain)
- `merkle_root` — Tamper-proof summary of all transactions
- `hash` — SHA-256 fingerprint of this block's header

### Merkle Tree

Each block uses a **Merkle Tree** to summarize all its transactions into a single root hash:

```
Transactions:   [TX1]   [TX2]   [TX3]   [TX4]
Leaf hashes:    H(1)    H(2)    H(3)    H(4)
                  \    /          \    /
Parent hashes:   H(12)            H(34)
                      \          /
  Merkle Root:          H(1234)
```

If any single transaction is altered, its leaf hash changes → parent hash changes → Merkle Root changes → block hash changes → entire chain is invalidated.

### Batch Sealing

Transactions are not immediately sealed into blocks. Instead, the system uses a **batch-seal strategy** matching how real blockchains (Bitcoin, Ethereum) operate:

- Transactions are buffered in a `_pending` list
- A block is sealed when **either**:
  - The pending pool reaches **10 transactions** (`BATCH_SIZE`), or
  - A **5-second background timer** fires (`BATCH_TIMEOUT`)
- Admins can also force-seal via `POST /api/chain/seal`

### Immutability

The `previous_hash` field chains blocks together. Altering any sealed transaction invalidates every subsequent block's `previous_hash`, making tampering **instantly detectable** via `chain.is_valid()`.

### Persistence

After every block is sealed, the full chain is serialized to JSON and saved to Redis (`blockchain:chain` key). On restart, the node restores the chain from Redis — **the blockchain survives container restarts**.

---

## 📡 API Reference

### Document Upload
```
POST /api/upload
Content-Type: multipart/form-data

file: <file>          # PDF, TXT, JPEG, or PNG (max 10MB)
uploader: <string>    # Optional uploader name
```
**Response:** `receipt_id`, `file_hash`, block anchoring result

### Document Verification (by File)
```
POST /api/verify
Content-Type: multipart/form-data

file: <file>          # The original file to verify
```
**Response:** `valid: true/false`, block index, Merkle root, original timestamp

### Document Verification (by Receipt ID)
```
GET /api/verify/{receipt_id}
```
**Response:** Full receipt details if found on chain

### QR Code
```
GET /api/qr/{receipt_id}
```
**Response:** PNG image — scan to open the verification page pre-filled with the receipt ID

### Chain Analytics
```
GET /api/analytics/overview    # Block count, TX count, verification stats
GET /api/analytics/activity    # Recent upload/verify events
GET /api/analytics/timeline    # 24-hour transaction volume (hourly buckets)
GET /api/health/services       # Blockchain, Redis, PostgreSQL health + latency
```

### Admin Chain Control
```
GET  /api/chain             # Recent blocks
GET  /api/chain/stats       # Chain statistics
GET  /api/chain/valid       # Full chain integrity check
POST /api/chain/seal        # Force-seal pending transactions
```

### Real-Time Feed
```
WS /ws/transactions         # Admin-only WebSocket — live upload/verify events
```

---

## 🖥️ Frontend Pages

| Page | Route | Description |
|---|---|---|
| **Upload** | `/` | Drag-and-drop upload → SHA-256 hash → blockchain anchor → receipt ID + QR code |
| **Verify** | `/verify` | Verify by re-uploading a file or entering a receipt UUID; shows cryptographic proof |
| **Dashboard** | `/dashboard` | Admin analytics: block explorer, 24h chart, live WebSocket feed, stats cards |
| **Admin Panel** | `/admin` | Service health monitor, force-seal, chain integrity validation |
| **Login** | `/login` | Google OAuth, GitHub OAuth, or email/password via Better Auth |

> 🔐 `/dashboard` and `/admin` are protected by **Next.js Edge Middleware** — non-admin users are redirected before the page even renders.

---

## 🔄 End-to-End Data Flow

### Upload
```
Browser → Nginx (rate: 5/s) → Backend
  │   1. Validate file type & size (<10MB)
  │   2. Compute SHA-256 composite hash (filename + bytes + PDF text)
  │   3. POST http://blockchain:8001/chain/add → appended to pending pool
  │   4. PUBLISH upload event to Redis "transactions" channel
  │   5. LPUSH to Redis activity_log (capped at 500 entries)
  └─→ Return receipt_id, file_hash, block info to browser
```

### Verify
```
Browser → Nginx → Backend
  │   1. Re-compute SHA-256 hash of submitted file
  │   2. GET http://blockchain:8001/chain/find?hash={hash}
  │   3. If match: return block index, Merkle root, original timestamp (valid)
  │   4. If no match: tampered or never registered (invalid)
  └─→ INCR Redis verification counter
```

### Real-Time Dashboard
```
Admin Browser ── WebSocket ──► Nginx ──► Backend /ws/transactions
                                          │  Validate admin session cookie
                                          │  SUBSCRIBE to Redis "transactions"
                                          └─→ Forward every event to browser
```

---

## 🔐 Security

| Threat | Mitigation |
|---|---|
| Document tampering | SHA-256 hash + Merkle root — any modification is detectable |
| Unauthorized API access | CORS policy; admin routes require JWT session validation |
| SQL injection | SQLAlchemy ORM parameterizes all queries |
| Brute force / DDoS | Nginx rate limiting: 5 req/s (upload), 30 req/s (API) per IP |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` on all responses |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| XSS | `X-XSS-Protection: 1; mode=block`; React auto-escapes output |
| Unauthorized dashboard | Edge Middleware checks admin role before any HTML is served |
| Unauthorized WebSocket | Session cookie validated + role check before connection accepted |
| Large file attacks | 10MB backend limit + 12MB Nginx limit |
| Duplicate upload | `file_hash` column has `UNIQUE` constraint — rejected at DB level |
| Credential exposure | All secrets in environment variables, never hardcoded |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) (v2+)
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (for file storage)
- Google and/or GitHub OAuth credentials (for authentication)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/origyn.git
cd origyn
```

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=your_bucket_name
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost/api
BETTER_AUTH_SECRET=your_auth_secret_min_32_chars
BETTER_AUTH_URL=http://localhost
DATABASE_URL=postgresql://receipts:receipts_secret@localhost:5432/receipts

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Launch All Services

```bash
docker compose up --build
```

This starts all six containers in the correct dependency order:
`postgres` → `redis` → `blockchain` → `backend` → `frontend` → `nginx`

### 4. Create an Admin User

Sign up via the frontend, then promote your account to admin:

```bash
cd frontend
npx ts-node scripts/make-admin.ts your@email.com
```

### 5. Access the Application

| Service | URL |
|---|---|
| **Application** | http://localhost |
| **Backend API Docs** | http://localhost/api/docs |
| **Blockchain Node Docs** | http://localhost:8001/docs |

---

## 📁 Project Structure

```
origyn/
├── blockchain/                 # Custom blockchain microservice
│   ├── block.py                # MerkleTree + Block data structures
│   ├── blockchain.py           # Chain management, batch sealing, Redis persistence
│   ├── node.py                 # FastAPI REST API exposing the blockchain
│   └── requirements.txt
│
├── backend/                    # FastAPI backend service
│   ├── main.py                 # App entry point, CORS config, router registration
│   ├── utils.py                # SHA-256 composite hashing, PDF text extraction
│   ├── models.py               # SQLAlchemy ORM models
│   ├── storage.py              # Cloudflare R2 file upload/download
│   └── routes/
│       ├── upload.py           # POST /api/upload
│       ├── verify.py           # POST /api/verify, GET /api/qr/{id}
│       ├── chain.py            # Proxy routes to blockchain node
│       ├── analytics.py        # Dashboard data: overview, activity, timeline
│       └── ws.py               # WebSocket real-time feed (admin-auth + Redis sub)
│
├── frontend/                   # Next.js 14 frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Upload page
│       │   ├── verify/         # Verification page
│       │   ├── dashboard/      # Admin analytics dashboard
│       │   ├── admin/          # Admin control panel
│       │   └── login/          # Login page
│       ├── lib/
│       │   ├── api.ts          # Axios instance + TypeScript types
│       │   ├── auth.ts         # Better Auth server config
│       │   ├── auth-client.ts  # Better Auth browser client
│       │   └── useWebSocket.ts # WebSocket hook with auto-reconnect
│       └── middleware.ts       # Edge middleware — admin route protection
│
├── nginx/
│   └── nginx.conf              # Rate limiting, security headers, WebSocket proxy
│
├── postgres/
│   └── 01-better-auth.sql      # Auth schema auto-created on first startup
│
├── Dockerfile.backend
├── Dockerfile.blockchain
├── docker-compose.yml
└── DOCUMENTATION.md            # Full deep-dive technical documentation
```

---

## 🧪 Running Tests

```bash
# Verify a file hash matches the blockchain record
python check_hashes.py

# Test receipt file processing
python test_receipt.txt

# Test PDF hashing and blockchain anchoring
python test_pdf.py

# Test tamper detection (submits a modified document)
python test_fake_bill.py
```

---

## 📈 Scalability

The system is architected for horizontal scaling:

| Decision | Benefit |
|---|---|
| **Blockchain as a separate microservice** | Backend replicas scale independently |
| **Redis as shared state** | Stateless backends — multiple replicas share the same Redis |
| **Batch block sealing** | Reduces blockchain I/O from O(n) per-TX to O(1) per batch |
| **Async Python (FastAPI + asyncio)** | Thousands of concurrent requests on a single thread |
| **Nginx rate limiting** | Protects backend from abusive clients |
| **Cloudflare R2** | Infinitely scalable object storage |
| **Docker Compose scaling** | `docker compose up --scale backend=3` for instant horizontal scale |

---

## 📚 Documentation

For a complete deep-dive covering every file, every API endpoint, blockchain internals, consensus design decisions, Redis architecture, and security model — see [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ — Origyn v2.0**

*Making document fraud impossible, one hash at a time.*

</div>

# ChainVerify — Complete Project Documentation

> **Enterprise Digital Bill & Receipt Verification System using Blockchain**

---

## Table of Contents

1. [What Is This Project and Why It Matters](#1-what-is-this-project-and-why-it-matters)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Complete Tech Stack](#3-complete-tech-stack)
4. [Blockchain Internals — Block Creation, Hashing, Merkle Trees](#4-blockchain-internals)
5. [Blockchain Node — How the Node Works](#5-blockchain-node)
6. [Block Adding Principle — Batch Sealing](#6-block-adding-principle)
7. [Consensus Mechanism — What Is Used and Why](#7-consensus-mechanism)
8. [Backend Service — Every Route Explained](#8-backend-service)
9. [Frontend — Every Page and Feature](#9-frontend)
10. [Authentication System (Better Auth)](#10-authentication-system)
11. [Docker — Every Container Explained](#11-docker--container-architecture)
12. [Nginx — Reverse Proxy and Rate Limiting](#12-nginx--reverse-proxy)
13. [Redis — Pub/Sub, Caching, and Activity Logs](#13-redis)
14. [PostgreSQL — Auth Database Schema](#14-postgresql)
15. [Cloud Storage — Cloudflare R2](#15-cloudflare-r2)
16. [Complete Data Flow: Upload and Verify](#16-complete-data-flow)
17. [WebSocket — Real-Time Live Feed](#17-websocket--real-time-feed)
18. [Scalability Design Decisions](#18-scalability-design-decisions)
19. [Security Architecture](#19-security-architecture)
20. [File-by-File Code Reference](#20-file-by-file-code-reference)

---

## 1. What Is This Project and Why It Matters

### The Problem
In the real world, receipts, bills, invoices, and documents are trivially easy to forge or tamper with. A PDF can be opened, edited with any tool, and re-saved. There is no way for a recipient to know if the receipt they received is the same one originally generated. This causes financial fraud, fake warranty claims, manipulated tax documents, and counterfeit invoices in businesses.

### The Solution
**ChainVerify** binds every uploaded document to a cryptographic fingerprint (SHA-256 hash) and permanently records that fingerprint on a custom blockchain. The blockchain acts as an immutable ledger: once a record is written, it cannot be altered without invalidating every subsequent block. To verify a document, a user submits the original file — the system re-computes its hash and looks it up on the blockchain. If the hashes match, the document is genuine and unmodified. If they do not match (even a single changed character), the verification fails.

### Why This Is Important
| Problem It Solves | Real-World Impact |
|---|---|
| Fake receipts / invoices | Prevents business financial fraud |
| Tampered documents | Ensures regulatory compliance |
| No audit trail | Provides cryptographic proof of origin |
| Centralized trust | Removes reliance on a single authority |
| After-the-fact document alteration | Makes historical manipulation detectable |

---

## 2. High-Level Architecture

```
                         ┌──────────────────────────────────────────┐
                         │               USER (Browser)              │
                         └──────────────┬───────────────────────────┘
                                        │ HTTP / WebSocket
                                        ▼
                         ┌──────────────────────────────────────────┐
                         │         NGINX (Port 80)                  │
                         │  Reverse Proxy + Rate Limiter            │
                         │  TLS Termination + Security Headers      │
                         └──────┬─────────────────────┬────────────┘
                                │                     │
                         ┌──────▼──────┐     ┌────────▼──────────┐
                         │  Frontend   │     │  Backend API       │
                         │  Next.js    │     │  FastAPI           │
                         │  Port 3000  │     │  Port 8000         │
                         └─────────────┘     └────────┬──────────┘
                                                      │
                          ┌───────────────────────────┤
                          │                           │
                   ┌──────▼──────┐          ┌────────▼────────┐
                   │  Blockchain │          │     Redis        │
                   │  Node       │          │  Pub/Sub Cache   │
                   │  Port 8001  │          │  Port 6379       │
                   └──────┬──────┘          └─────────────────┘
                          │
                   ┌──────▼──────┐          ┌─────────────────┐
                   │  Redis      │          │   PostgreSQL     │
                   │  (state     │          │   Port 5432      │
                   │   persist)  │          │   Auth Tables    │
                   └─────────────┘          └─────────────────┘
                                                      
                                            ┌─────────────────┐
                                            │  Cloudflare R2  │
                                            │  Object Storage │
                                            └─────────────────┘
```

All six services run inside **Docker containers** on a shared internal network called `app-net`. The outside world only reaches port 80 (Nginx), while inter-service traffic uses Docker's internal DNS — for example, the backend calls `http://blockchain:8001` and `redis://redis:6379` using container names, not IP addresses.

---

## 3. Complete Tech Stack

### Backend & Blockchain
| Technology | Role | Why Chosen |
|---|---|---|
| **Python 3.11** | Primary language for backend and blockchain node | Rich ecosystem, readable, fast prototyping |
| **FastAPI** | Async REST API framework | Native async/await, automatic OpenAPI docs, Pydantic validation, very high throughput |
| **Uvicorn** | ASGI server running FastAPI | Production-grade async server, hot-reload support |
| **Redis 7** | Pub/Sub messaging + cache + activity log | In-memory speed, pub/sub for real-time events, LRU eviction policy |
| **SQLAlchemy** | ORM for PostgreSQL | Database-agnostic, handles schema migrations |
| **httpx** | Async HTTP client | Backend-to-blockchain HTTP calls; supports async/await natively |
| **boto3** | AWS/S3-compatible SDK | Used for Cloudflare R2 file storage via S3 API |
| **qrcode** | QR code generator | Generates a scannable QR linking to the verification URL for any receipt |
| **PyPDF2** | PDF text extraction | Extracts text from PDFs to include in hash computation, making hash content-aware |
| **hashlib** | SHA-256 cryptographic hashing | Standard library — generates unique, collision-resistant fingerprints |
| **threading** | Thread-safe concurrency | Protects shared blockchain state from race conditions |

### Frontend
| Technology | Role | Why Chosen |
|---|---|---|
| **Next.js 14** | React meta-framework | Server components, client routing, SSR, built-in API routes |
| **TypeScript** | Type-safe JavaScript | Catches bugs at compile time, better developer experience |
| **Tailwind CSS** | Utility-first CSS framework | Fast styling without writing custom CSS, fully customizable |
| **Framer Motion** | Animation library | Smooth page and component animations for professional UX |
| **Axios** | HTTP client | Promise-based, interceptor support for automatic auth header injection |
| **Better Auth** | Authentication framework | Supports Google/GitHub OAuth, session management, admin roles built in |
| **react-dropzone** | File drag-and-drop | Easy UX for file upload with type/size filtering |
| **lucide-react** | Icon set | Consistent, lightweight SVG icons |
| **react-hot-toast** | Toast notifications | Clean, accessible success/error messages |

### Infrastructure
| Technology | Role | Why Chosen |
|---|---|---|
| **Docker** | Containerization | Consistent environment across dev/prod, one-command deployment |
| **Docker Compose** | Multi-container orchestration | Defines all six services, networks, volumes in one YAML file |
| **Nginx** | Reverse proxy + load balancer | Single entry point, rate limiting, security headers, WebSocket proxying |
| **PostgreSQL 16** | Relational database | ACID-compliant, stores authentication tables |
| **Cloudflare R2** | Object storage | S3-compatible, cheaper than AWS S3, global CDN, stores uploaded files |

---

## 4. Blockchain Internals

### File: `blockchain/block.py`

This file defines the two core data structures of the blockchain.

#### Class: `MerkleTree`

A **Merkle Tree** is a binary tree where every leaf node is the hash of a data item, and every parent node is the hash of its two children. The root of this tree — the **Merkle Root** — is a single hash that represents all the data in the tree.

```
Transactions:  [TX1]   [TX2]   [TX3]   [TX4]
               ─────   ─────   ─────   ─────
Leaf hashes:   H(1)    H(2)    H(3)    H(4)
                  \   /           \   /
Parent hashes:   H(12)            H(34)
                      \          /
  Merkle Root:          H(1234)
```

**Why it matters:** If any single transaction is changed, its leaf hash changes, which changes its parent hash, which changes the Merkle Root. So the Merkle Root in the block header serves as a tamper-proof summary of all transactions in the block. Verification is O(log n) efficient.

```python
# From block.py
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
            leaves.append(leaves[-1])  # Duplicate last leaf if odd count
        leaves = [
            hashlib.sha256((leaves[i] + leaves[i+1]).encode()).hexdigest()
            for i in range(0, len(leaves), 2)
        ]
    return leaves[0]
```

- Each transaction dictionary is serialized with `json.dumps(..., sort_keys=True)` to ensure key ordering doesn't affect the hash.
- If the number of leaves is odd, the last leaf is duplicated (standard Merkle Tree convention).

#### Class: `Block`

A Block is the fundamental unit of the blockchain. Each block contains:

| Field | Type | Description |
|---|---|---|
| `index` | int | Sequential block number starting from 0 (genesis) |
| `timestamp` | float | Unix timestamp of block creation |
| `transactions` | List[Dict] | All receipt records stored in this block |
| `previous_hash` | str | The SHA-256 hash of the previous block — this creates the "chain" |
| `merkle_root` | str | Merkle Root of all transactions in this block |
| `nonce` | int | Currently 0 (see Consensus section for why) |
| `hash` | str | The SHA-256 hash of this block's header |

```python
def compute_hash(self) -> str:
    block_data = json.dumps({
        "index": self.index,
        "timestamp": self.timestamp,
        "merkle_root": self.merkle_root,       # Summary of all transactions
        "previous_hash": self.previous_hash,   # Links to previous block
        "nonce": self.nonce,
    }, sort_keys=True)
    return hashlib.sha256(block_data.encode()).hexdigest()
```

**Why `previous_hash` creates immutability:** If an attacker modifies a transaction in Block 5, the Merkle Root of Block 5 changes. This changes the `hash` of Block 5. But Block 6 stores `Block 5's hash` as its `previous_hash`. Now Block 6's `previous_hash` no longer matches the hash of Block 5, making the chain invalid. The attacker would have to recompute every subsequent block — computationally infeasible in real distributed blockchains, and detectable via `is_valid()` in this system.

#### Hash Chain Visualization

```
 ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 │  GENESIS BLOCK  │     │    BLOCK 1       │     │    BLOCK 2       │
 │  index: 0       │     │  index: 1        │     │  index: 2        │
 │  prev: "0"      │ ──► │  prev: H(B0)     │ ──► │  prev: H(B1)     │
 │  hash: H(B0)    │     │  hash: H(B1)     │     │  hash: H(B2)     │
 │  merkle: ...    │     │  merkle: ...     │     │  merkle: ...     │
 └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 5. Blockchain Node

### File: `blockchain/node.py`

This is a **FastAPI HTTP service** that exposes the blockchain over a REST API. It is the *only* service that directly reads/writes blockchain state. All other services (backend) communicate with it over HTTP.

#### Why Separate Node Architecture?

Separating the blockchain logic into its own service means:
- The backend API can scale independently.
- The blockchain node can be replaced or upgraded without touching the backend.
- In a real distributed system, multiple blockchain nodes could be run (each on different servers) providing true decentralization.

#### Blockchain Node API Endpoints

| Method | Endpoint | What It Does |
|---|---|---|
| `POST` | `/chain/add` | Accepts a new transaction (receipt record) and adds it to the pending pool |
| `GET` | `/chain/find?hash={hash}` | Searches all blocks and pending transactions for a file hash |
| `GET` | `/chain/find_receipt?receipt_id={id}` | Searches for a receipt by its UUID |
| `GET` | `/chain` | Returns recent blocks + chain statistics |
| `GET` | `/chain/stats` | Returns uptime, block count, transaction count, validity |
| `GET` | `/chain/valid` | Validates the entire chain's integrity |
| `GET` | `/chain/transactions` | Returns recent transactions from sealed blocks |
| `POST` | `/chain/seal` | Forces immediate sealing of pending transactions into a new block |
| `GET` | `/health` | Health check: chain length and validity |

#### Redis Pub/Sub in the Node

When a new transaction is added, the node publishes the event to Redis channel `"transactions"`:

```python
if redis_client:
    await redis_client.publish("transactions", json.dumps(result))
```

Any subscriber on that channel (the backend's WebSocket route) receives the event and forwards it to connected browser clients in real time.

---

## 6. Block Adding Principle

### File: `blockchain/blockchain.py`

#### The Batch-Seal Pattern

This system uses a **batch sealing** strategy rather than sealing one block per transaction. This is a deliberate scalability design decision.

**How it works:**

1. When a receipt is uploaded, `add_transaction()` is called. The transaction is added to a `_pending` list (in-memory buffer).
2. Two conditions trigger a new block to be "sealed":
   - **Batch threshold:** When `_pending` reaches 10 transactions (`BATCH_SIZE = 10`), a block is immediately sealed.
   - **Time-based auto-seal:** A background timer fires every 5 seconds (`BATCH_TIMEOUT = 5.0`). If there are any pending transactions, they are sealed into a block regardless of count.
3. A manually-triggered seal is also available via the `POST /chain/seal` admin endpoint.

```python
BATCH_SIZE = 10
BATCH_TIMEOUT = 5.0

def add_transaction(self, ...):
    with self._lock:
        self._pending.append(tx)
        if len(self._pending) >= self.BATCH_SIZE:
            self._seal_block()          # Immediate seal

def _auto_seal(self):
    with self._lock:
        if self._pending:
            self._seal_block()          # Time-based seal
    # Reschedule
    self._timer = threading.Timer(self.BATCH_TIMEOUT, self._auto_seal)
    self._timer.daemon = True
    self._timer.start()
```

**Why batch instead of one-per-block?**

| Single-tx blocks | Batch blocks |
|---|---|
| High overhead per transaction | Amortized overhead across many transactions |
| Redis written on every upload | Redis written once per batch |
| Blockchain grows very quickly | Manageable chain size |
| Not how real blockchains work | Matches how Bitcoin, Ethereum work (multiple TXs per block) |

#### Thread Safety

A `threading.RLock` (reentrant lock) protects all mutations to `_pending` and `self.chain`. This prevents race conditions when multiple uploads happen simultaneously.

#### Redis Persistence

After every block is sealed, the entire chain is serialized to JSON and saved to Redis with key `blockchain:chain`. On startup, the node loads this key first — if it exists, the chain is restored from Redis. If not, a fresh genesis block is created. This means:
- The blockchain survives container restarts.
- Redis is the **single source of truth** for blockchain state.

```python
def _save_to_redis(self):
    self.r.set(CHAIN_KEY, json.dumps([b.to_dict() for b in self.chain]))

def _load_from_redis(self):
    raw = self.r.get(CHAIN_KEY)
    if not raw:
        return
    chain_data = json.loads(raw)
    for bd in chain_data:
        b = Block.__new__(Block)
        b.__dict__.update(bd)
        self.chain.append(b)
```

#### Genesis Block

The genesis block is block index 0 with an empty transaction list and `previous_hash = "0"`. It is the anchor of the entire chain — there is no block before it.

---

## 7. Consensus Mechanism

### What Is Consensus?

In a **distributed blockchain network** (like Bitcoin or Ethereum), multiple independent nodes each hold a copy of the chain and must agree on which blocks are valid. This agreement process is called **consensus**. Common consensus algorithms:

| Algorithm | Used In | How It Works |
|---|---|---|
| **Proof of Work (PoW)** | Bitcoin | Nodes compete to solve a cryptographic puzzle; the winner adds the next block |
| **Proof of Stake (PoS)** | Ethereum | Nodes stake cryptocurrency as collateral; validators are chosen proportionally |
| **PBFT** | Hyperledger | Majority vote among known validators — works in private/permissioned blockchains |
| **Proof of Authority (PoA)** | Private chains | Trusted identities are pre-approved as validators |

### What This Project Uses

**ChainVerify uses a single-node, centralized blockchain — no distributed consensus algorithm is needed or applied.** This is a deliberate architectural choice for the following reasons:

1. **Single node, single authority:** There is only one `blockchain` container. Only one process writes to the chain. There is no competing version of the chain, so there is no disagreement to resolve.

2. **Integrity verification instead of consensus:** The system achieves tamper-detection through cryptographic chain validation (`is_valid()`), not through distributed agreement. Instead of multiple nodes voting, the chain's own hash linkages prove whether any data was altered.

3. **Private/permissioned design:** This is a private enterprise system (not a public decentralized network). Users are authenticated before uploading. The system trusts the operator, not a distributed community. This is similar to **Hyperledger Fabric's** model where a known organization operates the nodes.

4. **Nonce field present but unused:** Each `Block` has a `nonce` field (currently `0`). In Proof of Work, the nonce is incremented until the block hash meets a target difficulty. This field exists as a placeholder for future upgrade to PoW if the system needs mining-based consensus.

### Can It Be Extended to Multi-Node?

Yes. To run multiple blockchain nodes for true decentralization:
- Each node would run a separate `blockchain` container.
- A gossip protocol would propagate new transactions across nodes.
- The longest valid chain rule (Nakamoto consensus) or PBFT voting would resolve conflicts.
- Docker Compose `scale` or Kubernetes would orchestrate multiple instances.

Currently, the system architecture **is ready for multi-node extension** — the node exposes a full REST API that could be called by peer synchronization logic.

---

## 8. Backend Service

### File: `backend/main.py`

The entry point for the backend FastAPI application. It:
- Creates the FastAPI app with title "ChainVerify API v2.0"
- Configures CORS (Cross-Origin Resource Sharing) to only allow requests from the configured frontend origin (defaults to `http://localhost:3000`). This prevents unauthorized websites from calling the API.
- Registers four route groups: `upload`, `verify`, `chain`, `analytics`, plus WebSocket (`ws`).
- Exposes a root health check at `GET /` and `GET /health`.

---

### File: `backend/utils.py`

Contains two utility functions used across all routes.

#### `extract_pdf_text(file_bytes: bytes) -> str`
Uses **PyPDF2** to extract all readable text from a PDF file. This text is used as an additional input to the hash, making the hash content-aware (not just byte-aware).

#### `generate_hash(file_bytes: bytes, filename: str = "") -> str`
Generates a **composite SHA-256 hash** by concatenating:
1. The filename (encoded as UTF-8 bytes)
2. The raw file bytes
3. For PDFs only: the extracted text content

**Why composite?** A plain byte hash would produce the same hash for the same content regardless of filename. By including the filename and extracted text, two semantically different PDFs with identical binary content (from re-saving) would still produce the same hash because the text content anchors the identity. Also, renaming a file does change its identity, which is appropriate for receipt verification.

---

### File: `backend/routes/upload.py`

Handles `POST /api/upload`.

**Full process:**
1. Validates that the file type is one of: PDF, TXT, JPEG, PNG (rejects all others with HTTP 400).
2. Reads all file bytes into memory and checks the file size is under 10MB.
3. Calls `generate_hash()` to compute the composite SHA-256 fingerprint.
4. Generates a unique `receipt_id` using Python's `uuid.uuid4()` (a universally unique identifier).
5. Uses `httpx.AsyncClient` to make an async POST to the blockchain node at `/chain/add`, sending the receipt metadata.
6. Publishes an `"upload"` event to Redis pub/sub channel `"transactions"` so any connected WebSocket clients see the upload in real time.
7. Also pushes the event to a Redis list `activity_log` (max 500 items, trimmed automatically) for the analytics dashboard.
8. Returns the full receipt metadata including `receipt_id`, `file_hash`, and the blockchain response.

**Supported file types:** `application/pdf`, `text/plain`, `image/jpeg`, `image/png`

---

### File: `backend/routes/verify.py`

#### `POST /api/verify`
Verifies a document by re-computing its hash and searching the blockchain.

**Full process:**
1. Reads the uploaded file bytes, computes composite hash using `generate_hash()`.
2. Makes async GET to blockchain node `/chain/find?hash={hash}`.
3. If a match is found (`receipt_id` present in response), returns `valid: true` with:
   - The original uploader name
   - Block index where this transaction is stored
   - Block hash and Merkle root as cryptographic proof
   - Original timestamp of registration
4. If no match, returns `valid: false` with a message explaining the document was either never registered or has been tampered with.
5. Updates Redis counters `stats:valid_verifications` and `stats:invalid_verifications` for analytics.

#### `GET /api/verify/{receipt_id}`
Verifies by receipt UUID instead of file content. Calls blockchain's `/chain/find_receipt` endpoint. Useful for QR code verification.

#### `GET /api/qr/{receipt_id}`
Generates a QR code image (PNG) that encodes the URL `{FRONTEND_URL}/verify?id={receipt_id}`. When scanned, the QR code opens the verification page pre-filled with the receipt ID. Returns the image as a streaming PNG response.

---

### File: `backend/routes/chain.py`

These are pass-through proxy routes — the backend forwards requests to the blockchain node and returns responses. This keeps the blockchain node's internal port (8001) hidden from the frontend; the frontend only ever talks to port 8000.

| Endpoint | Proxies To | Purpose |
|---|---|---|
| `GET /api/chain/stats` | `/chain/stats` on blockchain | Chain statistics |
| `GET /api/chain` | `/chain` on blockchain | Recent blocks |
| `GET /api/chain/valid` | `/chain/valid` on blockchain | Chain integrity check |
| `GET /api/chain/transactions` | `/chain/transactions` on blockchain | Recent transactions |
| `POST /api/chain/seal` | `/chain/seal` on blockchain | Force-seal pending transactions |

---

### File: `backend/routes/analytics.py`

Provides dashboard data.

#### `GET /api/analytics/overview`
Fetches blockchain statistics from the node and verification counters from Redis. Returns a combined object with `total_blocks`, `total_transactions`, and `verification_stats` (valid, invalid, total, success rate percentage).

#### `GET /api/analytics/activity`
Reads the last N items from the Redis `activity_log` list. Each item is a JSON-encoded upload or verification event. Returns the most recent activity for the live feed.

#### `GET /api/analytics/timeline`
Fetches up to 200 recent transactions from the blockchain node, then groups them into 24 hourly buckets (from "23 hours ago" to "now"). Returns a time series array suitable for charting transaction volume over time.

#### `GET /api/health/services`
Pings the blockchain node's `/health` endpoint and checks Redis connectivity. Returns a health status object for each service with latency measurements, used by the admin dashboard's health monitoring panel.

---

### File: `backend/routes/ws.py`

Handles WebSocket connections at `/ws/transactions`.

#### `ConnectionManager`
Maintains a list of all currently-connected WebSocket clients. `connect()` accepts and registers a socket. `disconnect()` removes it. `broadcast()` sends a message to all connected clients, automatically removing dead connections.

#### Admin Authentication
Before accepting any WebSocket connection, the server reads the `better-auth.session_token` cookie from the WebSocket handshake request. It then calls the frontend's `GET /api/auth/get-session` endpoint to validate the session and check that `user.role == "admin"`. Non-admin connections are rejected with WebSocket close code `4001`.

#### Redis Pub/Sub Subscription
After authentication, the WebSocket handler subscribes to the Redis `"transactions"` channel. Every time a new upload or verification event is published anywhere in the system, this handler receives it and forwards it to all connected admin browser clients. This enables the real-time transaction feed on the admin dashboard.

---

### File: `backend/models.py`

Defines the SQLAlchemy ORM model for the `receipts` table (PostgreSQL). Fields:

| Column | Type | Description |
|---|---|---|
| `receipt_id` | String (PK) | UUID primary key |
| `file_hash` | String (Unique) | SHA-256 hash, enforces no duplicate registrations |
| `uploader` | String | Name/identifier of whoever uploaded |
| `timestamp` | Float | Unix timestamp of upload |
| `r2_key` | String | Key in Cloudflare R2 storage for the actual file |

The database URL is read from the `DATABASE_URL` environment variable. For PostgreSQL, asyncpg URLs are converted to synchronous psycopg2 URLs for the sync SQLAlchemy engine.

---

### File: `backend/storage.py`

Manages file storage in **Cloudflare R2** (object storage). Credentials are read from environment variables:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_BUCKET`

Uses **boto3** (Amazon's official SDK) with a custom `endpoint_url` pointing to Cloudflare's R2 API, which is S3-compatible. This means the exact same code that would talk to AWS S3 works for Cloudflare R2 with only the endpoint URL changed.

`upload_file(file_bytes, filename)` → Uploads bytes to R2 and returns the storage key.
`get_file(filename)` → Retrieves a file's bytes from R2 by key.

---

## 9. Frontend

### Technology
Next.js 14 app router with TypeScript and Tailwind CSS. All pages under `src/app/` follow the Next.js file-based routing convention.

---

### Page: `src/app/page.tsx` — Home / Upload Page

The main landing page serves two purposes: marketing/feature showcase and document upload.

**Features displayed:**
- SHA-256 Hashing explanation
- Blockchain Anchoring explanation
- Instant Verification explanation
- Tamper Detection explanation

**Upload Pipeline:**
1. **Drag-and-drop zone** using `react-dropzone`. Accepts PDF, TXT, JPEG, PNG.
2. An optional "Uploader Name" text field.
3. On submit, an animated pipeline progress indicator shows four steps in real time: "Reading File" → "Computing Hash" → "Anchoring" → "Confirming".
4. On success, displays the `receipt_id`, file hash, block information, and a QR code download link.
5. Copy-to-clipboard buttons for both the receipt ID and file hash.

---

### Page: `src/app/verify/page.tsx` — Verify Page

Two verification modes:
1. **File mode:** Drag-and-drop a file. The frontend uploads it to `POST /api/verify` which re-hashes and checks the blockchain.
2. **ID mode:** Enter a receipt UUID. Calls `GET /api/verify/{receipt_id}` directly.

The page also supports a URL parameter `?id={receipt_id}` which pre-fills the receipt ID field and switches to ID mode automatically — this is how QR codes deep-link into this page.

**On success:** Shows a green "Document Verified" panel with the original uploader, block index, block hash, Merkle root, and original timestamp.

**On failure:** Shows a red "Invalid Document" panel noting the document was either never registered or has been tampered.

---

### Page: `src/app/dashboard/page.tsx` — Admin Dashboard

The analytics and monitoring dashboard. Only accessible to users with `role = "admin"`.

**Components:**
- **Stats cards:** Total blocks, total transactions, valid/invalid verifications, uptime, transactions-per-second.
- **Sparkline charts:** Mini SVG charts rendered inline showing transaction volume trends.
- **Animated counters:** Numbers smoothly animate when they update, using `requestAnimationFrame` with cubic ease-out.
- **Block Explorer:** Clickable list of recent blocks; clicking a block shows all its transactions.
- **Activity Feed:** Real-time scrolling list of recent uploads and verifications with color-coded tags.
- **Live WebSocket feed:** Uses `useWebSocket` hook — any new event published to Redis appears instantly in the dashboard without page refresh.
- **Chain search:** Allows searching through blocks by hash or transaction metadata.
- **Timeline chart:** 24-hour transaction volume bar chart.

---

### Page: `src/app/admin/page.tsx` — Admin Control Panel

System administration page.

**Features:**
- **Service health panel:** Shows live status of Blockchain Node, Redis, and PostgreSQL with response times.
- **Force Seal button:** Calls `POST /api/chain/seal` to immediately seal all pending transactions into a block.
- **Validate Chain button:** Calls `GET /api/chain/valid` to run full chain integrity verification across all blocks.
- Node statistics: total blocks, total transactions, validity status, pending transaction count.
- Auto-refreshes every 10 seconds.

---

### Page: `src/app/login/page.tsx`
Login page using Better Auth's client SDK. Supports Google OAuth, GitHub OAuth, and email/password authentication.

---

### File: `src/lib/api.ts`
Axios instance pre-configured with `baseURL = NEXT_PUBLIC_API_URL`. An **Axios request interceptor** automatically attaches the `Authorization: Bearer {session_token}` header to every API call by reading the current session from Better Auth client.

Also defines all TypeScript types: `UploadResponse`, `VerifyResponse`, `ChainStats`, `BlockData`, `ServiceHealth`, `ActivityItem`.

---

### File: `src/lib/useWebSocket.ts`
Custom React hook wrapping the browser's native WebSocket API. Features:
- **Auto-reconnect** with **exponential backoff with jitter** (delay doubles on each failure, plus random jitter to prevent thundering herd).
- Configurable max messages stored in state (default 50).
- Configurable reconnect delay and maximum reconnect delay (default 30 seconds max).
- Handles unmount cleanup, parsing JSON messages, and tracking connection state.

---

### File: `src/middleware.ts`
Next.js Edge Middleware runs on every request **before** the page is rendered.

1. Checks if the requested path starts with `/dashboard` or `/admin`.
2. If yes, reads the `better-auth.session_token` cookie.
3. If no cookie, redirects to `/login`.
4. If cookie exists, fetches the session via `GET /api/auth/get-session`.
5. Checks `session.user.role === "admin"`.
6. If not admin, redirects to `/login?error=unauthorized`.

This prevents any non-admin user from even seeing the dashboard HTML — protection happens at the edge before any React rendering.

---

### File: `src/lib/auth.ts`
Better Auth server configuration:
- Connects to PostgreSQL using the `DATABASE_URL` environment variable.
- Configures Google and GitHub as OAuth social providers.
- Enables the `admin()` plugin which adds a `role` field (`"admin"` or `"user"`) to the user model.
- 7-day session expiry with 5-minute cookie cache to reduce database reads.

---

### File: `src/app/api/auth/[...all]/route.ts`
Next.js catch-all API route that delegates all `/api/auth/*` requests to Better Auth's handler. This includes `/api/auth/sign-in`, `/api/auth/sign-out`, `/api/auth/get-session`, OAuth callbacks, etc.

---

## 10. Authentication System

### Better Auth

Better Auth is a full-stack authentication library. The schema it uses (stored in PostgreSQL) includes:

| Table | Purpose |
|---|---|
| `user` | Stores user profile: id, email, name, role (admin/user), ban status |
| `session` | Active login sessions with expiry and IP address tracking |
| `account` | Links users to OAuth providers (Google, GitHub) or password credentials |
| `verification` | Email verification and OTP tokens |

### Admin Role System
Only users with `role = "admin"` in the `user` table can access `/dashboard` and `/admin`. The `make-admin.ts` script in `frontend/scripts/` is used to promote a user to admin by their email address, directly updating the database.

### Session Cookie Flow
1. User signs in via Google/GitHub OAuth or email/password.
2. Better Auth creates a session record in PostgreSQL, sets a secure cookie `better-auth.session_token`.
3. The cookie is sent with every browser request (including WebSocket handshake).
4. Middleware and WebSocket auth both validate this cookie against PostgreSQL via Better Auth's session API.

---

## 11. Docker — Container Architecture

### File: `docker-compose.yml`

Six containers run together, all connected via internal Docker bridge network `app-net`.

---

#### Container 1: `postgres`
```yaml
image: postgres:16-alpine
```
- Standard PostgreSQL database.
- Data persisted in Docker volume `pg_data` (survives container restarts).
- The `./postgres/` directory is mounted read-only into `/docker-entrypoint-initdb.d/`. Any `.sql` files there are run automatically on first startup — `01-better-auth.sql` creates all authentication tables.
- Health check: `pg_isready -U receipts` — other containers wait for this to pass before starting.

---

#### Container 2: `redis`
```yaml
image: redis:7-alpine
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```
- Redis key-value store and pub/sub broker.
- `--maxmemory 256mb`: Hard cap on memory usage.
- `--maxmemory-policy allkeys-lru`: When memory is full, evict the **Least Recently Used** keys. This is appropriate because the live activity log and stats are valuable while recent but can be safely evicted if memory runs low.
- Data persisted in Docker volume `redis_data`.
- Health check: `redis-cli ping`.

---

#### Container 3: `blockchain`
```yaml
build:
  context: ./blockchain
  dockerfile: ../Dockerfile.blockchain
```
- Runs `Dockerfile.blockchain`: `python:3.11-slim`, installs `requirements.txt`, runs `uvicorn node:app --host 0.0.0.0 --port 8001`.
- Only depends on Redis being healthy (for state persistence and pub/sub).
- Exposes port 8001 internally. Only the `backend` container communicates with it using `http://blockchain:8001`.
- Contains the full blockchain state in memory + persisted to Redis.

---

#### Container 4: `backend`
```yaml
build:
  context: ./backend
  dockerfile: ../Dockerfile.backend
```
- Runs `Dockerfile.backend`: `python:3.11-slim`, installs `requirements.txt`, runs `uvicorn main:app --host 0.0.0.0 --port 8000`.
- Depends on: `postgres` (healthy), `redis` (healthy), `blockchain` (started).
- Environment variables injected:
  - `DATABASE_URL` — PostgreSQL connection string
  - `REDIS_URL` — Redis connection string
  - `BLOCKCHAIN_URL` — Internal URL for the blockchain node
  - `FRONTEND_URL` — Used for WebSocket session verification and QR code URLs
  - `CORS_ORIGIN` — Allowed frontend origin for CORS

---

#### Container 5: `frontend`
```yaml
build:
  context: ./frontend
  dockerfile: Dockerfile.frontend
```
- Next.js application, runs on port 3000.
- Depends on `backend`.
- `.env.local` provides OAuth credentials, API URLs, and other configuration.

---

#### Container 6: `nginx`
```yaml
image: nginx:alpine
```
- Uses the custom `nginx/nginx.conf` configuration file.
- Only container exposing port 80 to the host machine.
- Routes all traffic:
  - `location /api/upload` → Backend (with strict rate limit: 5 requests/second per IP)
  - `location /api/` → Backend (30 req/second per IP)
  - `location /ws/` → Backend (with WebSocket upgrade headers)
  - `location /` → Frontend (Next.js)

#### Docker Internal DNS
Docker Compose automatically creates DNS entries for each service named by the service key. So `backend` can reach `blockchain` via `http://blockchain:8001` without knowing the IP address. This makes the configuration portable — it works identically in any Docker environment.

#### Dependency Order
```
postgres ──► backend ──► nginx
redis    ──►            ──►
         ──► blockchain
         ──► frontend (via backend)
```
The `depends_on` with `condition: service_healthy` ensures containers start in the correct order and earlier services are ready before later ones initialize.

---

## 12. Nginx — Reverse Proxy

### File: `nginx/nginx.conf`

Nginx sits in front of everything. Every request from a browser goes through Nginx first.

#### Performance Configuration
- `worker_processes auto` — Nginx automatically uses as many worker processes as CPU cores.
- `worker_connections 2048` — Each worker handles up to 2048 simultaneous connections.
- `sendfile on`, `tcp_nopush on`, `tcp_nodelay on` — OS-level optimizations for high-throughput file serving.
- `keepalive_timeout 65` — Persistent HTTP connections reduce handshake overhead.
- `client_max_body_size 12m` — Allows file uploads up to 12MB (slightly above the 10MB backend limit to accommodate multipart overhead).

#### Gzip Compression
Responses are automatically compressed for: CSS, JSON, JavaScript, XML, SVG. This reduces bandwidth consumption significantly for API responses and static assets.

#### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;
```
- Two separate zones track request rates per IP address.
- Upload routes are limited to 5 requests/second per IP (with burst of 3) to prevent bulk upload abuse.
- General API routes allow 30 requests/second (with burst of 20).
- Stored in a 10MB shared memory zone.

#### Security Headers
Every response gets:
- `X-Frame-Options: SAMEORIGIN` — Prevents clickjacking (page can't be loaded in an iframe from another origin).
- `X-Content-Type-Options: nosniff` — Prevents browsers from sniffing the content type (MIME type confusion attacks).
- `X-XSS-Protection: 1; mode=block` — Enables browser's built-in XSS filter.
- `Referrer-Policy: strict-origin-when-cross-origin` — Controls how much referrer information is shared.

#### WebSocket Proxying
WebSocket connections for `/ws/` include the required HTTP upgrade headers:
```nginx
proxy_http_version 1.1;
Upgrade: $http_upgrade
Connection: "upgrade"
```
Without these, WebSocket connections would fail because HTTP/1.0 doesn't support connection upgrades.

---

## 13. Redis

Redis serves three separate roles in this system:

### Role 1: Blockchain State Persistence
Key: `blockchain:chain`
Value: JSON array of all blocks in the chain
Written after every block seal. Read on node startup to restore chain state.

### Role 2: Pub/Sub Event Bus
Channel: `transactions`
Publishers: Backend's upload and verify routes, Blockchain node's `/chain/add` endpoint.
Subscribers: Backend's WebSocket handler.

When an upload or verification happens, a JSON event is published. The WebSocket handler (subscribed to this channel) receives the event and broadcasts it to all connected admin browsers in milliseconds — creating the real-time feed.

### Role 3: Activity Log and Stats Counters
- `activity_log` — A Redis List storing the last 500 events (trimmed with `LTRIM`).
- `stats:valid_verifications` — Integer counter incremented on every successful verification.
- `stats:invalid_verifications` — Integer counter incremented on every failed verification.

These counters are read by the analytics endpoint and displayed on the dashboard.

### LRU Eviction Policy
With `maxmemory-policy allkeys-lru`, Redis will evict the least recently accessed keys if it approaches the 256MB memory limit. The blockchain state key (`blockchain:chain`) is read periodically during verifications, keeping it "recent" and unlikely to be evicted. Older activity log entries are lower priority.

---

## 14. PostgreSQL

PostgreSQL stores only the **authentication data** — it does NOT store receipt hashes or blockchain data. That lives in the blockchain node (memory + Redis).

### Schema (from `postgres/01-better-auth.sql`)

**`user` table:**
- `id` (TEXT PK) — UUID
- `email` (TEXT UNIQUE) — Login email
- `role` (TEXT DEFAULT 'user') — Either `"user"` or `"admin"`
- `banned`, `banReason`, `banExpires` — Admin ban system

**`session` table:**
- `token` (TEXT UNIQUE) — The session token stored in the browser cookie
- `userId` (FK → user) — Links session to user
- `expiresAt` — Session expiry timestamp
- `ipAddress`, `userAgent` — Security audit fields

**`account` table:**
- `providerId` — OAuth provider name (e.g., `"google"`, `"github"`)
- `accountId` — The user's ID on that OAuth provider
- Stores OAuth access tokens and refresh tokens

**`verification` table:**
- Used for email verification flows and password reset OTPs

---

## 15. Cloudflare R2

Cloudflare R2 is an **S3-compatible object storage** service. It is used to store the actual uploaded files (the binary file content), while the blockchain stores only the hash.

**Why R2 instead of local disk?**
- Files uploaded to different container replicas would be inaccessible from other replicas.
- R2 provides a durable, globally-distributed object store.
- No egress fees (unlike AWS S3), making it cost-effective.
- The `boto3` SDK's S3 compatibility means zero code change if migrated to AWS S3 later.

**Storage key = filename.** The `r2_key` column in the `receipts` table stores this key for retrieval.

---

## 16. Complete Data Flow

### Upload Flow

```
Browser
  │
  │  POST /api/upload (multipart form: file + uploader name)
  ▼
Nginx (rate limit: 5/s, max 12MB)
  │
  ▼
Backend /api/upload route
  │── 1. Validate file type & size
  │── 2. Read file bytes
  │── 3. generate_hash(bytes, filename) → SHA-256 composite hash
  │── 4. Generate UUID receipt_id
  │
  │── 5. POST http://blockchain:8001/chain/add
  │         { receipt_id, file_hash, uploader, filename, file_size }
  │         ▼
  │       Blockchain Node
  │         │── Append to _pending list
  │         │── Publish to Redis "transactions" channel
  │         │── If len(_pending) >= 10: seal block now
  │         └── Else: wait for 5-second auto-seal timer
  │
  │── 6. PUBLISH to Redis "transactions" channel (upload event)
  │── 7. LPUSH to Redis "activity_log"
  │
  └── 8. Return { receipt_id, file_hash, blockchain result }
          ▼
        Browser shows QR code + receipt ID
```

### Verify Flow

```
Browser
  │
  │  POST /api/verify (multipart: file)
  ▼
Nginx
  │
  ▼
Backend /api/verify route
  │── 1. Read file bytes
  │── 2. generate_hash(bytes, filename) → reproduces the same hash
  │
  │── 3. GET http://blockchain:8001/chain/find?hash={hash}
  │         ▼
  │       Blockchain Node
  │         │── Search all sealed blocks (reversed for recency)
  │         │── Also search _pending list
  │         └── Return transaction if found, else {}
  │
  │── 4. If found: valid = True, return block proof data
  │   If not found: valid = False, tamper detected
  │
  │── 5. INCR Redis stats counter
  │── 6. PUBLISH verification event to Redis
  │
  └── 7. Return { valid, receipt_id, block_index, merkle_root, ... }
```

### Real-Time WebSocket Flow

```
Admin Browser ──── WebSocket ────► Nginx ────► Backend /ws/transactions
                                                  │
                                                  │── 1. Read session cookie
                                                  │── 2. GET /api/auth/get-session
                                                  │── 3. Check role == "admin"
                                                  │── 4. SUBSCRIBE to Redis "transactions"
                                                  │
                                  Any upload/verify anywhere in system
                                                  │
                                                  │── Redis publishes event
                                                  │── WebSocket handler receives it
                                                  └── SEND to all connected admin browsers
```

---

## 17. WebSocket — Real-Time Feed

The WebSocket route (`/ws/transactions`) bridges Redis pub/sub to the browser. The flow:

1. Admin browser opens WebSocket connection.
2. Backend validates admin session via Better Auth.
3. Backend subscribes to Redis `"transactions"` channel using async Redis (`aioredis`).
4. For every message published on that channel, the backend calls `websocket.send_text(message)`.
5. Browser's `useWebSocket` hook parses the JSON and prepends the event to the messages list.
6. The dashboard's activity feed re-renders automatically showing the new event.

If the WebSocket disconnects (network issue, browser tab closed), the `useWebSocket` hook reconnects automatically using **exponential backoff with jitter** — doubling the wait time after each failure up to 30 seconds, with added random jitter to prevent all clients from reconnecting simultaneously (thundering herd prevention).

---

## 18. Scalability Design Decisions

| Decision | Why It Scales |
|---|---|
| **Blockchain as separate microservice** | Backend can be horizontally scaled (multiple replicas) independently of the blockchain node |
| **Redis as shared state** | Multiple backend replicas all read/write the same Redis — stateless backends possible |
| **Batch block sealing** | Reduces blockchain I/O from O(n) per-transaction to O(1) per batch |
| **Async Python (FastAPI + asyncio)** | Single-threaded backend handles thousands of concurrent requests via async I/O |
| **Connection pooling** | SQLAlchemy connection pool prevents database exhaustion under load |
| **Nginx rate limiting** | Protects backend from being overwhelmed by a single abusive client |
| **Redis LRU eviction** | Predictable memory usage even as activity log grows indefinitely |
| **Docker + Compose** | Each service can be scaled with `docker compose up --scale backend=3` |
| **Cloudflare R2** | Object storage scales infinitely; no disk capacity concerns on the server |
| **Activity log trim (LTRIM 0 499)** | Redis list never grows unboundedly — capped at 500 entries |
| **Reversed block search** | `reversed(self.chain)` means recent transactions are found faster, reducing average search time |

---

## 19. Security Architecture

| Threat | Mitigation |
|---|---|
| **Document tampering** | SHA-256 hash + Merkle root makes any modification detectable |
| **Unauthorized API access** | CORS restricts cross-origin requests; admin routes check JWT session |
| **SQL injection** | SQLAlchemy ORM parameterizes all queries; no raw SQL with user input |
| **Brute force / DDoS** | Nginx rate limiting (5/s uploads, 30/s API per IP) |
| **Clickjacking** | `X-Frame-Options: SAMEORIGIN` header on all responses |
| **MIME sniffing** | `X-Content-Type-Options: nosniff` header |
| **XSS** | `X-XSS-Protection: 1; mode=block` header; React auto-escapes output |
| **Unauthorized dashboard access** | Next.js Edge Middleware checks admin role before rendering any page |
| **Unauthorized WebSocket** | Session cookie validated + role check before accepting connection |
| **Credential exposure** | All secrets in environment variables, never hardcoded |
| **Large file attacks** | 10MB backend limit + 12MB Nginx limit |
| **Fake upload of already-registered file** | `file_hash` column has UNIQUE constraint — duplicate hashes are rejected |
| **Account banning** | Better Auth admin plugin supports banning users with reason and expiry |

---

## 20. File-by-File Code Reference

### Blockchain Service

| File | Purpose |
|---|---|
| `blockchain/block.py` | `MerkleTree` class (Merkle root computation) + `Block` class (block data structure, hash computation) |
| `blockchain/blockchain.py` | `Blockchain` class — manages chain, pending pool, batch sealing, Redis persist, chain validation |
| `blockchain/node.py` | FastAPI app exposing the blockchain as a REST API on port 8001 |
| `blockchain/requirements.txt` | `fastapi`, `uvicorn`, `redis`, `pydantic` |
| `Dockerfile.blockchain` | Python 3.11 slim image, runs `uvicorn node:app --port 8001` |

### Backend Service

| File | Purpose |
|---|---|
| `backend/main.py` | FastAPI app entry point — CORS config, router registration, health endpoint |
| `backend/utils.py` | `generate_hash()` (composite SHA-256) and `extract_pdf_text()` (PDF text extraction) |
| `backend/models.py` | SQLAlchemy ORM model for `receipts` table |
| `backend/storage.py` | Cloudflare R2 file upload/download via boto3 |
| `backend/routes/upload.py` | `POST /api/upload` — file validation, hashing, blockchain anchoring, event publish |
| `backend/routes/verify.py` | `POST /api/verify`, `GET /api/verify/{id}`, `GET /api/qr/{id}` — verification and QR |
| `backend/routes/chain.py` | Proxy routes forwarding chain data from blockchain node to frontend |
| `backend/routes/analytics.py` | Dashboard analytics: overview, activity feed, 24h timeline, service health |
| `backend/routes/ws.py` | WebSocket handler — admin auth + Redis pub/sub → browser real-time feed |
| `backend/requirements.txt` | All Python dependencies |
| `Dockerfile.backend` | Python 3.11 slim image, runs `uvicorn main:app --port 8000` |

### Frontend

| File | Purpose |
|---|---|
| `frontend/src/app/page.tsx` | Upload page with drag-and-drop, pipeline animation, result display |
| `frontend/src/app/verify/page.tsx` | Verification page — file upload or receipt ID lookup |
| `frontend/src/app/dashboard/page.tsx` | Admin analytics dashboard with charts, block explorer, live feed |
| `frontend/src/app/admin/page.tsx` | Admin control panel — service health, seal blocks, validate chain |
| `frontend/src/app/login/page.tsx` | Login page — Google/GitHub OAuth and email/password |
| `frontend/src/middleware.ts` | Edge middleware — redirects non-admin users away from protected routes |
| `frontend/src/lib/api.ts` | Axios instance with auth interceptor + all TypeScript types |
| `frontend/src/lib/auth.ts` | Better Auth server config — OAuth providers, admin plugin, session settings |
| `frontend/src/lib/auth-client.ts` | Better Auth browser SDK client |
| `frontend/src/lib/useWebSocket.ts` | React hook wrapping WebSocket with auto-reconnect and exponential backoff |
| `frontend/src/lib/utils.ts` | Tailwind class merge utility |
| `frontend/src/components/AuthGuard.tsx` | Client-side authentication guard wrapper component |

### Infrastructure

| File | Purpose |
|---|---|
| `docker-compose.yml` | Defines all 6 containers, networks, volumes, health checks, dependency order |
| `nginx/nginx.conf` | Nginx reverse proxy config — rate limiting, gzip, security headers, WebSocket |
| `postgres/01-better-auth.sql` | Auto-run SQL creating all Better Auth tables on first PostgreSQL startup |

---

## Summary Diagram — Full System in One View

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          DOCKER BRIDGE NETWORK (app-net)                  │
│                                                                            │
│  ┌──────────┐    ┌──────────────────────────────────────────────────┐    │
│  │  Nginx   │    │              Backend (FastAPI :8000)               │    │
│  │ :80      │───►│  /api/upload  → hash → blockchain POST           │    │
│  │Rate Limit│    │  /api/verify  → hash → blockchain GET            │    │
│  │Sec Headers    │  /api/chain/* → proxy to blockchain              │    │
│  │Gzip      │    │  /api/analytics/* → Redis + blockchain           │    │
│  └────┬─────┘    │  /ws/transactions → Redis sub → WebSocket        │    │
│       │          └───────────────────┬──────────────────────────────┘    │
│       │                              │  HTTP calls                        │
│       │          ┌───────────────────▼──────────────────────────────┐    │
│       │          │        Blockchain Node (FastAPI :8001)             │    │
│       │          │  Blockchain class: pending pool → batch seal      │    │
│       │          │  Block: SHA-256 + Merkle Tree                     │    │
│       │          │  Persists chain to Redis                          │    │
│       │          └──────────────────────────────────────────────────┘    │
│       │                                                                    │
│       │          ┌─────────────────┐   ┌──────────────────────────┐      │
│       │          │  Redis :6379    │   │  PostgreSQL :5432         │      │
│       │          │  - chain state  │   │  - user / session         │      │
│       │          │  - pub/sub      │   │  - account / verification │      │
│       │          │  - activity log │   │  (Better Auth schema)     │      │
│       │          │  - stats counters   └──────────────────────────┘      │
│       │          └─────────────────┘                                      │
│       │                                                                    │
│       ▼          ┌──────────────────────────────────────────────────┐    │
│  ┌────────┐      │         Frontend (Next.js :3000)                  │    │
│  │Browser │◄────►│  / → Upload page                                 │    │
│  └────────┘      │  /verify → Verify page                           │    │
│                  │  /dashboard → Admin dashboard (protected)         │    │
│                  │  /admin → Control panel (protected)               │    │
│                  │  Middleware: edge auth before page render         │    │
│                  └──────────────────────────────────────────────────┘    │
│                                                                            │
│                  ┌──────────────────────────────────────────────────┐    │
│                  │         Cloudflare R2 (External Object Store)     │    │
│                  │         Stores actual uploaded files (boto3/S3)   │    │
│                  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

*Documentation generated for ChainVerify v2.0 — Enterprise Digital Bill Verification System*

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, verify, ws, chain

app = FastAPI(title="Receipt Verification API")

# CORS_ORIGIN = what the browser sends as Origin (user-facing URL)
# FRONTEND_URL = internal Docker service URL (used for WebSocket session auth)
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# CORS: allow the browser-facing origin (with credentials for auth headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")   # /api/upload
app.include_router(verify.router, prefix="/api")   # /api/verify, /api/qr/{id}
app.include_router(chain.router, prefix="/api")    # /api/chain, /api/chain/stats
app.include_router(ws.router)                      # /ws/transactions (no /api prefix)

@app.get("/")
def root():
    return {"status": "Receipt Verification System Running"}

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, verify, ws, chain, analytics

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="ChainVerify API",
    version="2.0",
    description="Enterprise Digital Bill Verification System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(verify.router, prefix="/api")
app.include_router(chain.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ws.router)


@app.get("/")
def root():
    return {"status": "ChainVerify API Running", "version": "2.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}

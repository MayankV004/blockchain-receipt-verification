from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, verify

app = FastAPI(title="Receipt Verification API")

# Add CORS middleware for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(verify.router)

@app.get("/")
def root():
    return {"status": "Receipt Verification System Running"}

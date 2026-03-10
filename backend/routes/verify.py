from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from utils import generate_hash
import os, requests, qrcode, io

router = APIRouter()

# Bug #4 fix: read BLOCKCHAIN_URL from environment (docker-compose injects this)
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://blockchain:8001")
# Bug #6 fix: read FRONTEND_URL from environment for correct QR code base URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.post("/verify")
async def verify_receipt(file: UploadFile = File(...)):
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes, file.filename)
    
    try:
        response = requests.get(f"{BLOCKCHAIN_URL}/chain/find?hash={file_hash}")
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with blockchain node: {str(e)}")
    
    if data:
        return {"status": "VALID ✅", "receipt_id": data.get("receipt_id"), "uploader": data.get("uploader")}
    return {"status": "INVALID ❌ — Receipt not found or tampered"}

@router.get("/qr/{receipt_id}")
def get_qr(receipt_id: str):
    # Bug #6 fix: use FRONTEND_URL env var and embed receipt_id in the QR link
    url = f"{FRONTEND_URL}/verify?id={receipt_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from utils import generate_hash
import requests, qrcode, io

router = APIRouter()

BLOCKCHAIN_URL = "http://blockchain:8001"

@router.post("/verify")
async def verify_receipt(file: UploadFile = File(...)):
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes, file.filename)
    
    try:
        response = requests.get(f"{BLOCKCHAIN_URL}/chain/find?hash={file_hash}")
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        try:
             response = requests.get(f"http://localhost:8001/chain/find?hash={file_hash}")
             response.raise_for_status()
             data = response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with blockchain node: {str(e)}")
    
    if data:
        return {"status": "VALID ✅", "receipt_id": data.get("receipt_id"), "uploader": data.get("uploader")}
    return {"status": "INVALID ❌ — Receipt not found or tampered"}

@router.get("/qr/{receipt_id}")
def get_qr(receipt_id: str):
    url = f"http://localhost:3000/verify" # Link to frontend verify page
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

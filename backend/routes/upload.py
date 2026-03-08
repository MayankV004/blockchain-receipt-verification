from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid, requests
from storage import upload_file
from utils import generate_hash

router = APIRouter()

# The blockchain container will run on the network 'app-net' and be reachable at 'http://blockchain:8001'
BLOCKCHAIN_URL = "http://blockchain:8001"

@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...), uploader: str = "anonymous"):
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes)
    receipt_id = str(uuid.uuid4())
    
    # Store file locally (mocking Cloudflare R2)
    upload_file(file_bytes, receipt_id + "_" + file.filename)
    
    # Store hash on blockchain
    try:
        response = requests.post(f"{BLOCKCHAIN_URL}/chain/add", json={
            "receipt_id": receipt_id,
            "file_hash": file_hash,
            "uploader": uploader
        })
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        # Fallback to localhost if not running in Docker
        try:
             response = requests.post("http://localhost:8001/chain/add", json={
                "receipt_id": receipt_id,
                "file_hash": file_hash,
                "uploader": uploader
            })
             response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with blockchain node: {str(e)}")
    
    return {"receipt_id": receipt_id, "file_hash": file_hash, "status": "Stored on blockchain"}

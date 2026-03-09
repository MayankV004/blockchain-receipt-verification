import requests
import hashlib
import os

BASE_URL = "http://localhost:8000"

def create_raw_pdf(filename: str, price: str):
    """Creates a very basic valid PDF structure containing the given price text"""
    content = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 61 >>
stream
BT
/F1 24 Tf
100 700 Td
(Price: {price}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000222 00000 n 
0000000334 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
424
%%EOF
"""
    with open(filename, "wb") as f:
        f.write(content.encode('utf-8'))

def test_system():
    print("=========================================")
    print("🧾 Composite PDF Verification Test")
    print("=========================================\n")

    # 1. Create a "real" PDF bill
    create_raw_pdf("original_bill.pdf", "$100.00")
    print("✅ Created 'original_bill.pdf' with Price: $100.00")

    # 2. Upload the real bill
    print("--- 1. Uploading the Original PDF ---")
    with open("original_bill.pdf", "rb") as f:
        files = {"file": ("original_bill.pdf", f, "application/pdf")}
        response = requests.post(f"{BASE_URL}/upload", files=files, data={"uploader": "Tester"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")
        
    # 3. Verify the real bill
    print("--- 2. Verifying the Original PDF ---")
    with open("original_bill.pdf", "rb") as f:
        files = {"file": ("original_bill.pdf", f, "application/pdf")}
        response = requests.post(f"{BASE_URL}/verify", files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")

    # 4. Create a "fake" PDF bill
    create_raw_pdf("fake_bill.pdf", "$999.00")
    print("⚠️ Created 'fake_bill.pdf' with TAMPERED Price: $999.00")

    # 5. Verify the fake bill
    print("--- 3. Verifying the Fake PDF ---")
    with open("fake_bill.pdf", "rb") as f:
        files = {"file": ("fake_bill.pdf", f, "application/pdf")}
        response = requests.post(f"{BASE_URL}/verify", files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    try:
        test_system()
    except Exception as e:
        print(f"❌ Failed: {e}")

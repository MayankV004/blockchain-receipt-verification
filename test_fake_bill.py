import requests
import os

BASE_URL = "http://localhost:8000"

def test_system():
    print("=========================================")
    print("🧾 Receipt Verification System Test")
    print("=========================================\n")

    # 1. Create a "real" bill
    real_bill_content = b"Restaurant Bill\nDate: 2026-03-09\nItem: Pizza\nPrice: $20.00\n"
    with open("real_bill.txt", "wb") as f:
        f.write(real_bill_content)
    print("✅ Created 'real_bill.txt' with the following content:")
    print(real_bill_content.decode())

    # 2. Upload the real bill
    print("--- 1. Uploading the Real Bill ---")
    with open("real_bill.txt", "rb") as f:
        files = {"file": ("real_bill.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/upload", files=files, data={"uploader": "Tester"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}\n")
        
    # 3. Verify the real bill
    print("--- 2. Verifying the Real Bill ---")
    with open("real_bill.txt", "rb") as f:
        files = {"file": ("real_bill.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/verify", files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}\n")

    # 4. Create a "fake" bill by modifying the price
    fake_bill_content = b"Restaurant Bill\nDate: 2026-03-09\nItem: Pizza\nPrice: $200.00\n"
    with open("fake_bill.txt", "wb") as f:
        f.write(fake_bill_content)
    print("⚠️ Created 'fake_bill.txt' (Modified the price from $20.00 to $200.00)")
    print(fake_bill_content.decode())

    # 5. Verify the fake bill
    print("--- 3. Verifying the Fake Bill ---")
    with open("fake_bill.txt", "rb") as f:
        files = {"file": ("fake_bill.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/verify", files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    try:
        test_system()
    except requests.exceptions.ConnectionError:
        print(f"❌ Failed to connect to {BASE_URL}. Make sure your backend server is running!")
    finally:
        # Cleanup
        if os.path.exists("real_bill.txt"):
            os.remove("real_bill.txt")
        if os.path.exists("fake_bill.txt"):
            os.remove("fake_bill.txt")

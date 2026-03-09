import hashlib
import io
import PyPDF2

def extract_pdf_text(file_bytes: bytes) -> str:
    """Extracts text content from a PDF byte array."""
    text_content = ""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_content += extracted + "\n"
    except Exception as e:
        print(f"Failed to extract text from PDF: {e}")
    return text_content.strip()

def generate_hash(file_bytes: bytes, filename: str = "") -> str:
    """
    Generates a composite SHA-256 hash.
    If it's a PDF, hashes: filename + file_bytes + extracted_text
    Otherwise, hashes: filename + file_bytes
    """
    composite_data = bytearray()
    
    if filename:
        composite_data.extend(filename.encode('utf-8'))
        
    composite_data.extend(file_bytes)
    
    if filename.lower().endswith('.pdf'):
        extracted_text = extract_pdf_text(file_bytes)
        if extracted_text:
            composite_data.extend(extracted_text.encode('utf-8'))
            
    return hashlib.sha256(composite_data).hexdigest()

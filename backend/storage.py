import os
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

load_dotenv()

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

def upload_file(file_bytes: bytes, filename: str) -> str:
    s3.put_object(Bucket=R2_BUCKET_NAME, Key=filename, Body=file_bytes)
    return filename

def get_file(filename: str) -> bytes:
    response = s3.get_object(Bucket=R2_BUCKET_NAME, Key=filename)
    return response["Body"].read()

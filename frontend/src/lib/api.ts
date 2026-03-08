import axios from "axios";

// Access the API securely
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export interface UploadResponse {
  receipt_id: string;
  file_hash: string;
  status: string;
}

export interface VerifyResponse {
  status: string;
  receipt_id?: string;
  uploader?: string;
}

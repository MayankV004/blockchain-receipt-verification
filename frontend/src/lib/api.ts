import axios from "axios";
import { getSession } from "@/lib/auth-client";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

// Attach Better Auth session token for admin API calls to FastAPI
api.interceptors.request.use(async (config) => {
  const sessionRes = await getSession();
  const data = sessionRes?.data as any; // Ignore strict typing error on getSession nested data
  if (data?.session?.token) {
    config.headers.Authorization = `Bearer ${data.session.token}`;
  }
  return config;
});

export type UploadResponse = {
  receipt_id: string;
  file_hash: string;
  status: string;
};

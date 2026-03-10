import axios from "axios";
import { getSession } from "@/lib/auth-client";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

api.interceptors.request.use(async (config) => {
  const sessionRes = await getSession();
  const data = sessionRes?.data as Record<string, unknown> | undefined;
  const session = data?.session as Record<string, unknown> | undefined;
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export type UploadResponse = {
  receipt_id: string;
  file_hash: string;
  filename: string;
  file_size: number;
  uploader: string;
  timestamp: number;
  status: string;
  blockchain: Record<string, unknown>;
};

export type VerifyResponse = {
  status: string;
  valid: boolean;
  receipt_id?: string;
  uploader?: string;
  file_hash: string;
  block_index?: number | string;
  block_hash?: string;
  merkle_root?: string;
  original_timestamp?: number;
  message?: string;
};

export type ChainStats = {
  total_blocks: number;
  total_transactions: number;
  pending_transactions: number;
  chain_valid: boolean;
  uptime_seconds: number;
  tx_per_second: number;
  blocks_mined: number;
  verifications: number;
  valid_verifications: number;
  invalid_verifications: number;
};

export type BlockData = {
  index: number;
  hash: string;
  previous_hash: string;
  merkle_root: string;
  tx_count: number;
  timestamp: number;
  nonce: number;
  transactions: Array<Record<string, unknown>>;
};

export type ServiceHealth = {
  overall: string;
  services: Record<string, {
    status: string;
    latency_ms?: number;
    error?: string;
    memory_used?: string;
    details?: Record<string, unknown>;
  }>;
};

export type ActivityItem = {
  type: "upload" | "verification";
  receipt_id?: string;
  file_hash: string;
  filename?: string;
  uploader?: string;
  is_valid?: boolean;
  timestamp: number;
};

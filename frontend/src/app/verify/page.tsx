"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  FileSearch,
  Hash,
  User,
  ArrowLeft,
  FileImage,
  FileText,
  Clock,
  Blocks,
  GitBranch,
  Copy,
  Check,
  Fingerprint,
  ScanLine,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, VerifyResponse } from "@/lib/api";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"file" | "id">("file");
  const [file, setFile] = useState<File | null>(null);
  const [receiptId, setReceiptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const id = params.get("id");
    if (id) {
      setReceiptId(id);
      setMode("id");
    }
  }, [params]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted?.length > 0) {
      setFile(accepted[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    disabled: loading || mode === "id",
  });

  const handleVerify = async () => {
    if (mode === "file" && !file) return toast.error("Select a file first");
    if (mode === "id" && !receiptId.trim()) return toast.error("Enter a receipt ID");

    setLoading(true);
    try {
      let data: VerifyResponse;
      if (mode === "id") {
        const res = await api.get<VerifyResponse>(`/verify/${encodeURIComponent(receiptId.trim())}`);
        data = res.data;
      } else {
        const formData = new FormData();
        formData.append("file", file!);
        const res = await api.post<VerifyResponse>("/verify", formData);
        data = res.data;
      }
      setResult(data);
      if (data.valid) {
        toast.success("Document Authenticated");
      } else {
        toast.error("Verification Failed");
      }
    } catch {
      toast.error("Verification failed. Check services.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setReceiptId("");
    setCopied(null);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 2000);
  };

  const isValid = result?.valid ?? result?.status?.includes("VALID");

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <ScanLine className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">
                Document Verification
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <span className="text-gradient from-white via-white/90 to-white/60">
                Authenticate
              </span>{" "}
              <span className="text-gradient from-blue-400 to-emerald-400">
                Documents
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-lg mx-auto">
              Verify cryptographic signatures against the immutable blockchain ledger.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="verify-input"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col gap-5"
              >
                {/* Mode Tabs */}
                <div className="flex gap-1 p-1 glass rounded-xl">
                  {[
                    { key: "file" as const, label: "Verify by File", icon: FileSearch },
                    { key: "id" as const, label: "Verify by Receipt ID", icon: Hash },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => { setMode(tab.key); setResult(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                          mode === tab.key
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {mode === "file" ? (
                  <div
                    {...getRootProps()}
                    className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? "border-blue-400 bg-blue-500/10 scale-[1.02]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-blue-500/30 hover:bg-white/[0.03]"
                    } ${loading ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <input {...getInputProps()} />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className={`p-4 rounded-2xl transition-all ${isDragActive ? "scale-110 bg-blue-500/20" : "bg-white/[0.04]"}`}>
                        {file ? (
                          file.type?.includes("image") ? <FileImage className="w-8 h-8 text-blue-400" /> : <FileText className="w-8 h-8 text-blue-400" />
                        ) : (
                          <FileSearch className={`w-8 h-8 ${isDragActive ? "text-blue-400" : "text-zinc-500"}`} />
                        )}
                      </div>
                      {file ? (
                        <div className="flex flex-col items-center">
                          <p className="font-semibold text-blue-300 text-lg truncate max-w-[300px]">{file.name}</p>
                          <p className="text-sm text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-medium text-zinc-300 mb-1">
                            <span className="text-blue-400">Click to browse</span> or drag & drop
                          </p>
                          <p className="text-sm text-zinc-600">Upload the document you want to verify</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Fingerprint className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter receipt ID..."
                      value={receiptId}
                      onChange={(e) => setReceiptId(e.target.value)}
                      disabled={loading}
                      className="w-full glass rounded-xl py-4 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  onClick={handleVerify}
                  disabled={(mode === "file" && !file) || (mode === "id" && !receiptId.trim()) || loading}
                  className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                    (mode === "file" && !file) || (mode === "id" && !receiptId.trim())
                      ? "bg-white/[0.04] text-zinc-600 cursor-not-allowed border border-white/[0.06]"
                      : loading
                        ? "bg-blue-600/80 text-white cursor-wait"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-500/30"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying on Blockchain...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Verify Document
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="verify-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-strong rounded-2xl p-8 relative overflow-hidden ${isValid ? "glow-emerald" : "glow-red"}`}
              >
                <div className={`absolute top-0 right-0 w-80 h-80 blur-[100px] rounded-full pointer-events-none ${isValid ? "bg-emerald-500/[0.07]" : "bg-red-500/[0.07]"}`} />

                <div className="relative z-10">
                  {/* Status header */}
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shrink-0 ${
                      isValid ? "bg-emerald-500/15 border-emerald-500/20" : "bg-red-500/15 border-red-500/20"
                    }`}>
                      {isValid ? <ShieldCheck className="h-7 w-7 text-emerald-400" /> : <ShieldAlert className="h-7 w-7 text-red-400" />}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isValid ? "text-emerald-400" : "text-red-400"}`}>
                        {isValid ? "Signature Verified" : "Verification Failed"}
                      </h3>
                      <p className="text-zinc-500 text-sm">
                        {isValid
                          ? "Cryptographic hash matches an immutable blockchain record"
                          : "No matching record found — document may be tampered or unregistered"}
                      </p>
                    </div>
                  </div>

                  {isValid && (
                    <div className="space-y-5">
                      {/* Hash */}
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> SHA-256 Signature
                        </label>
                        <div
                          className="bg-black/30 p-4 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3 group cursor-pointer hover:border-white/[0.1] transition-colors"
                          onClick={() => result.file_hash && copyText(result.file_hash, "hash")}
                        >
                          <p className="text-xs font-mono text-zinc-400 break-all">{result.file_hash}</p>
                          {copied === "hash" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-600 shrink-0" />}
                        </div>
                      </div>

                      {/* Receipt ID */}
                      {result.receipt_id && (
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                            <Fingerprint className="w-3 h-3" /> Receipt ID
                          </label>
                          <div
                            className="bg-black/30 p-4 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3 group cursor-pointer hover:border-white/[0.1] transition-colors"
                            onClick={() => copyText(result.receipt_id!, "receipt")}
                          >
                            <p className="text-sm font-mono text-indigo-300 break-all">{result.receipt_id}</p>
                            {copied === "receipt" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-600 shrink-0" />}
                          </div>
                        </div>
                      )}

                      {/* Block Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {result.block_index !== undefined && (
                          <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Blocks className="w-3 h-3 text-indigo-400" />
                              <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Block</p>
                            </div>
                            <p className="text-sm text-white font-bold">#{String(result.block_index)}</p>
                          </div>
                        )}
                        {result.uploader && (
                          <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <User className="w-3 h-3 text-purple-400" />
                              <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Uploader</p>
                            </div>
                            <p className="text-sm text-zinc-300 truncate">{result.uploader}</p>
                          </div>
                        )}
                        {result.original_timestamp && (
                          <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Anchored</p>
                            </div>
                            <p className="text-sm text-zinc-300">{new Date(result.original_timestamp * 1000).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {/* Merkle Root */}
                      {result.merkle_root && (
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                            <GitBranch className="w-3 h-3" /> Merkle Root
                          </label>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                            <p className="text-[11px] font-mono text-zinc-500 break-all">{result.merkle_root}</p>
                          </div>
                        </div>
                      )}

                      {/* Block Hash */}
                      {result.block_hash && (
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> Block Hash
                          </label>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                            <p className="text-[11px] font-mono text-zinc-500 break-all">{result.block_hash}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-white/[0.06]">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-white/[0.06]"
                    >
                      <ArrowLeft className="w-4 h-4" /> Verify Another
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

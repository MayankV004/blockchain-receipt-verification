"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  File,
  UploadCloud,
  XCircle,
  FileBadge,
  User,
  RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, VerifyResponse } from "@/lib/api";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      disabled: loading || !!result,
    });

  const handleVerify = async () => {
    if (!file) {
      toast.error("Please supply a file to verify");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post<VerifyResponse>("/verify", formData);
      setResult(data);
      if (data.status.includes("VALID")) {
        toast.success("Cryptographic match found!");
      } else {
        toast.error("Integrity check failed.");
      }
    } catch (err) {
      setResult({ status: "ERROR — Blockchain node unresponsive" });
      toast.error("Network verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const isValid = result?.status?.includes("VALID");
  const isError =
    result?.status?.includes("ERROR") || result?.status?.includes("INVALID");

  return (
    <div className="w-full max-w-2xl px-4 py-12 mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Audit & Verify
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
          Upload any document to compare its SHA-256 signature against the
          blockchain ledger. Zero-knowledge proof format.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="verify-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Audit Dropzone */}
            <div
              {...getRootProps()}
              className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-indigo-400 bg-indigo-500/10"
                  : isDragReject
                    ? "border-red-400 bg-red-500/10"
                    : "border-slate-700 bg-[#111116] hover:border-indigo-500/50 hover:bg-[#16161D]"
              } ${loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              <input {...getInputProps()} />

              <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                <div
                  className={`p-4 rounded-full transition-transform duration-500 ${isDragActive ? "scale-110 bg-indigo-500/20" : "bg-slate-800"}`}
                >
                  {file ? (
                    <File className="w-8 h-8 text-indigo-400" />
                  ) : (
                    <UploadCloud
                      className={`w-8 h-8 ${isDragActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300"}`}
                    />
                  )}
                </div>

                {file ? (
                  <div className="flex flex-col items-center">
                    <p className="font-semibold text-indigo-300 text-lg mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500">Ready for scan</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-medium text-slate-300 mb-1">
                      Drop the document here
                    </p>
                    <p className="text-sm text-slate-500">
                      Or click to select a file from your device
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={!file || loading}
              className={`w-full relative overflow-hidden flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                !file
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-slate-200 shadow-xl shadow-white/10"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Querying Ledger...
                </>
              ) : (
                <>Run Integrity Check</>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="verify-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full border shadow-2xl rounded-2xl p-8 relative overflow-hidden ${
              isValid
                ? "bg-[#111116] border-green-500/20 shadow-green-900/20"
                : "bg-[#1A0F14] border-red-500/20 shadow-red-900/20"
            }`}
          >
            {/* Dynamic Glow */}
            <div
              className={`absolute top-0 right-0 w-64 h-64 blur-[120px] rounded-full ${isValid ? "bg-green-500/20" : "bg-red-500/20"}`}
            />

            <div className="relative z-10">
              <div className="flex flex-col items-center text-center pb-8 border-b border-white/5 mb-8">
                <div
                  className={`h-20 w-20 rounded-full flex items-center justify-center border mb-6 ${
                    isValid
                      ? "bg-green-500/20 border-green-500/30"
                      : "bg-red-500/20 border-red-500/30"
                  }`}
                >
                  {isValid ? (
                    <ShieldCheck className="h-10 w-10 text-green-400" />
                  ) : (
                    <XCircle className="h-10 w-10 text-red-500" />
                  )}
                </div>

                <h2
                  className={`text-2xl font-black uppercase tracking-widest ${isValid ? "text-green-400" : "text-red-500"}`}
                >
                  {isValid ? "Authentic" : "Invalid / Tampered"}
                </h2>
                <p className="mt-2 text-slate-400 text-sm">
                  {isValid
                    ? "The digital signature exactly matches a record on the blockchain."
                    : "We could not find a matching cryptographic signature. The file may have been altered."}
                </p>
              </div>

              {isValid && (
                <div className="grid gap-4 mb-8">
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex items-start gap-4">
                    <FileBadge className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Receipt Identifier
                      </p>
                      <p className="text-sm font-mono text-slate-200">
                        {result.receipt_id}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex items-start gap-4">
                    <User className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Origin Node / Uploader
                      </p>
                      <p className="text-sm font-medium text-slate-200">
                        {result.uploader || "Anonymous"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" /> Start New Audit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  FileSearch,
  CheckCircle2,
  XCircle,
  Hash,
  User,
  ArrowLeft,
  FileImage,
  FileBadge,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

type VerifyResponse = {
  status: string;
  receipt_id?: string;
  uploader?: string;
};

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "text/plain": [".txt"],
        "image/jpeg": [".jpeg", ".jpg"],
        "image/png": [".png"],
      },
      maxFiles: 1,
      disabled: loading,
    });

  const handleVerify = async () => {
    if (!file) return toast.error("Please provide a file to verify.");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post<VerifyResponse>("/verify", formData);
      setResult(data);
      if (data.status.includes("VALID")) {
        toast.success("Document Authenticated");
      } else {
        toast.error("Document Invalid or Tampered");
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl px-4 py-12 mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white/90 to-emerald-400 mb-4">
          Authenticate Document
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
          Upload a document to verify its cryptographic signature against our
          blockchain ledger.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="verify-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col gap-6"
          >
            <div
              {...getRootProps()}
              className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-blue-400 bg-blue-500/10"
                  : isDragReject
                    ? "border-red-400 bg-red-500/10"
                    : "border-slate-700 bg-[#111116] hover:border-blue-500/50 hover:bg-[#16161D]"
              } ${loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <input {...getInputProps()} />

              <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                <div
                  className={`p-4 rounded-full transition-transform duration-500 ${isDragActive ? "scale-110 bg-blue-500/20" : "bg-slate-800"}`}
                >
                  {file ? (
                    file.type.includes("image") ? (
                      <FileImage className="w-8 h-8 text-blue-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-blue-400" />
                    )
                  ) : (
                    <FileSearch
                      className={`w-8 h-8 ${isDragActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"}`}
                    />
                  )}
                </div>

                {file ? (
                  <div className="flex flex-col items-center">
                    <p className="font-semibold text-blue-300 text-lg mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-medium text-slate-300 mb-1">
                      <span className="text-blue-400">Click to browse</span> or
                      drag and drop file to verify
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
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 hover:shadow-blue-500/30"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  Verifying on Blockchain...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze Document
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full bg-[#111116] border shadow-2xl rounded-2xl p-8 relative overflow-hidden ${
              result.status.includes("VALID")
                ? "border-emerald-500/20 shadow-emerald-900/20"
                : "border-red-500/20 shadow-red-900/20"
            }`}
          >
            {/* Status Glow */}
            <div
              className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full transition-colors ${
                result.status.includes("VALID")
                  ? "bg-emerald-500/10"
                  : "bg-red-500/10"
              }`}
            />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 pb-6 border-b border-white/5 text-center sm:text-left">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center border shrink-0 mx-auto sm:mx-0 ${
                    result.status.includes("VALID")
                      ? "bg-emerald-500/20 border-emerald-500/30"
                      : "bg-red-500/20 border-red-500/30"
                  }`}
                >
                  {result.status.includes("VALID") ? (
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-2xl font-bold mb-1 ${
                      result.status.includes("VALID")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {result.status.includes("VALID")
                      ? "Signature Verified"
                      : "Verification Failed"}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {result.status.includes("VALID")
                      ? "This document's cryptographic hash exactly matches an immutable record stored on the blockchain."
                      : "We could not find a matching cryptographic record. The document may have been tampered with or was never anchored."}
                  </p>
                </div>
              </div>

              {result.status.includes("VALID") && result.receipt_id && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 block flex items-center gap-2">
                      <FileBadge className="w-3.5 h-3.5" /> Blockchain TX /
                      Receipt ID
                    </label>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <p className="text-sm font-mono text-blue-300 break-all">
                        {result.receipt_id}
                      </p>
                    </div>
                  </div>

                  {result.uploader && (
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 block flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Registered Identifier
                        (Uploader)
                      </label>
                      <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                        <p className="text-sm font-mono text-slate-300 break-all leading-relaxed">
                          {result.uploader}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-8 flex justify-center mt-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" /> Verify Another Document
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

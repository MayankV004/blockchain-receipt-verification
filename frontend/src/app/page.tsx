"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ChevronRight,
  Hash,
  User,
  FileImage,
  FileBadge,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, UploadResponse } from "@/lib/api";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploader, setUploader] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

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
      disabled: loading || !!result,
    });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploader", uploader || "anonymous");

    try {
      const { data } = await api.post<UploadResponse>("/upload", formData);
      setResult(data);
      toast.success("Successfully secured on blockchain!");
    } catch (err) {
      toast.error("Upload failed. Ensure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setUploader("");
  };

  return (
    <div className="w-full max-w-2xl px-4 py-12 mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white/90 to-purple-300 mb-4">
          Secure Digital Receipts
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
          Upload your billing documents. We automatically calculate the SHA-256
          hash and anchor it immutably to the blockchain.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="upload-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col gap-6"
          >
            {/* Elegant Uploader Name Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Identified Origin (Optional Uploader Name)"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                disabled={loading}
                className="w-full bg-[#111116] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Premium Drag and Drop Zone */}
            <div
              {...getRootProps()}
              className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-indigo-400 bg-indigo-500/10"
                  : isDragReject
                    ? "border-red-400 bg-red-500/10"
                    : "border-slate-700 bg-[#111116] hover:border-indigo-500/50 hover:bg-[#16161D]"
              } ${loading || result ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              {/* Subtle background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

              <input {...getInputProps()} />

              <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                <div
                  className={`p-4 rounded-full transition-transform duration-500 ${isDragActive ? "scale-110 bg-indigo-500/20" : "bg-slate-800"}`}
                >
                  {file ? (
                    file.type.includes("image") ? (
                      <FileImage className="w-8 h-8 text-indigo-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-indigo-400" />
                    )
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
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-medium text-slate-300 mb-1">
                      <span className="text-indigo-400">Click to browse</span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-sm text-slate-500">
                      Supports PDF, TXT, PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full relative overflow-hidden flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                !file
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50 hover:shadow-indigo-500/30"
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
                  Anchoring to Blockchain...
                </>
              ) : (
                <>
                  Secure Document
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="success-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#111116] border border-green-500/20 shadow-2xl shadow-green-900/20 rounded-2xl p-8 relative overflow-hidden"
          >
            {/* Success Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    Successfully Anchored
                  </h3>
                  <p className="text-green-400 text-sm font-medium">
                    Immutable record created
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 block flex items-center gap-2">
                    <FileBadge className="w-3.5 h-3.5" /> Receipt / Tx ID
                  </label>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 relative group cursor-auto">
                    <p className="text-sm font-mono text-indigo-300 break-all">
                      {result.receipt_id}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 block flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> SHA-256 Signature
                  </label>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-mono text-slate-300 break-all leading-relaxed">
                      {result.file_hash}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-between border-t border-white/5 mt-8">
                  <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 shrink-0 mx-auto sm:mx-0">
                    <img
                      src={`${api.defaults.baseURL}/qr/${result.receipt_id}`}
                      alt="Verification QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="text-center sm:text-right flex-1 w-full">
                    <p className="text-sm text-slate-400 mb-4 max-w-[200px] mx-auto sm:ml-auto mr-0">
                      Scan this verification code or share the Receipt ID to
                      prove authenticity.
                    </p>
                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                    >
                      Process Another Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

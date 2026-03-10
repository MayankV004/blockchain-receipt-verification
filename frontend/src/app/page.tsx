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
  Shield,
  Zap,
  Lock,
  Blocks,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  Fingerprint,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { api, UploadResponse } from "@/lib/api";

const features = [
  {
    icon: Lock,
    title: "SHA-256 Hashing",
    description: "Military-grade cryptographic fingerprinting of every document",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: Blocks,
    title: "Blockchain Anchoring",
    description: "Immutable records stored on a distributed ledger with Merkle proofs",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description: "Real-time cryptographic verification against the blockchain",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "Tamper Detection",
    description: "Any modification invalidates the cryptographic signature",
    color: "from-emerald-500 to-teal-600",
  },
];

const pipelineSteps = [
  { label: "Reading File", description: "Parsing document bytes" },
  { label: "Computing Hash", description: "SHA-256 fingerprint generation" },
  { label: "Anchoring", description: "Writing to blockchain ledger" },
  { label: "Confirming", description: "Block confirmation & QR generation" },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploader, setUploader] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [copied, setCopied] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
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
    disabled: loading || !!result,
  });

  const handleUpload = async () => {
    if (!file) return toast.error("Select a file first");

    setLoading(true);
    setPipelineStep(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploader", uploader || "anonymous");

    const stepTimer = setInterval(() => {
      setPipelineStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 600);

    try {
      const { data } = await api.post<UploadResponse>("/upload", formData);
      clearInterval(stepTimer);
      setPipelineStep(3);
      await new Promise((r) => setTimeout(r, 500));
      setResult(data);
      toast.success("Document secured on blockchain!");
    } catch {
      clearInterval(stepTimer);
      toast.error("Upload failed. Ensure services are running.");
    } finally {
      setLoading(false);
      setPipelineStep(-1);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setUploader("");
    setPipelineStep(-1);
    setCopied(null);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const fmtBytes = (b: number) => {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
                Enterprise Bill Verification
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="text-gradient from-white via-white/90 to-white/60">
                Secure Your Digital
              </span>
              <br />
              <span className="text-gradient from-indigo-400 via-purple-400 to-pink-400">
                Documents Forever
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Upload billing documents and anchor their cryptographic fingerprint
              to an immutable blockchain. Verify authenticity instantly.
            </p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="group relative"
                >
                  <div className="relative glass rounded-2xl p-5 h-full hover:border-white/[0.1] transition-all">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{feat.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Upload Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="flex flex-col gap-5"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Uploader identity (optional)"
                      value={uploader}
                      onChange={(e) => setUploader(e.target.value)}
                      disabled={loading}
                      className="w-full glass rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div
                    {...getRootProps()}
                    className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? "border-indigo-400 bg-indigo-500/10 scale-[1.02]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-white/[0.03]"
                    } ${loading || result ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/[0.03] to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <input {...getInputProps()} />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className={`p-4 rounded-2xl transition-all duration-500 ${isDragActive ? "scale-110 bg-indigo-500/20" : "bg-white/[0.04]"}`}>
                        {file ? (
                          file.type?.includes("image") ? <FileImage className="w-8 h-8 text-indigo-400" /> : <FileText className="w-8 h-8 text-indigo-400" />
                        ) : (
                          <UploadCloud className={`w-8 h-8 ${isDragActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                        )}
                      </div>
                      {file ? (
                        <div className="flex flex-col items-center">
                          <p className="font-semibold text-indigo-300 text-lg mb-1 truncate max-w-[300px]">{file.name}</p>
                          <p className="text-sm text-zinc-500">{fmtBytes(file.size)}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-medium text-zinc-300 mb-1">
                            <span className="text-indigo-400">Click to browse</span> or drag & drop
                          </p>
                          <p className="text-sm text-zinc-600">PDF, TXT, PNG, JPG — up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pipeline Viz */}
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass rounded-2xl p-6 overflow-hidden"
                      >
                        <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-4">Processing Pipeline</p>
                        <div className="flex items-center gap-2">
                          {pipelineSteps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 flex-1">
                              <div className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                  idx <= pipelineStep
                                    ? idx === pipelineStep
                                      ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30"
                                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-white/[0.04] text-zinc-600 border border-white/[0.06]"
                                }`}>
                                  {idx < pipelineStep ? <Check className="w-3.5 h-3.5" /> : idx === pipelineStep ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> : idx + 1}
                                </div>
                                <p className={`text-[10px] mt-2 text-center font-medium ${idx <= pipelineStep ? "text-zinc-300" : "text-zinc-600"}`}>{step.label}</p>
                              </div>
                              {idx < pipelineSteps.length - 1 && (
                                <div className={`h-px flex-1 transition-colors duration-500 mb-5 ${idx < pipelineStep ? "bg-emerald-500/30" : "bg-white/[0.06]"}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                      !file
                        ? "bg-white/[0.04] text-zinc-600 cursor-not-allowed border border-white/[0.06]"
                        : loading
                          ? "bg-indigo-600/80 text-white cursor-wait"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/30 glow-brand"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Anchoring to Blockchain...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        Secure Document on Chain
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                /* Success */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-strong rounded-2xl p-8 relative overflow-hidden glow-emerald"
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.07] blur-[100px] rounded-full pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
                      <div className="h-14 w-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Successfully Anchored</h3>
                        <p className="text-emerald-400 text-sm font-medium">Immutable record created on block</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                          <QrCode className="w-3 h-3" /> Receipt ID
                        </label>
                        <div
                          className="bg-black/30 p-4 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3 group cursor-pointer hover:border-white/[0.1] transition-colors"
                          onClick={() => copyText(result.receipt_id, "receipt")}
                        >
                          <p className="text-sm font-mono text-indigo-300 break-all">{result.receipt_id}</p>
                          {copied === "receipt" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> SHA-256 Signature
                        </label>
                        <div
                          className="bg-black/30 p-4 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3 group cursor-pointer hover:border-white/[0.1] transition-colors"
                          onClick={() => copyText(result.file_hash, "hash")}
                        >
                          <p className="text-xs font-mono text-zinc-400 break-all leading-relaxed">{result.file_hash}</p>
                          {copied === "hash" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-1">Filename</p>
                          <p className="text-sm text-zinc-300 truncate">{result.filename}</p>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-1">Size</p>
                          <p className="text-sm text-zinc-300">{fmtBytes(result.file_size)}</p>
                        </div>
                      </div>

                      <div className="pt-5 flex flex-col sm:flex-row items-center gap-6 border-t border-white/[0.06]">
                        <div className="bg-white p-2.5 rounded-xl shadow-xl shrink-0">
                          <img src={`${api.defaults.baseURL}/qr/${result.receipt_id}`} alt="QR" className="w-28 h-28" />
                        </div>
                        <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                          <p className="text-sm text-zinc-400">Scan to verify or share the Receipt ID.</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                              href={`/verify?id=${result.receipt_id}`}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-sm font-medium transition-colors border border-indigo-500/20"
                            >
                              Verify Now <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={handleReset}
                              className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-white/[0.06]"
                            >
                              Upload Another
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

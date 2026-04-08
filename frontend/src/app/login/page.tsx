"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Github, Chrome, ArrowRight, Shield, Blocks, Fingerprint } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: "google" | "github") => {
    setLoading(provider);
    await signIn.social({ provider, callbackURL: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* Floating decorations */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-indigo-500/30 rounded-full animate-float" />
      <div className="absolute bottom-32 right-32 w-1.5 h-1.5 bg-purple-500/30 rounded-full animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-40 right-40 w-1 h-1 bg-emerald-500/30 rounded-full animate-float" style={{ animationDelay: "2s" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        <div className="glass-strong rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Logo Area */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
              <Blocks className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Origyn</h1>
            <p className="text-sm text-zinc-500">
              Admin access • Sign in to continue
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => handleSignIn("google")}
              disabled={!!loading}
              className="w-full group flex items-center gap-3 py-3.5 px-5 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              <Chrome className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
              <span className="flex-1 text-left text-sm">
                {loading === "google" ? "Redirecting..." : "Continue with Google"}
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            {/* <button
              onClick={() => handleSignIn("github")}
              disabled={!!loading}
              className="w-full group flex items-center gap-3 py-3.5 px-5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all border border-white/[0.06] disabled:opacity-50 disabled:cursor-wait"
            >
              <Github className="w-5 h-5" />
              <span className="flex-1 text-left text-sm">
                {loading === "github" ? "Redirecting..." : "Continue with GitHub"}
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button> */}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-bold">Security</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Security badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Lock, label: "End-to-End Encrypted" },
              { icon: Fingerprint, label: "SHA-256 Verified" },
              { icon: Shield, label: "Blockchain Backed" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <p className="text-[9px] text-zinc-600 leading-tight">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Document upload and verification are available publicly without login.
        </p>
      </motion.div>
    </div>
  );
}

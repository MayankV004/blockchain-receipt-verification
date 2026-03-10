"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import {
  Activity,
  Box,
  Hash,
  Server,
  ShieldCheck,
  Zap,
  ArrowRight,
  CornerDownRight,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);

  // Automatically reconnect & subscribe via WebSocket
  const { messages: liveTxs, connected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/transactions",
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chainRes] = await Promise.all([
          api.get("/chain/stats"),
          api.get("/chain?limit=10"),
        ]);
        setStats(statsRes.data);
        setBlocks(chainRes.data.blocks);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 pt-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <span className="relative flex h-2 w-2">
                {connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${connected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"}`}
                ></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                {connected ? "Network Live" : "Reconnecting..."}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              Control Panel
            </h1>
            <p className="text-lg text-slate-400 max-w-xl font-medium">
              Real-time telemetry and validation engine for the ChainVerify
              network.
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            icon={<Box className="w-5 h-5 text-indigo-400" />}
            label="Total Blocks"
            value={stats?.total_blocks || "0"}
            delay={0.1}
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-purple-400" />}
            label="Total Transactions"
            value={stats?.total_transactions || "0"}
            delay={0.2}
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            label="Pending in Mempool"
            value={stats ? stats.pending_transactions : "0"}
            delay={0.3}
          />
          <StatCard
            icon={
              stats?.chain_valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-red-500" />
              )
            }
            label="Network Integrity"
            value={
              stats ? (stats.chain_valid ? "SECURE" : "BREACHED") : "CHECKING"
            }
            valueColor={
              stats?.chain_valid
                ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                : "text-red-500"
            }
            delay={0.4}
            glowing={stats?.chain_valid}
          />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Recent Blocks Ledger */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-6 px-1">
              <Server className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Ledger History
              </h2>
            </div>

            <div className="relative pl-4 sm:pl-8 before:absolute before:inset-0 before:ml-[31px] sm:before:ml-[47px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/50 before:via-white/10 before:to-transparent">
              <AnimatePresence initial={false}>
                {blocks.map((block, idx) => (
                  <motion.div
                    key={block.hash}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex items-start gap-6 mb-8 group"
                  >
                    {/* Timestamp & Connector */}
                    <div className="relative z-10 flex flex-col items-center mt-1">
                      <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:border-indigo-400 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300">
                        <Box className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    </div>

                    {/* Block Card */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 blur-xl" />
                      <div className="relative bg-[#111116]/80 backdrop-blur-xl border border-white/5 group-hover:border-white/10 rounded-2xl p-6 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-wider uppercase border border-indigo-500/20">
                              Block {block.index}
                            </span>
                            <span className="text-sm font-medium text-slate-400">
                              {new Date(
                                block.timestamp * 1000,
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-sm font-semibold text-slate-200">
                              {block.tx_count}{" "}
                              {block.tx_count === 1 ? "Tx" : "Txs"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="group/hash cursor-text">
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
                              <Hash className="w-3 h-3" /> Block Hash
                            </p>
                            <p className="font-mono text-sm text-slate-300 break-all bg-black/40 p-3 rounded-lg border border-white/5 group-hover/hash:border-white/20 transition-colors">
                              {block.hash}
                            </p>
                          </div>

                          {block.merkle_root && block.merkle_root !== "N/A" && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3" /> Merkle
                                Root
                              </p>
                              <p className="font-mono text-sm text-slate-400 break-all pl-4 text-xs">
                                {block.merkle_root}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Live Mempool Feed */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <div className="flex items-center gap-3 mb-6 px-1">
                <Zap className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Live Tx Feed
                </h2>
              </div>

              <div className="bg-[#111116]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                <div className="p-1 min-h-[500px] max-h-[800px] overflow-y-auto custom-scrollbar flex flex-col">
                  <AnimatePresence mode="popLayout">
                    {liveTxs.map((tx, idx) => (
                      <motion.div
                        key={`${tx.receipt_id}-${idx}`}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="m-2 p-4 bg-black/40 border border-white/5 hover:border-amber-500/30 rounded-xl transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] shrink-0" />
                            <span className="text-sm font-semibold text-slate-200 truncate">
                              New Receipt Uploaded
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider whitespace-nowrap bg-amber-400/10 px-2 py-0.5 rounded">
                            Just Now
                          </span>
                        </div>

                        <div className="space-y-2 relative">
                          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/10" />
                          <div className="pl-5 relative">
                            <div className="absolute left-[-1.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-white/20" />
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                              Receipt ID
                            </p>
                            <p className="text-xs font-mono text-slate-300 truncate">
                              {tx.receipt_id}
                            </p>
                          </div>
                          <div className="pl-5 relative">
                            <div className="absolute left-[-1.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-white/20" />
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                              <Hash className="w-3 h-3" /> SHA-256
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 truncate">
                              {tx.file_hash}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {liveTxs.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-[400px] flex flex-col items-center justify-center text-center p-6"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative">
                          <Activity className="w-6 h-6 text-slate-500" />
                          <span
                            className="absolute inset-0 rounded-full border border-slate-500/20 animate-ping opacity-20"
                            style={{ animationDuration: "3s" }}
                          />
                        </div>
                        <h3 className="text-slate-300 font-semibold mb-1">
                          Awaiting Activity
                        </h3>
                        <p className="text-sm text-slate-500 max-w-[200px]">
                          Listening to the network stream for new verifications.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles for this page */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `,
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueColor = "text-white",
  delay = 0,
  glowing = false,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative group h-full"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${glowing ? "from-emerald-500/10" : ""}`}
      />

      <div
        className={`h-full bg-[#111116]/80 backdrop-blur-xl border border-white/5 group-hover:border-white/10 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-lg ${glowing ? "shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:border-emerald-500/20" : ""}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            {icon}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-400 mb-1 tracking-wide">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`text-4xl font-black tracking-tight ${valueColor}`}>
              {value || "—"}
            </p>
            {typeof value === "number" && value > 0 && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md hidden sm:inline-block">
                + live
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

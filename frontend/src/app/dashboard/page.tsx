"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import { Activity, Box, Hash, Server, ShieldCheck, Zap } from "lucide-react";
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Network Control Panel
          </h1>
          <p className="text-slate-400">
            Live view of the ChainVerify blockchain
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
          <div className="relative flex h-3 w-3">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                connected ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></span>
          </div>
          <span className="text-sm font-medium text-slate-300">
            {connected ? "WebSocket Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Box className="w-5 h-5 text-blue-400" />}
            label="Total Blocks"
            value={stats.total_blocks}
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-indigo-400" />}
            label="Total Transactions"
            value={stats.total_transactions}
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            label="Pending TX in Pool"
            value={stats.pending_transactions}
          />
          <StatCard
            icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
            label="Chain Integrity"
            value={stats.chain_valid ? "VALID" : "COMPROMISED"}
            valueColor={stats.chain_valid ? "text-emerald-400" : "text-red-500"}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Blocks View */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-blue-400" />
            Recent Blocks
          </h2>
          <div className="space-y-4 overflow-hidden">
            <AnimatePresence initial={false}>
              {blocks.map((block) => (
                <motion.div
                  key={block.hash}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-blue-900/40 text-blue-400 text-xs font-mono px-2 py-1 rounded">
                        Block #{block.index}
                      </span>
                      <p className="text-xs text-slate-500 mt-2 font-mono break-all">
                        <span className="text-slate-400">Hash:</span>{" "}
                        {block.hash}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-400">
                      {block.tx_count} TXs
                    </span>
                  </div>
                  <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs font-mono text-slate-400 break-all">
                      <span className="text-slate-500">Merkle Root:</span>{" "}
                      {block.merkle_root}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Transaction Feed from WS */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-400" />
            Live Tx Pool
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-hidden min-h-[400px] flex flex-col justify-start">
            <AnimatePresence initial={false}>
              {liveTxs.map((tx, idx) => (
                <motion.div
                  key={`${tx.receipt_id}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-b border-gray-800 py-3 last:border-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-indigo-400 font-mono truncate max-w-[150px]">
                      {tx.receipt_id}
                    </span>
                    <span className="text-xs text-slate-500">Just now</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate w-full flex items-center gap-1">
                    <Hash className="w-3 h-3 shrink-0" /> {tx.file_hash}
                  </p>
                </motion.div>
              ))}
              {liveTxs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 mt-20">
                  <Activity className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">Listening for transactions...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueColor = "text-white" }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 bg-gray-800 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

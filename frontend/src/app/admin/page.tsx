"use client";

import { useEffect, useState } from "react";
import { api, ServiceHealth } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Blocks,
  Server,
  Database,
  Shield,
  Settings,
  ChevronRight,
  RefreshCw,
  Activity,
  Network,
  HardDrive,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Zap,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type NodeStatus = {
  total_blocks: number;
  total_transactions: number;
  chain_valid: boolean;
  pending_transactions: number;
};

export default function AdminPage() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [sealLoading, setSealLoading] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [h, s] = await Promise.all([
          api.get("/health/services").catch(() => null),
          api.get("/chain/stats").catch(() => null),
        ]);
        if (h) setHealth(h.data);
        if (s) setNodeStatus(s.data);
      } catch { /* silent */ }
    };
    fetch();
    const i = setInterval(fetch, 10000);
    return () => clearInterval(i);
  }, []);

  const handleSeal = async () => {
    setSealLoading(true);
    try {
      await api.post("/chain/seal");
      toast.success("Block sealed successfully");
    } catch {
      toast.error("Failed to seal block");
    } finally {
      setSealLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidateLoading(true);
    try {
      const { data } = await api.get("/chain/valid");
      setValidationResult(data.valid);
      if (data.valid) {
        toast.success("Chain integrity confirmed");
      } else {
        toast.error("Chain integrity compromised!");
      }
    } catch {
      toast.error("Validation failed");
    } finally {
      setValidateLoading(false);
    }
  };

  const architectureLayers = [
    {
      name: "Client Layer",
      icon: Network,
      color: "from-blue-500 to-cyan-500",
      items: ["Next.js Frontend", "React 19", "WebSocket Client", "Framer Motion"],
    },
    {
      name: "API Gateway",
      icon: Server,
      color: "from-indigo-500 to-purple-500",
      items: ["Nginx Reverse Proxy", "SSL Termination", "Rate Limiting", "Load Balancing"],
    },
    {
      name: "Application Layer",
      icon: Cpu,
      color: "from-purple-500 to-pink-500",
      items: ["FastAPI Backend", "Better Auth", "Async Upload Pipeline", "WebSocket Server"],
    },
    {
      name: "Blockchain Layer",
      icon: Blocks,
      color: "from-amber-500 to-orange-500",
      items: ["Merkle Tree Hashing", "Batch Processing", "Block Sealing", "Chain Validation"],
    },
    {
      name: "Storage Layer",
      icon: Database,
      color: "from-emerald-500 to-teal-500",
      items: ["PostgreSQL (Auth)", "Redis (State/Pub-Sub)", "Cloudflare R2 (Files)", "Block Persistence"],
    },
  ];

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.05] rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 pt-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
            <Shield className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">Administration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            System Administration
          </h1>
          <p className="text-base text-zinc-500 max-w-xl">
            Manage blockchain operations, view architecture, and monitor infrastructure
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <ActionCard
            title="Force Seal Block"
            description="Manually seal pending transactions into a new block"
            icon={<Blocks className="w-5 h-5 text-amber-400" />}
            color="amber"
            onClick={handleSeal}
            loading={sealLoading}
            stat={nodeStatus ? `${nodeStatus.pending_transactions} pending` : undefined}
          />
          <ActionCard
            title="Validate Chain"
            description="Run full integrity check on the blockchain"
            icon={<Shield className="w-5 h-5 text-emerald-400" />}
            color="emerald"
            onClick={handleValidate}
            loading={validateLoading}
            stat={validationResult !== null ? (validationResult ? "Valid" : "INVALID") : undefined}
            statColor={validationResult === false ? "text-red-400" : "text-emerald-400"}
          />
          <Link href="/dashboard" className="block">
            <div className="glass rounded-2xl p-5 h-full hover:border-white/[0.1] transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Open Dashboard</h3>
              <p className="text-xs text-zinc-600">View real-time telemetry and analytics</p>
            </div>
          </Link>
        </div>

        {/* Architecture Visualization */}
        <div className="glass rounded-2xl overflow-hidden mb-10">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Settings className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Architecture</h2>
              <p className="text-xs text-zinc-600">Origyn infrastructure pipeline</p>
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              {architectureLayers.map((layer, idx) => {
                const Icon = layer.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-start gap-4 mb-1">
                      {/* Connector */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {idx < architectureLayers.length - 1 && (
                          <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent mt-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <h3 className="text-sm font-bold text-white mb-2">{layer.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {layer.items.map((item, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[11px] text-zinc-400">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Node Info */}
        {nodeStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard label="Blocks Mined" value={nodeStatus.total_blocks} icon={<Blocks className="w-3.5 h-3.5 text-indigo-400" />} />
            <InfoCard label="Total Transactions" value={nodeStatus.total_transactions} icon={<Activity className="w-3.5 h-3.5 text-purple-400" />} />
            <InfoCard label="Mempool Size" value={nodeStatus.pending_transactions} icon={<HardDrive className="w-3.5 h-3.5 text-amber-400" />} />
            <InfoCard
              label="Chain Status"
              textValue={nodeStatus.chain_valid ? "SECURE" : "COMPROMISED"}
              textColor={nodeStatus.chain_valid ? "text-emerald-400" : "text-red-400"}
              icon={nodeStatus.chain_valid ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  title, description, icon, color, onClick, loading, stat, statColor = "text-zinc-400",
}: {
  title: string; description: string; icon: React.ReactNode; color: string;
  onClick: () => void; loading: boolean; stat?: string; statColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="glass rounded-2xl p-5 h-full text-left hover:border-white/[0.1] transition-all disabled:opacity-70 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 bg-${color}-500/10 rounded-xl border border-${color}-500/20`}>
          {icon}
        </div>
        {loading ? (
          <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />
        ) : stat ? (
          <span className={`text-xs font-bold ${statColor}`}>{stat}</span>
        ) : null}
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-zinc-600">{description}</p>
    </button>
  );
}

function InfoCard({
  label, value, textValue, textColor, icon,
}: {
  label: string; value?: number; textValue?: string; textColor?: string; icon: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">{label}</span>
      </div>
      {textValue ? (
        <p className={`text-lg font-black ${textColor}`}>{textValue}</p>
      ) : (
        <p className="text-lg font-black text-white">{value ?? "—"}</p>
      )}
    </div>
  );
}

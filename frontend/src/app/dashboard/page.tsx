"use client";

import { useEffect, useState, useMemo } from "react";
import { api, ChainStats, BlockData, ActivityItem, ServiceHealth } from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import {
  Activity,
  Box,
  Hash,
  Server,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowRight,
  CornerDownRight,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  Search,
  ChevronRight,
  Blocks,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

/* ─── Mini sparkline component ─── */
function Sparkline({ data, color = "#6366f1", height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * height}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <polygon fill={`url(#sg-${color.replace("#", "")})`} points={`0,${height} ${pts} ${w},${height}`} />
    </svg>
  );
}

/* ─── Animated counter ─── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [timeline, setTimeline] = useState<number[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const { messages: liveTxs, connected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/transactions",
  );

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, chainRes, activityRes, healthRes, timelineRes] = await Promise.all([
          api.get("/chain/stats").catch(() => null),
          api.get("/chain?limit=20").catch(() => null),
          api.get("/analytics/activity?limit=20").catch(() => null),
          api.get("/health/services").catch(() => null),
          api.get("/analytics/timeline").catch(() => null),
        ]);
        if (statsRes) setStats(statsRes.data);
        if (chainRes) setBlocks(chainRes.data.blocks || []);
        if (activityRes) setActivity(activityRes.data.activity || []);
        if (healthRes) setHealth(healthRes.data);
        if (timelineRes) {
          const buckets = timelineRes.data.timeline || [];
          setTimeline(buckets.map((b: { count: number }) => b.count));
        }
        setLastRefresh(Date.now());
      } catch { /* silent */ }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, []);

  const verificationRate = useMemo(() => {
    if (!stats) return 0;
    const total = (stats.valid_verifications || 0) + (stats.invalid_verifications || 0);
    if (total === 0) return 100;
    return Math.round(((stats.valid_verifications || 0) / total) * 100);
  }, [stats]);

  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return blocks;
    const q = searchQuery.toLowerCase();
    return blocks.filter(
      (b) =>
        String(b.index).includes(q) ||
        b.hash?.toLowerCase().includes(q) ||
        b.merkle_root?.toLowerCase().includes(q),
    );
  }, [blocks, searchQuery]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/[0.06] rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.05] rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 pt-10">
        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-3">
              <span className="relative flex h-2 w-2">
                {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"}`} />
              </span>
              <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                {connected ? "Network Live" : "Reconnecting..."}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Control Panel
            </h1>
            <p className="text-base text-zinc-500 max-w-xl">
              Real-time telemetry and blockchain analytics for ChainVerify
            </p>
          </motion.div>
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <RefreshCw className="w-3.5 h-3.5" />
            Last updated {new Date(lastRefresh).toLocaleTimeString()}
          </div>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatCard
            icon={<Box className="w-4 h-4 text-indigo-400" />}
            label="Total Blocks"
            value={stats?.total_blocks || 0}
            sparkData={timeline}
            sparkColor="#6366f1"
            delay={0}
          />
          <StatCard
            icon={<Activity className="w-4 h-4 text-purple-400" />}
            label="Transactions"
            value={stats?.total_transactions || 0}
            sparkData={timeline}
            sparkColor="#a855f7"
            delay={0.05}
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            label="Pending"
            value={stats?.pending_transactions || 0}
            sparkData={[]}
            sparkColor="#f59e0b"
            delay={0.1}
            accent="amber"
          />
          <StatCard
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
            label="Verifications"
            value={(stats?.valid_verifications || 0) + (stats?.invalid_verifications || 0)}
            subtitle={`${verificationRate}% success`}
            sparkData={[]}
            sparkColor="#10b981"
            delay={0.15}
          />
          <StatCard
            icon={
              stats?.chain_valid
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <AlertTriangle className="w-4 h-4 text-red-400" />
            }
            label="Integrity"
            textValue={stats ? (stats.chain_valid ? "SECURE" : "BREACHED") : "..."}
            textColor={stats?.chain_valid ? "text-emerald-400" : "text-red-400"}
            sparkData={[]}
            sparkColor="#10b981"
            delay={0.2}
            glowing={stats?.chain_valid}
          />
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* LEFT: Blockchain Explorer + Activity */}
          <div className="lg:col-span-8 space-y-6">

            {/* Blockchain Explorer */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <Blocks className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Blockchain Explorer</h2>
                      <p className="text-xs text-zinc-600">{blocks.length} blocks loaded</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search block index or hash..."
                      className="pl-9 pr-4 py-2 bg-black/30 border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                <AnimatePresence initial={false}>
                  {filteredBlocks.map((block, idx) => (
                    <motion.div
                      key={block.hash || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedBlock(selectedBlock?.hash === block.hash ? null : block)}
                      className={`border-b border-white/[0.04] p-5 cursor-pointer transition-all hover:bg-white/[0.02] ${selectedBlock?.hash === block.hash ? "bg-indigo-500/[0.05]" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            block.index === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-indigo-500/10 border border-indigo-500/20"
                          }`}>
                            <span className={`text-xs font-bold ${block.index === 0 ? "text-amber-400" : "text-indigo-400"}`}>
                              {block.index === 0 ? "G" : `#${block.index}`}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white">
                                {block.index === 0 ? "Genesis Block" : `Block ${block.index}`}
                              </span>
                              <span className="px-1.5 py-0.5 bg-white/[0.04] rounded text-[10px] font-mono text-zinc-500">
                                {block.tx_count} tx{block.tx_count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-zinc-600 truncate max-w-[400px]">
                              {block.hash}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-zinc-600 hidden sm:block">
                            {new Date(block.timestamp * 1000).toLocaleString()}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${selectedBlock?.hash === block.hash ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      {/* Expanded Block Detail */}
                      <AnimatePresence>
                        {selectedBlock?.hash === block.hash && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/[0.06] overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              <DetailField
                                label="Block Hash"
                                value={block.hash}
                                icon={<Hash className="w-3 h-3 text-indigo-400" />}
                                onCopy={() => copyText(block.hash, `hash-${block.index}`)}
                                copied={copied === `hash-${block.index}`}
                              />
                              <DetailField
                                label="Previous Hash"
                                value={block.previous_hash}
                                icon={<CornerDownRight className="w-3 h-3 text-zinc-500" />}
                                onCopy={() => copyText(block.previous_hash, `prev-${block.index}`)}
                                copied={copied === `prev-${block.index}`}
                              />
                            </div>
                            {block.merkle_root && block.merkle_root !== "N/A" && (
                              <DetailField
                                label="Merkle Root"
                                value={block.merkle_root}
                                icon={<GitBranch className="w-3 h-3 text-purple-400" />}
                                onCopy={() => copyText(block.merkle_root, `merkle-${block.index}`)}
                                copied={copied === `merkle-${block.index}`}
                              />
                            )}
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <MiniStat label="Nonce" value={String(block.nonce ?? "—")} />
                              <MiniStat label="Transactions" value={String(block.tx_count)} />
                              <MiniStat label="Timestamp" value={new Date(block.timestamp * 1000).toLocaleTimeString()} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredBlocks.length === 0 && (
                  <div className="p-12 text-center">
                    <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No blocks found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Log */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Recent Activity</h2>
                  <p className="text-xs text-zinc-600">{activity.length} events</p>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                {activity.map((item, idx) => (
                  <div
                    key={`${item.file_hash}-${idx}`}
                    className="flex items-center gap-4 p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === "upload" ? "bg-indigo-500/10 border border-indigo-500/20" : item.is_valid ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
                    }`}>
                      {item.type === "upload" ? (
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      ) : item.is_valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {item.type === "upload" ? "Document Uploaded" : item.is_valid ? "Verified Valid" : "Verification Failed"}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          item.type === "upload" ? "bg-indigo-500/10 text-indigo-400" : item.is_valid ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-600 truncate">{item.file_hash}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.uploader && <p className="text-xs text-zinc-500">{item.uploader}</p>}
                      <p className="text-[10px] text-zinc-700">
                        {item.timestamp ? new Date(item.timestamp * 1000).toLocaleTimeString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <div className="p-12 text-center">
                    <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Feed + System Health */}
          <div className="lg:col-span-4 space-y-6">

            {/* Live Transaction Feed */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Live Feed</h2>
                    <p className="text-xs text-zinc-600">{liveTxs.length} events captured</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                  connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {connected ? "Live" : "Offline"}
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {liveTxs.map((tx, idx) => (
                    <motion.div
                      key={`${tx.receipt_id}-${idx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                          <span className="text-xs font-semibold text-zinc-300">New Upload</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          Just Now
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">Receipt</p>
                          <p className="text-[11px] font-mono text-zinc-400 truncate">{tx.receipt_id}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">SHA-256</p>
                          <p className="text-[10px] font-mono text-zinc-500 truncate">{tx.file_hash}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {liveTxs.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 relative">
                      <Activity className="w-5 h-5 text-zinc-600" />
                      <span className="absolute inset-0 rounded-full border border-zinc-700/30 animate-ping" style={{ animationDuration: "3s" }} />
                    </div>
                    <p className="text-xs text-zinc-600">Listening for transactions...</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">System Health</h2>
                  <p className="text-xs text-zinc-600">
                    {health?.overall === "healthy" ? "All systems operational" : health?.overall || "Checking..."}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {health?.services ? (
                  Object.entries(health.services).map(([name, svc]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          svc.status === "healthy" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
                        }`}>
                          {name.includes("blockchain") || name.includes("node") ? (
                            <Blocks className="w-3.5 h-3.5 text-current" />
                          ) : name.includes("redis") ? (
                            <Database className="w-3.5 h-3.5 text-current" />
                          ) : name.includes("storage") ? (
                            <HardDrive className="w-3.5 h-3.5 text-current" />
                          ) : (
                            <Cpu className="w-3.5 h-3.5 text-current" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-300 capitalize">{name.replace(/_/g, " ")}</p>
                          {svc.latency_ms !== undefined && (
                            <p className="text-[10px] text-zinc-600">{svc.latency_ms}ms latency</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                        svc.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {svc.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <RefreshCw className="w-5 h-5 text-zinc-600 mx-auto mb-2 animate-spin" />
                    <p className="text-xs text-zinc-600">Loading health data...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-base font-bold text-white">Quick Stats</h2>
              </div>
              <div className="space-y-3">
                <QuickStat label="Uptime" value={stats ? formatUptime(stats.uptime_seconds) : "—"} />
                <QuickStat label="TX/sec" value={stats?.tx_per_second?.toFixed(2) || "0.00"} />
                <QuickStat label="Valid Verifications" value={String(stats?.valid_verifications || 0)} color="text-emerald-400" />
                <QuickStat label="Invalid Verifications" value={String(stats?.invalid_verifications || 0)} color="text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Subcomponents ─── */

function StatCard({
  icon, label, value, textValue, textColor, subtitle, sparkData, sparkColor, delay = 0, accent, glowing,
}: {
  icon: React.ReactNode; label: string; value?: number; textValue?: string; textColor?: string;
  subtitle?: string; sparkData: number[]; sparkColor: string; delay?: number; accent?: string; glowing?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group"
    >
      <div className={`glass rounded-2xl p-4 h-full hover:border-white/[0.1] transition-all ${glowing ? "glow-emerald" : ""}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-black/30 rounded-lg border border-white/[0.06]">{icon}</div>
          {sparkData.length > 3 && (
            <div className="w-16 opacity-60">
              <Sparkline data={sparkData} color={sparkColor} height={20} />
            </div>
          )}
        </div>
        {textValue ? (
          <p className={`text-2xl font-black tracking-tight ${textColor || "text-white"}`}>{textValue}</p>
        ) : (
          <p className="text-2xl font-black tracking-tight text-white">
            <AnimatedNumber value={value || 0} />
          </p>
        )}
        <p className="text-xs text-zinc-500 mt-1">{label}</p>
        {subtitle && <p className="text-[10px] text-emerald-400 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

function DetailField({
  label, value, icon, onCopy, copied,
}: { label: string; value: string; icon: React.ReactNode; onCopy: () => void; copied: boolean }) {
  return (
    <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">{label}</p>
        </div>
        <button onClick={onCopy} className="text-zinc-600 hover:text-zinc-400 transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <p className="text-[10px] font-mono text-zinc-500 break-all">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-2.5 border border-white/[0.04] text-center">
      <p className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold mb-0.5">{label}</p>
      <p className="text-xs font-bold text-zinc-300">{value}</p>
    </div>
  );
}

function QuickStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

"use client";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  UploadCloud,
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Fingerprint,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const publicLinks = [
  { href: "/", label: "Upload", icon: UploadCloud },
  { href: "/verify", label: "Verify", icon: Search },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function AuthGuard() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-2xl border-b border-white/[0.06]" />
      <div className="relative max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-8 h-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
            <Fingerprint className="relative w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Chain<span className="text-indigo-400">Verify</span>
          </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
          {publicLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          {isAdmin &&
            adminLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                      : "text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white leading-tight">
                    {session.user.name || session.user.email?.split("@")[0]}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    isAdmin
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-zinc-500/20 text-zinc-400"
                  }`}
                >
                  {session.user.role}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-[#18181b] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50">
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white truncate">
                      {session.user.email}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isAdmin ? "Administrator" : "User"}
                    </p>
                  </div>
                  {/* Mobile nav links */}
                  <div className="md:hidden py-1 border-b border-white/[0.06]">
                    {publicLinks.concat(isAdmin ? adminLinks : []).map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-900/30 hover:shadow-indigo-500/20"
            >
              <Shield className="w-4 h-4" />
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

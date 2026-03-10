"use client";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";

export default function AuthGuard() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
      <div className="flex gap-6 text-sm font-medium">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          Upload
        </Link>
        <Link href="/verify" className="text-indigo-400 hover:text-indigo-300">
          Verify
        </Link>
        {isAdmin && (
          <>
            <Link
              href="/dashboard"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Dashboard
            </Link>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300">
              Admin
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <span className="text-gray-400 text-sm">{session.user.email}</span>
            <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
              {session.user.role}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500"
          >
            Admin Login
          </Link>
        )}
      </div>
    </nav>
  );
}

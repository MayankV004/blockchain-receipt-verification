"use client";
import { signIn } from "@/lib/auth-client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: "google" | "github") => {
    setLoading(provider);
    await signIn.social({ provider, callbackURL: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">⛓️ ChainVerify</h1>
          <p className="text-gray-400 text-sm">
            Admin access only. Sign in to continue.
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900
                       font-semibold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
          >
            {loading === "google" ? "Redirecting..." : "Continue with Google"}
          </button>
          <button
            onClick={() => handleSignIn("github")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white
                       font-semibold py-3 rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading === "github" ? "Redirecting..." : "Continue with GitHub"}
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-8">
          Receipt upload and verification are available publicly without login.
        </p>
      </div>
    </div>
  );
}

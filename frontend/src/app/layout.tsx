import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { FileBadge, ShieldCheck, UploadCloud } from "lucide-react";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Receipt Verification | Blockchain",
  description: "Secure, tamper-proof digital billing on the blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen relative font-sans antialiased text-slate-100 bg-[#0A0A0B]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A0B] to-[#0A0A0B] z-[-1]" />

        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
          <div className="container flex h-16 items-center px-4 mx-auto max-w-7xl justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 mr-6 shrink-0 group"
            >
              <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                <FileBadge className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="font-semibold tracking-tight text-lg text-white">
                BlockBill
              </span>
            </Link>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 transition-colors hover:text-indigo-400 text-slate-300"
              >
                <UploadCloud className="w-4 h-4" />
                Upload
              </Link>
              <Link
                href="/verify"
                className="flex items-center gap-2 transition-colors hover:text-indigo-400 text-slate-300"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 w-full max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1e1e24",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}

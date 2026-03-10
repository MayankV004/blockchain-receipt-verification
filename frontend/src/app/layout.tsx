import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChainVerify | Secure Digital Receipts",
  description: "Tamper-proof blockchain receipt verification",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-950 text-white min-h-screen antialiased`}
      >
        <AuthGuard />
        <main className="pt-8">{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{ style: { background: "#1e293b", color: "#fff" } }}
        />
      </body>
    </html>
  );
}

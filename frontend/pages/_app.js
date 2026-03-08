import Link from "next/link";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm px-8 py-4 flex gap-6 text-sm font-medium border-b sticky top-0 z-10 w-full justify-center">
        <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-md">
          📤 Upload Receipt
        </Link>
        <Link href="/verify" className="text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-md">
          🔍 Verify Receipt
        </Link>
      </nav>
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>
      <footer className="text-center p-4 text-xs text-gray-500 bg-white border-t">
        Digital Bill / Receipt Verification System
      </footer>
    </div>
  );
}

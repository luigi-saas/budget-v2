import Link from "next/link";
import { Wallet, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--surface-2)" }}>
      <div className="text-center max-w-md animate-fadeIn">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6"
          style={{ background: "var(--accent)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-btn)" }}>
          <Wallet className="w-8 h-8" style={{ color: "var(--accent-ink)" }} />
        </div>
        <h1 className="text-7xl font-bold tracking-tight" style={{ color: "var(--t1)" }}>404</h1>
        <p className="text-lg mt-3" style={{ color: "var(--t2)" }}>Page not found</p>
        <p className="text-sm mt-2" style={{ color: "var(--t3)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link href="/" className="flex items-center gap-2 px-6 py-2.5 font-semibold text-sm transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 px-6 py-2.5 font-semibold text-sm transition hover:opacity-80"
            style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-field)" }}>
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

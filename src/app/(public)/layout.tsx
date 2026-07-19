import Link from "next/link";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--accent)", borderRadius: "10px", color: "var(--accent-ink)" }}>F</div>
            <span className="font-bold text-lg" style={{ color: "var(--t1)" }}>Flousy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium transition hover:opacity-70" style={{ color: "var(--t2)" }}>
              Sign In
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center font-bold text-xs"
              style={{ background: "var(--accent)", borderRadius: "6px", color: "var(--accent-ink)" }}>F</div>
            <span className="font-semibold text-sm" style={{ color: "var(--t2)" }}>Flousy</span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--t3)" }}>
            <Link href="/privacy" className="hover:opacity-70 transition">Privacy</Link>
            <Link href="/terms" className="hover:opacity-70 transition">Terms</Link>
          </div>
          <p className="text-xs" style={{ color: "var(--t3)" }}>
            © {new Date().getFullYear()} Flousy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

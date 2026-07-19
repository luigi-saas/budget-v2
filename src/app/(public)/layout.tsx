import Link from "next/link";
import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: "var(--accent)", borderRadius: "var(--r-field)" }}
            >
              <Wallet className="w-4 h-4" style={{ color: "var(--accent-ink)" }} />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--t1)" }}>
              Flousy
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 transition-all hover:opacity-70"
              style={{ color: "var(--t2)", borderRadius: "var(--r-field)" }}
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2 transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "var(--accent-ink)",
                borderRadius: "var(--r-field)",
                boxShadow: "var(--shadow-btn)",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center"
              style={{ background: "var(--accent)", borderRadius: "8px" }}
            >
              <Wallet className="w-3 h-3" style={{ color: "var(--accent-ink)" }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--t1)" }}>
              Flousy
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "var(--t3)" }}>
            <Link href="/privacy" className="hover:opacity-70 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:opacity-70 transition">
              Terms
            </Link>
          </div>
          <p className="text-xs" style={{ color: "var(--t3)" }}>
            &copy; {new Date().getFullYear()} Flousy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

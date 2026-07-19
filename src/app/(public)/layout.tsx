import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-6 h-16 flex items-center justify-between"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="flex items-center gap-2 font-bold text-base" style={{ color: "var(--t1)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>F</div>
          Flousy
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "var(--t2)" }}>
            Sign In
          </Link>
          <Link href="/login?tab=register"
            className="px-5 py-2 text-sm font-semibold rounded-xl transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>F</div>
          <span className="font-bold text-sm" style={{ color: "var(--t1)" }}>Flousy</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3 text-sm" style={{ color: "var(--t3)" }}>
          <Link href="#" className="hover:opacity-80">Privacy</Link>
          <Link href="#" className="hover:opacity-80">Terms</Link>
        </div>
        <p className="text-xs" style={{ color: "var(--t3)" }}>
          © {new Date().getFullYear()} Flousy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

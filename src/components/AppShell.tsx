"use client";

import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Settings, HelpCircle, LogOut,
  Menu, X, Target, Download, FileText, Shield, ChevronRight, Wallet,
} from "lucide-react";

interface UserData {
  id: string; email: string; displayName: string; plan: string;
  currency: string; locale: string; onboardingComplete: boolean;
  darkMode: boolean; notifications: boolean; createdAt: string;
}

interface UserContextType {
  user: UserData | null; loading: boolean; refetchUser: () => Promise<void>;
}

const UserCtx = createContext<UserContextType>({ user: null, loading: true, refetchUser: async () => {} });
export const useUser = () => useContext(UserCtx);

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/savings", label: "Savings", icon: Target },
  { href: "/history", label: "History", icon: FileText },
  { href: "/export", label: "Export Data", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help & FAQ", icon: HelpCircle },
];

const LEGAL_ITEMS = [
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: FileText },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else { setUser(null); }
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--t3)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <UserCtx.Provider value={{ user, loading, refetchUser: fetchUser }}>
      <div className="flex min-h-screen" style={{ background: "var(--surface-2)" }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/25 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
          style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: "var(--accent)", borderRadius: "var(--r-field)" }}>
                <Wallet className="w-4 h-4" style={{ color: "var(--accent-ink)" }} />
              </div>
              <span className="font-bold text-lg tracking-tight" style={{ color: "var(--t1)" }}>Flousy</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:opacity-70">
              <X className="w-5 h-5" style={{ color: "var(--t2)" }} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--t3)" }}>Main</p>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    borderRadius: "var(--r-field)",
                    background: active ? "var(--accent-tint)" : "transparent",
                    color: active ? "var(--accent-dim)" : "var(--t2)",
                  }}
                >
                  <item.icon className="w-[18px] h-[18px]" style={{ color: active ? "var(--accent-dim)" : "var(--t3)" }} />
                  {item.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "var(--accent-dim)" }} />}
                </Link>
              );
            })}

            <div className="pt-4 mt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--t3)" }}>Legal</p>
              {LEGAL_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    borderRadius: "var(--r-field)",
                    background: pathname === item.href ? "var(--accent-tint)" : "transparent",
                    color: pathname === item.href ? "var(--accent-dim)" : "var(--t2)",
                  }}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* User & Logout */}
          {user && (
            <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{user.displayName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{user.email}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{ borderRadius: "var(--r-field)", color: "var(--bad)" }}
              >
                <LogOut className="w-[18px] h-[18px]" />
                Sign Out
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center px-4 backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.85)", borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:opacity-70">
              <Menu className="w-5 h-5" style={{ color: "var(--t1)" }} />
            </button>
            <div className="flex items-center gap-2 ml-3">
              <div className="w-6 h-6 flex items-center justify-center" style={{ background: "var(--accent)", borderRadius: "8px" }}>
                <Wallet className="w-3 h-3" style={{ color: "var(--accent-ink)" }} />
              </div>
              <span className="font-bold" style={{ color: "var(--t1)" }}>Flousy</span>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </UserCtx.Provider>
  );
}

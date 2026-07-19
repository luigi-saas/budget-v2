"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, History, Target, BarChart3, Download, HelpCircle,
  Settings, LogOut, X, User, Bell, Trash2, Shield, Check, Coins, Globe,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string; email: string; displayName: string; plan: string;
  currency: string; locale: string; onboardingComplete: boolean;
  darkMode: boolean; notifications: boolean; createdAt: string;
}

interface UserContextValue {
  user: AppUser | null;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({ user: null, refetchUser: async () => {} });
export function useUser() { return useContext(UserContext); }

// ── Navigation ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/savings", label: "Savings", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/export", label: "Export", icon: Download },
  { href: "/help", label: "Help", icon: HelpCircle },
];

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/savings", label: "Savings", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/export", label: "Export", icon: Download },
];

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ user, onClose, onRefetch }: { user: AppUser; onClose: () => void; onRefetch: () => Promise<void> }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [currency, setCurrency] = useState(user.currency);
  const [notifications, setNotifications] = useState(user.notifications);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, currency, notifications }),
    });
    await onRefetch();
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    await fetch("/api/auth/delete", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp"
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center" style={{ background: "var(--accent-tint)", borderRadius: "var(--r-field)" }}>
              <Settings className="w-4 h-4" style={{ color: "var(--accent-dim)" }} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: "var(--t1)" }}>Settings</h2>
              <p className="text-xs" style={{ color: "var(--t3)" }}>Manage your preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
            <X className="w-4 h-4" style={{ color: "var(--t3)" }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Profile */}
          <SettingsSection icon={<User className="w-4 h-4" />} title="Profile">
            <div className="space-y-3">
              <SettingsField label="Display Name" value={displayName} onChange={setDisplayName} />
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>Email</label>
                <input value={user.email} disabled className="w-full px-3 py-2 text-sm cursor-not-allowed"
                  style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t3)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>Plan</label>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-medium"
                    style={{ background: user.plan === "pro" ? "var(--accent-tint)" : "var(--surface-3)", color: user.plan === "pro" ? "var(--accent-dim)" : "var(--t2)", borderRadius: "var(--r-pill)" }}>
                    {user.plan === "pro" ? "Pro" : "Free"}
                  </span>
                  {user.plan !== "pro" && <span className="text-xs" style={{ color: "var(--t3)" }}>Upgrade coming soon</span>}
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Currency */}
          <SettingsSection icon={<Coins className="w-4 h-4" />} title="Currency">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>Default Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none appearance-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.name} ({c.code})</option>)}
              </select>
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={<Bell className="w-4 h-4" />} title="Notifications">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--t2)" }}>Budget Alerts</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>Notify when close to budget limit</p>
              </div>
              <button onClick={() => setNotifications(!notifications)}
                className="relative w-11 h-6 transition-colors"
                style={{ background: notifications ? "var(--accent)" : "var(--border-2)", borderRadius: "var(--r-pill)" }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform"
                  style={{ background: "var(--bg)", left: notifications ? "20px" : "2px" }} />
              </button>
            </div>
          </SettingsSection>

          {/* Account Info */}
          <SettingsSection icon={<Globe className="w-4 h-4" />} title="Account Info">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--t3)" }}>Account ID</span>
                <span className="font-mono text-xs" style={{ color: "var(--t2)" }}>{user.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--t3)" }}>Member since</span>
                <span style={{ color: "var(--t2)" }}>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </SettingsSection>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
            {saving ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent-ink)", borderTopColor: "transparent" }} />
              : saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Settings className="w-4 h-4" /> Save Changes</>}
          </button>

          {/* Danger zone */}
          <div className="overflow-hidden" style={{ background: "var(--surface)", borderRadius: "var(--r-field)", border: "1px solid var(--bad)" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--bad-tint)" }}>
              <Shield className="w-4 h-4" style={{ color: "var(--bad)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--bad)" }}>Danger Zone</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--t2)" }}>Delete Account</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>Permanently remove your account</p>
              </div>
              <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                style={{ border: "1px solid var(--bad)", color: "var(--bad)", borderRadius: "var(--r-field)" }}>Delete</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm p-6 animate-slideUp"
            style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--bad-tint)" }}>
                <AlertTriangle className="w-5 h-5" style={{ color: "var(--bad)" }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--t1)" }}>Delete Account</h3>
                <p className="text-xs" style={{ color: "var(--t3)" }}>This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--t2)" }}>
              Type <strong>DELETE</strong> to confirm permanent deletion of your account and all data.
            </p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none mb-4"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
              placeholder="Type DELETE" />
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium transition hover:opacity-70"
                style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-field)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== "DELETE"}
                className="flex-1 py-2 text-sm font-semibold transition hover:opacity-80 disabled:opacity-40"
                style={{ background: "var(--bad)", color: "#fff", borderRadius: "var(--r-field)" }}>
                <Trash2 className="w-4 h-4 inline mr-1" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden" style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--accent-dim)" }}>{icon}</span>
        <span className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SettingsField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm outline-none transition"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }} />
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      if (!data.user.onboardingComplete) { router.push("/onboarding"); }
    } catch { router.push("/login"); }
  }, [router]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <UserContext.Provider value={{ user, refetchUser: fetchUser }}>
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40"
          style={{ background: "var(--surface)", borderRight: "1px solid var(--border)", boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-8 h-8 flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--accent)", borderRadius: "10px", color: "var(--accent-ink)" }}>F</div>
            <span className="font-bold text-lg" style={{ color: "var(--t1)" }}>Flousy</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all"
                  style={{
                    background: active ? "var(--accent-tint)" : "transparent",
                    color: active ? "var(--accent-dim)" : "var(--t2)",
                    borderRadius: "var(--r-field)",
                  }}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user section */}
          <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
            {/* Settings button */}
            <button onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all hover:opacity-80"
              style={{ background: "transparent", color: "var(--t2)", borderRadius: "var(--r-field)" }}>
              <Settings className="w-4 h-4 flex-shrink-0" />
              Settings
            </button>

            {/* User card */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-2.5"
                style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
                <div className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--accent-tint)", borderRadius: "50%", color: "var(--accent-dim)" }}>
                  {user.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--t1)" }}>{user.displayName}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--t3)" }}>{user.email}</p>
                </div>
                <button onClick={handleSignOut} className="p-1 transition hover:opacity-70" title="Sign out">
                  <LogOut className="w-3.5 h-3.5" style={{ color: "var(--t3)" }} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          {/* Mobile top header */}
          <header className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center font-bold text-xs"
                style={{ background: "var(--accent)", borderRadius: "8px", color: "var(--accent-ink)" }}>F</div>
              <span className="font-bold" style={{ color: "var(--t1)" }}>Flousy</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSettings(true)}
                className="w-8 h-8 flex items-center justify-center transition hover:opacity-70"
                style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
                <Settings className="w-4 h-4" style={{ color: "var(--t2)" }} />
              </button>
              <button onClick={handleSignOut}
                className="w-8 h-8 flex items-center justify-center transition hover:opacity-70"
                style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
                <LogOut className="w-4 h-4" style={{ color: "var(--t2)" }} />
              </button>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-4 sm:p-6 pb-24 lg:pb-8">
            {children}
          </div>
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30"
          style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
          <div className="flex">
            {BOTTOM_NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
                  style={{ color: active ? "var(--accent-dim)" : "var(--t3)" }}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {/* Settings in mobile nav */}
            <button onClick={() => setShowSettings(true)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
              style={{ color: "var(--t3)" }}>
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </nav>
      </div>

      {/* Settings Modal */}
      {showSettings && user && (
        <SettingsModal user={user} onClose={() => setShowSettings(false)} onRefetch={fetchUser} />
      )}
    </UserContext.Provider>
  );
}

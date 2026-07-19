"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Clock, PiggyBank, BarChart3, Download, HelpCircle,
  LogOut, Settings, X, Sun, Moon, ChevronDown, Menu, User,
  DollarSign, Bell, Trash2,
} from "lucide-react";
import { CURRENCIES } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  currency: string;
  onboardingComplete: boolean;
  darkMode: boolean;
  notifications: boolean;
  plan: string;
  createdAt: string;
}

interface UserContextValue {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: Clock },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/export", label: "Export", icon: Download },
  { href: "/help", label: "Help", icon: HelpCircle },
];

// ── AppShell ──────────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Apply dark mode
        if (data.user?.darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        setUser(null);
        router.push("/login");
      }
    } catch {
      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `} style={{ width: 240, background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
          {/* Logo */}
          <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>F</div>
              <span className="font-bold text-base" style={{ color: "var(--t1)" }}>Flousy</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" style={{ color: "var(--t3)" }} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? "var(--accent-tint)" : "transparent",
                    color: active ? "var(--accent-dim)" : "var(--t2)",
                  }}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition hover:opacity-80"
              style={{ background: "var(--surface-2)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "var(--accent-tint)", color: "var(--accent-dim)" }}>
                {user.displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--t1)" }}>{user.displayName}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--t3)" }}>{user.email}</p>
              </div>
              <Settings className="w-4 h-4 flex-shrink-0" style={{ color: "var(--t3)" }} />
            </button>
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition hover:opacity-80 mt-1"
              style={{ color: "var(--t3)" }}>
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar (mobile) */}
          <header className="lg:hidden flex items-center gap-3 px-4 h-14 sticky top-0 z-20"
            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" style={{ color: "var(--t2)" }} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>F</div>
              <span className="font-bold text-sm" style={{ color: "var(--t1)" }}>Flousy</span>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          user={user}
          onClose={() => setSettingsOpen(false)}
          onUpdate={refreshUser}
          onLogout={logout}
        />
      )}
    </UserContext.Provider>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({
  user, onClose, onUpdate, onLogout,
}: {
  user: AppUser;
  onClose: () => void;
  onUpdate: () => Promise<void>;
  onLogout: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [currency, setCurrency] = useState(user.currency);
  const [darkMode, setDarkMode] = useState(user.darkMode);
  const [notifications, setNotifications] = useState(user.notifications);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const save = async () => {
    setSaving(true);
    await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, currency, darkMode, notifications }),
    });
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    await onUpdate();
    setSaving(false);
    onClose();
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    await fetch("/api/auth/me", { method: "DELETE" });
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "var(--t1)" }}>Settings</h2>
            <p className="text-sm" style={{ color: "var(--t3)" }}>Manage your preferences</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition hover:opacity-70"
            style={{ background: "var(--surface-2)" }}>
            <X className="w-5 h-5" style={{ color: "var(--t2)" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile */}
          <Section icon={<User className="w-4 h-4" />} title="Profile">
            <SettingField label="Display Name" value={displayName} onChange={setDisplayName} />
            <div className="mt-3">
              <label className="text-xs font-medium" style={{ color: "var(--t3)" }}>Email</label>
              <p className="text-sm mt-1" style={{ color: "var(--t2)" }}>{user.email}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm" style={{ color: "var(--t2)" }}>Plan</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: user.plan === "pro" ? "var(--accent-tint)" : "var(--surface-2)", color: user.plan === "pro" ? "var(--accent-dim)" : "var(--t3)" }}>
                {user.plan === "pro" ? "Pro" : "Free"}
              </span>
            </div>
          </Section>

          {/* Currency */}
          <Section icon={<DollarSign className="w-4 h-4" />} title="Currency">
            <label className="text-xs font-medium" style={{ color: "var(--t3)" }}>Default Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 text-sm outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </Section>

          {/* Appearance */}
          <Section icon={<Sun className="w-4 h-4" />} title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>Dark Mode</p>
                <p className="text-xs" style={{ color: "var(--t3)" }}>Switch to dark theme</p>
              </div>
              <button onClick={() => setDarkMode(d => !d)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: darkMode ? "var(--accent)" : "var(--border-2)" }}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform bg-white shadow ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </Section>

          {/* Notifications */}
          <Section icon={<Bell className="w-4 h-4" />} title="Notifications">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>Budget Alerts</p>
                <p className="text-xs" style={{ color: "var(--t3)" }}>Notify when close to budget limit</p>
              </div>
              <button onClick={() => setNotifications(n => !n)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: notifications ? "var(--accent)" : "var(--border-2)" }}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform bg-white shadow ${notifications ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </Section>

          {/* Account Info */}
          <Section icon={<User className="w-4 h-4" />} title="Account Info">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--t3)" }}>Account ID</span>
                <span style={{ color: "var(--t2)" }}>{user.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--t3)" }}>Member since</span>
                <span style={{ color: "var(--t2)" }}>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </Section>

          {/* Save */}
          <button onClick={save} disabled={saving}
            className="w-full py-3 font-semibold text-sm rounded-xl transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>

          {/* Danger zone */}
          <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4" style={{ color: "var(--bad)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--bad)" }}>Danger Zone</span>
            </div>
            <button onClick={() => setShowDelete(true)}
              className="w-full py-2.5 text-sm font-medium rounded-xl border transition hover:opacity-80"
              style={{ color: "var(--bad)", borderColor: "var(--bad)" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowDelete(false)}>
          <div className="w-full max-w-sm p-6 animate-slideUp"
            onClick={e => e.stopPropagation()}
            style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-bold text-lg mb-1" style={{ color: "var(--bad)" }}>Delete Account</h3>
            <p className="text-sm mb-4" style={{ color: "var(--t3)" }}>This cannot be undone. Type DELETE to confirm.</p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none mb-4"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
              placeholder="Type DELETE" />
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm rounded-xl border"
                style={{ color: "var(--t2)", borderColor: "var(--border-2)" }}>
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={deleteConfirm !== "DELETE"}
                className="flex-1 py-2 text-sm font-semibold rounded-xl transition"
                style={{ background: deleteConfirm === "DELETE" ? "var(--bad)" : "var(--border-2)", color: "white", opacity: deleteConfirm === "DELETE" ? 1 : 0.5 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--accent-dim)" }}>{icon}</span>
        <span className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{title}</span>
      </div>
      <div className="p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        {children}
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium" style={{ color: "var(--t3)" }}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2 text-sm outline-none transition"
        style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }} />
    </div>
  );
}

// Needed for ChevronDown import usage in older code path
export { ChevronDown };

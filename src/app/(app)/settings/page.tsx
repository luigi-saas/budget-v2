"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { Settings, User, Bell, Trash2, Shield, AlertTriangle, Check, Coins, Globe, X } from "lucide-react";
import { CURRENCIES } from "@/lib/constants";

export default function SettingsPage() {
  const { user, refetchUser } = useUser();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    setDisplayName(user.displayName); setCurrency(user.currency); setNotifications(user.notifications);
  }, [user, router]);
  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, currency, notifications }) });
    await refetchUser(); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    await fetch("/api/auth/delete", { method: "DELETE" }); router.push("/login");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Manage your account preferences</p>
      </div>

      <div className="space-y-6 animate-fadeIn">
        {/* Profile */}
        <Card icon={<User className="w-5 h-5" />} title="Profile">
          <div className="space-y-4">
            <InputField label="Display Name" value={displayName} onChange={setDisplayName} />
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>Email</label>
              <input value={user.email} disabled className="w-full px-4 py-2.5 text-sm cursor-not-allowed"
                style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t3)" }} />
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>Plan</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-medium"
                  style={{ background: user.plan === "pro" ? "var(--accent-tint)" : "var(--surface-3)", color: user.plan === "pro" ? "var(--accent-dim)" : "var(--t2)", borderRadius: "var(--r-pill)" }}>
                  {user.plan === "pro" ? "Pro" : "Free"}
                </span>
                {user.plan !== "pro" && <span className="text-xs" style={{ color: "var(--t3)" }}>Upgrade coming soon</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Currency */}
        <Card icon={<Coins className="w-5 h-5" />} title="Currency">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>Default Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 text-sm outline-none appearance-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.name} ({c.code})</option>)}
            </select>
          </div>
        </Card>

        {/* Notifications */}
        <Card icon={<Bell className="w-5 h-5" />} title="Notifications">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--t2)" }}>Budget Alerts</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>Get notified when you&apos;re close to your budget limit</p>
            </div>
            <button onClick={() => setNotifications(!notifications)}
              className="relative w-12 h-7 transition-colors" style={{ background: notifications ? "var(--accent)" : "var(--border-2)", borderRadius: "var(--r-pill)" }}>
              <div className="absolute top-0.5 w-6 h-6 rounded-full shadow-sm transition-transform"
                style={{ background: "var(--bg)", left: notifications ? "22px" : "2px" }} />
            </button>
          </div>
        </Card>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
          {saving ? <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent-ink)", borderTopColor: "transparent" }} />
            : saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Settings className="w-4 h-4" /> Save Changes</>}
        </button>

        {/* Account Info */}
        <Card icon={<Globe className="w-5 h-5" />} title="Account Info">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--t3)" }}>Account ID</span>
              <span className="font-mono text-xs" style={{ color: "var(--t2)" }}>{user.id.slice(0, 8)}…</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--t3)" }}>Member since</span>
              <span style={{ color: "var(--t2)" }}>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </Card>

        {/* Danger */}
        <div className="overflow-hidden" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--bad)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-3 p-6" style={{ borderBottom: "1px solid var(--bad-tint)" }}>
            <Shield className="w-5 h-5" style={{ color: "var(--bad)" }} />
            <h2 className="font-semibold" style={{ color: "var(--bad)" }}>Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--t2)" }}>Delete Account</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>Permanently delete your account and all data</p>
              </div>
              <button onClick={() => setShowDelete(true)} className="px-4 py-2 text-sm font-medium transition hover:opacity-80"
                style={{ border: "1px solid var(--bad)", color: "var(--bad)", borderRadius: "var(--r-field)" }}>Delete Account</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4">
          <div className="w-full max-w-md p-6 animate-slideUp" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--bad-tint)" }}>
                <AlertTriangle className="w-5 h-5" style={{ color: "var(--bad)" }} />
              </div>
              <h3 className="font-semibold text-lg" style={{ color: "var(--t1)" }}>Delete Account</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--t2)" }}>
              This action is <strong>permanent and irreversible</strong>. All your budgets, expenses, and saving goals will be permanently deleted.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>
                Type <span className="font-mono font-bold" style={{ color: "var(--bad)" }}>DELETE</span> to confirm
              </label>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                className="w-full px-4 py-2.5 text-sm outline-none" style={{ background: "var(--bad-tint)", border: "1px solid var(--bad)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
                placeholder="DELETE" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="flex-1 py-2.5 font-medium text-sm transition hover:opacity-80"
                style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-field)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== "DELETE"}
                className="flex-1 py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 hover:opacity-90"
                style={{ background: "var(--bad)", color: "var(--inv)", borderRadius: "var(--r-field)" }}>
                <Trash2 className="w-4 h-4" /> Delete Forever
              </button>
            </div>
            <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }} className="absolute top-4 right-4 p-1 hover:opacity-70">
              <X className="w-4 h-4" style={{ color: "var(--t3)" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-3 p-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--accent-dim)" }}>{icon}</span>
        <h2 className="font-semibold" style={{ color: "var(--t1)" }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2.5 text-sm outline-none transition"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }} />
    </div>
  );
}

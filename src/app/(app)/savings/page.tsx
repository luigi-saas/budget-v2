"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { Target, Plus, Trash2, X, TrendingUp, Pause, Play } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

interface SavingGoal { id: string; name: string; target: number; current: number; source: string; active: boolean }

export default function SavingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showFund, setShowFund] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newSource, setNewSource] = useState("BANK");
  const [fundAmount, setFundAmount] = useState("");

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);

  const fetchGoals = useCallback(async () => {
    try { const res = await fetch("/api/savings"); const data = await res.json(); setGoals(data.goals ?? []); }
    catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const currency = user?.currency ?? "USD";

  const addGoal = async () => {
    if (!newName || !newTarget) return;
    await fetch("/api/savings", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, target: parseFloat(newTarget), source: newSource }) });
    setNewName(""); setNewTarget(""); setShowAdd(false); fetchGoals();
  };

  const deleteGoal = async (id: string) => { await fetch(`/api/savings?id=${id}`, { method: "DELETE" }); fetchGoals(); };

  const toggleGoal = async (goal: SavingGoal) => {
    await fetch("/api/savings", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, active: !goal.active }) });
    fetchGoals();
  };

  const fundGoal = async () => {
    if (!showFund || !fundAmount) return;
    const goal = goals.find(g => g.id === showFund);
    if (!goal) return;
    await fetch("/api/savings", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, current: goal.current + parseFloat(fundAmount) }) });
    setFundAmount(""); setShowFund(null); fetchGoals();
  };

  if (!user) return null;

  const activeGoals = goals.filter(g => g.active);
  const pausedGoals = goals.filter(g => !g.active);
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Saving Goals</h1>
          <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Track your savings progress</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-5 py-2.5 font-semibold text-sm transition hover:opacity-90"
          style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Total Saved", value: formatCurrency(totalSaved, currency), color: "var(--good)" },
              { label: "Total Target", value: formatCurrency(totalTarget, currency), color: "var(--t1)" },
              { label: "Overall Progress", value: `${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%`, color: "var(--accent-dim)" },
            ].map((c, i) => (
              <div key={c.label} className={`p-5 ${i === 2 ? "col-span-2 lg:col-span-1" : ""}`}
                style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--t3)" }}>{c.label}</p>
                <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {activeGoals.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--t3)" }}>Active Goals</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeGoals.map(g => <GoalCard key={g.id} goal={g} currency={currency} onFund={() => setShowFund(g.id)} onToggle={() => toggleGoal(g)} onDelete={() => deleteGoal(g.id)} />)}
              </div>
            </div>
          )}

          {pausedGoals.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--t3)" }}>Paused Goals</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {pausedGoals.map(g => <GoalCard key={g.id} goal={g} currency={currency} onFund={() => setShowFund(g.id)} onToggle={() => toggleGoal(g)} onDelete={() => deleteGoal(g.id)} />)}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <div className="text-center py-16" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <Target className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--t3)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>No saving goals yet</h2>
              <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Create your first goal to start saving</p>
            </div>
          )}
        </div>
      )}

      {showAdd && <ModalWrap title="New Saving Goal" onClose={() => setShowAdd(false)}>
        <div className="space-y-4">
          <FieldInput label="Goal Name" value={newName} onChange={setNewName} placeholder="Emergency fund" />
          <FieldInput label="Target Amount" value={newTarget} onChange={setNewTarget} type="number" placeholder="10000" />
          <FieldSelect label="Source" value={newSource} onChange={setNewSource} options={["BANK", "HOME", "WALLET"]} />
          <BtnAccent onClick={addGoal}>Create Goal</BtnAccent>
        </div>
      </ModalWrap>}

      {showFund && <ModalWrap title="Add Funds" onClose={() => setShowFund(null)}>
        <div className="space-y-4">
          <FieldInput label="Amount" value={fundAmount} onChange={setFundAmount} type="number" placeholder="500" />
          <button onClick={fundGoal} className="w-full py-2.5 font-semibold text-sm transition hover:opacity-90"
            style={{ background: "var(--good)", color: "var(--inv)", borderRadius: "var(--r-field)" }}>Add Funds</button>
        </div>
      </ModalWrap>}
    </div>
  );
}

function GoalCard({ goal, currency, onFund, onToggle, onDelete }: { goal: SavingGoal; currency: string; onFund: () => void; onToggle: () => void; onDelete: () => void }) {
  const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const completed = goal.current >= goal.target;
  return (
    <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", opacity: goal.active ? 1 : 0.6 }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold" style={{ color: "var(--t1)" }}>{goal.name}</h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>From {goal.source}</p>
        </div>
        {completed && <span className="text-xs px-2 py-1 font-medium" style={{ background: "var(--good-tint)", color: "var(--good)", borderRadius: "var(--r-pill)" }}>✓ Done</span>}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-lg font-bold" style={{ color: "var(--t1)" }}>{formatCurrency(goal.current, currency)}</span>
        <span className="text-sm" style={{ color: "var(--t3)" }}>/ {formatCurrency(goal.target, currency)}</span>
      </div>
      <div className="h-2.5 overflow-hidden mb-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-pill)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: completed ? "var(--good)" : "var(--accent)", borderRadius: "var(--r-pill)" }} />
      </div>
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--t3)" }}>
        <span>{pct.toFixed(1)}% complete</span>
        <div className="flex items-center gap-1">
          <button onClick={onFund} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: "var(--good)" }} title="Add funds"><TrendingUp className="w-4 h-4" /></button>
          <button onClick={onToggle} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: "var(--t3)" }} title={goal.active ? "Pause" : "Resume"}>
            {goal.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: "var(--bad)" }} title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

function ModalWrap({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4">
      <div className="w-full max-w-md p-6 animate-slideUp" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: "var(--t1)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:opacity-70" style={{ borderRadius: "var(--r-field)" }}><X className="w-5 h-5" style={{ color: "var(--t3)" }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
        placeholder={placeholder} />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm outline-none appearance-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function BtnAccent({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full py-2.5 font-semibold text-sm transition hover:opacity-90"
      style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
      {children}
    </button>
  );
}

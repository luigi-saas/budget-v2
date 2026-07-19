"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import {
  Plus, ChevronLeft, ChevronRight, Trash2, TrendingUp, TrendingDown,
  Landmark, Home, WalletCards, DollarSign, ShoppingBag, X,
} from "lucide-react";
import {
  currentMonthId, monthLabel, prevMonthId, nextMonthId,
  formatCurrency, VARIABLE_TYPES, FIXED_TYPES, CAT_COLOR,
} from "@/lib/constants";

interface VarExpense { id: string; name: string; amount: number; type: string; date: string; person?: string | null }
interface FixExpense { id: string; name: string; amount: number; type: string; base: number; date?: string | null }
interface MonthData {
  id: number; monthId: string; label: string;
  totalBudget: number; homePart: number; walletPart: number; bankPart: number;
  variableCategoryBases: Record<string, number>;
  fixedCategoryBases: Record<string, number>;
  activeVariableCategories: string[];
  activeFixedCategories: string[];
  variableExpenses: VarExpense[];
  fixedExpenses: FixExpense[];
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [monthId, setMonthId] = useState(currentMonthId());
  const [month, setMonth] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddVar, setShowAddVar] = useState(false);
  const [showAddFix, setShowAddFix] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expType, setExpType] = useState<string>(VARIABLE_TYPES[0]);
  const [fixName, setFixName] = useState("");
  const [fixAmount, setFixAmount] = useState("");
  const [fixType, setFixType] = useState<string>(FIXED_TYPES[0]);
  const [fixBase, setFixBase] = useState("");
  const [setupBudget, setSetupBudget] = useState("");
  const [setupHome, setSetupHome] = useState("");
  const [setupWallet, setSetupWallet] = useState("");
  const [setupBank, setSetupBank] = useState("");

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/months?monthId=${monthId}`);
      const data = await res.json();
      setMonth(data.month);
    } catch { setMonth(null); }
    setLoading(false);
  }, [monthId]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  const currency = user?.currency ?? "USD";

  const createMonth = async () => {
    const budget = parseFloat(setupBudget) || 0;
    await fetch("/api/months", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthId, label: monthLabel(monthId),
        totalBudget: budget, homePart: parseFloat(setupHome) || 0,
        walletPart: parseFloat(setupWallet) || 0, bankPart: parseFloat(setupBank) || 0,
        variableCategoryBases: Object.fromEntries(VARIABLE_TYPES.map(t => [t, 0])),
        fixedCategoryBases: Object.fromEntries(FIXED_TYPES.map(t => [t, 0])),
        activeVariableCategories: [...VARIABLE_TYPES], activeFixedCategories: [...FIXED_TYPES],
      }),
    });
    setShowSetup(false); fetchMonth();
  };

  const addVarExp = async () => {
    if (!month || !expName || !expAmount) return;
    await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "variable", monthBudgetId: month.id, name: expName, amount: parseFloat(expAmount), type: expType, date: new Date().toISOString().slice(0, 10) }),
    });
    setExpName(""); setExpAmount(""); setShowAddVar(false); fetchMonth();
  };

  const addFixExp = async () => {
    if (!month || !fixName || !fixAmount) return;
    await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "fixed", monthBudgetId: month.id, name: fixName, amount: parseFloat(fixAmount), type: fixType, base: parseFloat(fixBase) || 0 }),
    });
    setFixName(""); setFixAmount(""); setFixBase(""); setShowAddFix(false); fetchMonth();
  };

  const delExp = async (id: string, kind: "variable" | "fixed") => {
    await fetch(`/api/expenses?id=${id}&kind=${kind}`, { method: "DELETE" }); fetchMonth();
  };

  if (!user) return null;

  const totalVarSpent = month?.variableExpenses.reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalFixSpent = month?.fixedExpenses.reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalSpent = totalVarSpent + totalFixSpent;
  const remaining = (month?.totalBudget ?? 0) - totalSpent;
  const spentPct = month?.totalBudget ? Math.min((totalSpent / month.totalBudget) * 100, 100) : 0;

  const varByCategory: Record<string, VarExpense[]> = {};
  for (const e of month?.variableExpenses ?? []) {
    if (!varByCategory[e.type]) varByCategory[e.type] = [];
    varByCategory[e.type].push(e);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonthId(prevMonthId(monthId))} className="p-2 hover:opacity-70 transition"
          style={{ borderRadius: "var(--r-field)" }}>
          <ChevronLeft className="w-5 h-5" style={{ color: "var(--t2)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--t1)" }}>{monthLabel(monthId)}</h1>
        <button onClick={() => setMonthId(nextMonthId(monthId))} className="p-2 hover:opacity-70 transition"
          style={{ borderRadius: "var(--r-field)" }}>
          <ChevronRight className="w-5 h-5" style={{ color: "var(--t2)" }} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : !month ? (
        <div className="text-center py-16 animate-fadeIn" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>No budget set for {monthLabel(monthId)}</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--t3)" }}>Set up your monthly budget to start tracking</p>
          <button onClick={() => setShowSetup(true)} className="px-6 py-2.5 font-semibold text-sm transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
            Set Up Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<DollarSign className="w-5 h-5" style={{ color: "var(--accent-dim)" }} />} label="Total Budget" value={formatCurrency(month.totalBudget, currency)} />
            <StatCard icon={<TrendingDown className="w-5 h-5" style={{ color: "var(--bad)" }} />} label="Total Spent" value={formatCurrency(totalSpent, currency)} />
            <StatCard icon={<TrendingUp className="w-5 h-5" style={{ color: remaining < 0 ? "var(--bad)" : "var(--good)" }} />} label="Remaining"
              value={formatCurrency(remaining, currency)} valueColor={remaining < 0 ? "var(--bad)" : "var(--good)"} />
            <StatCard icon={<ShoppingBag className="w-5 h-5" style={{ color: "var(--accent-dim)" }} />} label="Transactions"
              value={String(month.variableExpenses.length + month.fixedExpenses.length)} />
          </div>

          {/* Progress bar */}
          <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium" style={{ color: "var(--t2)" }}>Budget Usage</span>
              <span style={{ color: "var(--t3)" }}>{spentPct.toFixed(0)}%</span>
            </div>
            <div className="h-3 overflow-hidden" style={{ background: "var(--surface-2)", borderRadius: "var(--r-pill)" }}>
              <div className="h-full transition-all duration-500"
                style={{ width: `${spentPct}%`, borderRadius: "var(--r-pill)", background: spentPct > 90 ? "var(--bad)" : spentPct > 70 ? "var(--warn)" : "var(--accent)" }} />
            </div>
          </div>

          {/* Money Places */}
          <div className="grid grid-cols-3 gap-4">
            <MoneyCard icon={<Landmark className="w-5 h-5" />} label="Bank" value={formatCurrency(month.bankPart, currency)} tint="var(--accent-tint)" />
            <MoneyCard icon={<Home className="w-5 h-5" />} label="Home" value={formatCurrency(month.homePart, currency)} tint="var(--warn-tint)" />
            <MoneyCard icon={<WalletCards className="w-5 h-5" />} label="Wallet" value={formatCurrency(month.walletPart, currency)} tint="var(--good-tint)" />
          </div>

          {/* Variable Expenses */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--t1)" }}>Variable Expenses</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{formatCurrency(totalVarSpent, currency)} spent</p>
              </div>
              <BtnSmall onClick={() => setShowAddVar(true)}>
                <Plus className="w-4 h-4" /> Add
              </BtnSmall>
            </div>
            {month.variableExpenses.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: "var(--t3)" }}>No variable expenses yet</p>
            ) : (
              <div>
                {Object.entries(varByCategory).map(([cat, exps]) => (
                  <div key={cat} className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CAT_COLOR[cat] ?? "#A9A9A9" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--t2)" }}>{cat}</span>
                      <span className="text-xs ml-auto" style={{ color: "var(--t3)" }}>{formatCurrency(exps.reduce((s, e) => s + e.amount, 0), currency)}</span>
                    </div>
                    {exps.map(e => (
                      <div key={e.id} className="flex items-center justify-between ml-5 py-1.5 text-sm">
                        <div>
                          <span style={{ color: "var(--t2)" }}>{e.name}</span>
                          <span className="text-xs ml-2" style={{ color: "var(--t3)" }}>{e.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</span>
                          <button onClick={() => delExp(e.id, "variable")} className="p-1 rounded transition hover:opacity-70"
                            style={{ color: "var(--t3)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed Expenses */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--t1)" }}>Fixed Expenses</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{formatCurrency(totalFixSpent, currency)} spent</p>
              </div>
              <BtnSmall onClick={() => setShowAddFix(true)}>
                <Plus className="w-4 h-4" /> Add
              </BtnSmall>
            </div>
            {month.fixedExpenses.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: "var(--t3)" }}>No fixed expenses yet</p>
            ) : (
              <div>
                {month.fixedExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-4 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CAT_COLOR[e.type] ?? "#A9A9A9" }} />
                      <div>
                        <p className="font-medium" style={{ color: "var(--t2)" }}>{e.name}</p>
                        <p className="text-xs" style={{ color: "var(--t3)" }}>{e.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</p>
                        {e.base > 0 && <p className="text-xs" style={{ color: "var(--t3)" }}>Budget: {formatCurrency(e.base, currency)}</p>}
                      </div>
                      <button onClick={() => delExp(e.id, "fixed")} className="p-1 rounded transition hover:opacity-70"
                        style={{ color: "var(--t3)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showSetup && (
        <Modal title="Set Up Budget" onClose={() => setShowSetup(false)}>
          <div className="space-y-4">
            <Field label="Total Budget" value={setupBudget} onChange={setSetupBudget} type="number" placeholder="5000" />
            <Field label="Home" value={setupHome} onChange={setSetupHome} type="number" placeholder="1500" />
            <Field label="Wallet" value={setupWallet} onChange={setSetupWallet} type="number" placeholder="2000" />
            <Field label="Bank (savings)" value={setupBank} onChange={setSetupBank} type="number" placeholder="1500" />
            <BtnPrimary onClick={createMonth}>Create Budget</BtnPrimary>
          </div>
        </Modal>
      )}

      {showAddVar && (
        <Modal title="Add Variable Expense" onClose={() => setShowAddVar(false)}>
          <div className="space-y-4">
            <Field label="Name" value={expName} onChange={setExpName} placeholder="Coffee with friends" />
            <Field label="Amount" value={expAmount} onChange={setExpAmount} type="number" placeholder="25" />
            <SelectField label="Category" value={expType} onChange={setExpType} options={VARIABLE_TYPES} />
            <BtnPrimary onClick={addVarExp}>Add Expense</BtnPrimary>
          </div>
        </Modal>
      )}

      {showAddFix && (
        <Modal title="Add Fixed Expense" onClose={() => setShowAddFix(false)}>
          <div className="space-y-4">
            <Field label="Name" value={fixName} onChange={setFixName} placeholder="Electricity bill" />
            <Field label="Actual Amount" value={fixAmount} onChange={setFixAmount} type="number" placeholder="150" />
            <Field label="Budgeted Amount" value={fixBase} onChange={setFixBase} type="number" placeholder="120" />
            <SelectField label="Type" value={fixType} onChange={setFixType} options={FIXED_TYPES} />
            <BtnPrimary onClick={addFixExp}>Add Expense</BtnPrimary>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Shared sub-components ── */
function StatCard({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="p-4" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs" style={{ color: "var(--t3)" }}>{label}</span></div>
      <p className="text-lg font-bold" style={{ color: valueColor ?? "var(--t1)" }}>{value}</p>
    </div>
  );
}

function MoneyCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="p-4" style={{ background: tint, borderRadius: "var(--r-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: "var(--t1)" }}>{icon}</span>
        <span className="text-xs font-medium" style={{ color: "var(--t2)" }}>{label}</span>
      </div>
      <p className="text-base font-bold" style={{ color: "var(--t1)" }}>{value}</p>
    </div>
  );
}

function BtnSmall({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition hover:opacity-80"
      style={{ background: "var(--accent-tint)", color: "var(--accent-dim)", borderRadius: "var(--r-field)" }}>
      {children}
    </button>
  );
}

function BtnPrimary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full py-2.5 font-semibold text-sm transition hover:opacity-90"
      style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4">
      <div className="w-full max-w-md p-6 animate-slideUp"
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: "var(--t1)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:opacity-70" style={{ borderRadius: "var(--r-field)" }}>
            <X className="w-5 h-5" style={{ color: "var(--t3)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm outline-none transition"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
        placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm outline-none transition appearance-none"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
        {options.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}

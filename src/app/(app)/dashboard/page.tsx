"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import {
  Plus, CaretLeft, CaretRight, Trash, TrendUp, TrendDown,
  Bank, House, CreditCard, CurrencyDollar, ShoppingBag, X,
} from "@phosphor-icons/react";
import {
  currentMonthId, monthLabel, prevMonthId, nextMonthId,
  formatCurrency, VARIABLE_TYPES, FIXED_TYPES, CAT_COLOR,
} from "@/lib/constants";
import { CAT_ICON, CAT_ICON_FALLBACK, ICON_BY_KEY } from "@/lib/category-icons";

interface VarExpense { id: string; name: string; amount: number; type: string; date: string; person?: string | null }
interface FixExpense { id: string; name: string; amount: number; type: string; base: number; date?: string | null }
interface MonthData {
  id: number; monthId: string; label: string;
  totalBudget: number; homePart: number; walletPart: number; bankPart: number;
  variableCategoryBases: Record<string, number>;
  fixedCategoryBases: Record<string, number>;
  activeVariableCategories: string[];
  activeFixedCategories: string[];
  categoryIcons?: Record<string, string>;
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

  // Helper to get icon for a category
  const getCatIcon = (cat: string) => {
    const iconKey = month?.categoryIcons?.[cat];
    if (iconKey && ICON_BY_KEY[iconKey]) return ICON_BY_KEY[iconKey];
    if (CAT_ICON[cat]) return CAT_ICON[cat];
    return CAT_ICON_FALLBACK;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonthId(prevMonthId(monthId))} className="p-2 hover:opacity-70 transition"
          style={{ borderRadius: "var(--r-field)" }}>
          <CaretLeft size={20} weight="bold" color="var(--t2)" />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--t1)" }}>{monthLabel(monthId)}</h1>
        <button onClick={() => setMonthId(nextMonthId(monthId))} className="p-2 hover:opacity-70 transition"
          style={{ borderRadius: "var(--r-field)" }}>
          <CaretRight size={20} weight="bold" color="var(--t2)" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : !month ? (
        <div className="text-center py-16 animate-fadeIn" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <CurrencyDollar size={48} weight="bold" color="var(--accent)" className="mx-auto mb-4" />
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
            <StatCard icon={<CurrencyDollar size={20} weight="bold" color="var(--accent-dim)" />} label="Total Budget" value={formatCurrency(month.totalBudget, currency)} />
            <StatCard icon={<TrendDown size={20} weight="bold" color="var(--bad)" />} label="Total Spent" value={formatCurrency(totalSpent, currency)} />
            <StatCard icon={<TrendUp size={20} weight="bold" color={remaining < 0 ? "var(--bad)" : "var(--good)"} />} label="Remaining"
              value={formatCurrency(remaining, currency)} valueColor={remaining < 0 ? "var(--bad)" : "var(--good)"} />
            <StatCard icon={<ShoppingBag size={20} weight="bold" color="var(--accent-dim)" />} label="Transactions"
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
            <MoneyCard icon={<Bank size={20} weight="bold" />} label="Bank" value={formatCurrency(month.bankPart, currency)} tint="var(--accent-tint)" />
            <MoneyCard icon={<House size={20} weight="bold" />} label="Home" value={formatCurrency(month.homePart, currency)} tint="var(--warn-tint)" />
            <MoneyCard icon={<CreditCard size={20} weight="bold" />} label="Wallet" value={formatCurrency(month.walletPart, currency)} tint="var(--good-tint)" />
          </div>

          {/* Variable Expenses */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--t1)" }}>Variable Expenses</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{formatCurrency(totalVarSpent, currency)} spent</p>
              </div>
              <BtnSmall onClick={() => setShowAddVar(true)}>
                <Plus size={16} weight="bold" /> Add
              </BtnSmall>
            </div>
            {month.variableExpenses.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: "var(--t3)" }}>No variable expenses yet</p>
            ) : (
              <div>
                {Object.entries(varByCategory).map(([cat, exps]) => {
                  const Icon = getCatIcon(cat);
                  const color = CAT_COLOR[cat] ?? "#8A8175";
                  return (
                    <div key={cat} className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: color }}
                        >
                          <Icon size={16} weight="bold" color="#fff" />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{cat}</span>
                        <span className="text-xs ml-auto font-medium" style={{ color: "var(--t2)" }}>
                          {formatCurrency(exps.reduce((s, e) => s + e.amount, 0), currency)}
                        </span>
                      </div>
                      {exps.map(e => (
                        <div key={e.id} className="flex items-center justify-between ml-11 py-2 text-sm" style={{ borderTop: "1px dashed var(--border-2)" }}>
                          <div>
                            <span style={{ color: "var(--t2)" }}>{e.name}</span>
                            <span className="text-xs ml-2" style={{ color: "var(--t3)" }}>{e.date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</span>
                            <button onClick={() => delExp(e.id, "variable")} className="p-1.5 rounded-lg transition hover:bg-red-50"
                              style={{ color: "var(--bad)" }}><Trash size={14} weight="bold" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
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
                <Plus size={16} weight="bold" /> Add
              </BtnSmall>
            </div>
            {month.fixedExpenses.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: "var(--t3)" }}>No fixed expenses yet</p>
            ) : (
              <div>
                {month.fixedExpenses.map(e => {
                  const Icon = getCatIcon(e.type);
                  const color = CAT_COLOR[e.type] ?? "#8A8175";
                  return (
                    <div key={e.id} className="flex items-center justify-between p-4 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: color }}
                        >
                          <Icon size={16} weight="bold" color="#fff" />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: "var(--t1)" }}>{e.name}</p>
                          <p className="text-xs" style={{ color: "var(--t3)" }}>{e.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</p>
                          {e.base > 0 && <p className="text-xs" style={{ color: "var(--t3)" }}>Budget: {formatCurrency(e.base, currency)}</p>}
                        </div>
                        <button onClick={() => delExp(e.id, "fixed")} className="p-1.5 rounded-lg transition hover:bg-red-50"
                          style={{ color: "var(--bad)" }}><Trash size={14} weight="bold" /></button>
                      </div>
                    </div>
                  );
                })}
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
            <SelectFieldWithIcons label="Category" value={expType} onChange={setExpType} options={month?.activeVariableCategories ?? VARIABLE_TYPES as unknown as string[]} getCatIcon={getCatIcon} />
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
            <SelectFieldWithIcons label="Type" value={fixType} onChange={setFixType} options={month?.activeFixedCategories ?? FIXED_TYPES as unknown as string[]} getCatIcon={getCatIcon} />
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md p-6 animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: "var(--t1)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:opacity-70" style={{ borderRadius: "var(--r-field)" }}>
            <X size={20} weight="bold" color="var(--t3)" />
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

import type { Icon } from "@phosphor-icons/react";

function SelectFieldWithIcons({ label, value, onChange, options, getCatIcon }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  getCatIcon: (cat: string) => Icon;
}) {
  const [open, setOpen] = useState(false);
  const Icon = getCatIcon(value);
  const color = CAT_COLOR[value] ?? "#8A8175";

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-3"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
      >
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: color }}>
          <Icon size={14} weight="bold" color="#fff" />
        </div>
        <span className="flex-1">{value}</span>
        <CaretRight size={14} weight="bold" color="var(--t3)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 z-10 max-h-48 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-card)" }}>
          {options.map(opt => {
            const OptIcon = getCatIcon(opt);
            const optColor = CAT_COLOR[opt] ?? "#8A8175";
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-gray-50"
                style={{ color: "var(--t1)" }}
              >
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: optColor }}>
                  <OptIcon size={14} weight="bold" color="#fff" />
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

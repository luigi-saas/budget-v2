"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { CAT_ICON, CAT_ICON_FALLBACK } from "@/lib/category-icons";
import {
  formatCurrency, currentMonthId, monthLabel, prevMonthId, nextMonthId,
  CAT_COLOR, SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES,
  CURRENCIES,
} from "@/lib/constants";
import {
  ChevronLeft, ChevronRight, Plus, X, Wallet, Building2, Home,
  DollarSign, TrendingDown, LayoutDashboard, Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface VariableExpense { id: string; name: string; amount: number; type: string; date: string; person?: string }
interface FixedExpense { id: string; name: string; amount: number; type: string; base: number; date?: string }
interface MonthData {
  id: number;
  monthId: string;
  label: string;
  totalBudget: number;
  homePart: number;
  walletPart: number;
  bankPart: number;
  variableCategoryBases: Record<string, number>;
  fixedCategoryBases: Record<string, number>;
  activeVariableCategories: string[];
  activeFixedCategories: string[];
  variableExpenses: VariableExpense[];
  fixedExpenses: FixedExpense[];
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [monthId, setMonthId] = useState(currentMonthId());
  const [month, setMonth] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showAddVar, setShowAddVar] = useState(false);
  const [showAddFix, setShowAddFix] = useState(false);

  // Setup form
  const [setupBudget, setSetupBudget] = useState("");
  const [setupBank, setSetupBank] = useState("");
  const [setupHome, setSetupHome] = useState("");
  const [setupWallet, setSetupWallet] = useState("");

  // Add expense forms
  const [varName, setVarName] = useState("");
  const [varAmount, setVarAmount] = useState("");
  const [varType, setVarType] = useState("Groceries");
  const [varDate, setVarDate] = useState(new Date().toISOString().slice(0, 10));
  const [fixName, setFixName] = useState("");
  const [fixAmount, setFixAmount] = useState("");
  const [fixType, setFixType] = useState("Rent");
  const [fixBase, setFixBase] = useState("");

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget?monthId=${monthId}`);
      const data = await res.json();
      setMonth(data.month);
    } catch { /* empty */ }
    setLoading(false);
  }, [monthId]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  if (!user) return null;
  const currency = user.currency ?? "USD";

  const totalSpent = month
    ? month.variableExpenses.reduce((s, e) => s + e.amount, 0) +
      month.fixedExpenses.reduce((s, e) => s + e.amount, 0)
    : 0;
  const remaining = (month?.totalBudget ?? 0) - totalSpent;
  const spentPct = month?.totalBudget ? (totalSpent / month.totalBudget) * 100 : 0;

  const varByCategory: Record<string, VariableExpense[]> = {};
  if (month) {
    for (const e of month.variableExpenses) {
      if (!varByCategory[e.type]) varByCategory[e.type] = [];
      varByCategory[e.type].push(e);
    }
  }

  const pieData = Object.entries(varByCategory).map(([cat, exps]) => ({
    name: cat,
    value: exps.reduce((s, e) => s + e.amount, 0),
    color: CAT_COLOR[cat] ?? "#8A8175",
  }));

  const openSetup = () => {
    setSetupBudget(String(month?.totalBudget ?? ""));
    setSetupBank(String(month?.bankPart ?? ""));
    setSetupHome(String(month?.homePart ?? ""));
    setSetupWallet(String(month?.walletPart ?? ""));
    setShowSetup(true);
  };

  const saveBudget = async () => {
    const totalBudget = parseFloat(setupBudget) || 0;
    const bankPart = parseFloat(setupBank) || 0;
    const homePart = parseFloat(setupHome) || 0;
    const walletPart = parseFloat(setupWallet) || 0;

    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthId,
        label: monthLabel(monthId),
        totalBudget,
        bankPart,
        homePart,
        walletPart,
        variableCategoryBases: month?.variableCategoryBases ?? {},
        fixedCategoryBases: month?.fixedCategoryBases ?? {},
        activeVariableCategories: month?.activeVariableCategories ?? [],
        activeFixedCategories: month?.activeFixedCategories ?? [],
      }),
    });
    setShowSetup(false);
    fetchMonth();
  };

  const addVariableExpense = async () => {
    if (!month || !varName || !varAmount) return;
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "variable", monthBudgetId: month.id, name: varName, amount: varAmount, type: varType, date: varDate }),
    });
    setVarName(""); setVarAmount(""); setShowAddVar(false);
    fetchMonth();
  };

  const addFixedExpense = async () => {
    if (!month || !fixName || !fixAmount) return;
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "fixed", monthBudgetId: month.id, name: fixName, amount: fixAmount, type: fixType, base: fixBase }),
    });
    setFixName(""); setFixAmount(""); setFixBase(""); setShowAddFix(false);
    fetchMonth();
  };

  const deleteExpense = async (id: string, kind: "variable" | "fixed") => {
    await fetch(`/api/expenses?id=${id}&kind=${kind}`, { method: "DELETE" });
    fetchMonth();
  };

  const totalVarSpent = month?.variableExpenses.reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalFixSpent = month?.fixedExpenses.reduce((s, e) => s + e.amount, 0) ?? 0;

  const getCatIcon = (cat: string) => CAT_ICON[cat] ?? CAT_ICON_FALLBACK;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--t1)" }}>
            <LayoutDashboard className="w-6 h-6" style={{ color: "var(--accent-dim)" }} />
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Track your monthly budget</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 p-1 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <button onClick={() => setMonthId(prevMonthId(monthId))}
            className="p-2 rounded-lg transition hover:opacity-70"
            style={{ background: "var(--surface-2)" }}>
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--t2)" }} />
          </button>
          <span className="px-3 text-sm font-semibold" style={{ color: "var(--t1)", minWidth: 120, textAlign: "center" }}>
            {monthLabel(monthId)}
          </span>
          <button onClick={() => setMonthId(nextMonthId(monthId))}
            className="p-2 rounded-lg transition hover:opacity-70"
            style={{ background: "var(--surface-2)" }}>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--t2)" }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : !month ? (
        <div className="text-center py-20 animate-fadeIn"
          style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-tint)" }}>
            <DollarSign className="w-8 h-8" style={{ color: "var(--accent-dim)" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--t1)" }}>No budget set for {monthLabel(monthId)}</h2>
          <p className="text-sm mb-6" style={{ color: "var(--t3)" }}>Set up your monthly budget to start tracking</p>
          <button onClick={openSetup}
            className="px-6 py-3 font-semibold text-sm rounded-xl transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "var(--shadow-btn)" }}>
            Set Up Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <DollarSign className="w-5 h-5" />, label: "Total Budget", value: formatCurrency(month.totalBudget, currency), color: undefined },
              { icon: <TrendingDown className="w-5 h-5" />, label: "Total Spent", value: formatCurrency(totalSpent, currency), color: undefined },
              { icon: <Wallet className="w-5 h-5" />, label: "Remaining", value: formatCurrency(remaining, currency), color: remaining < 0 ? "var(--bad)" : "var(--good)" },
              { icon: <LayoutDashboard className="w-5 h-5" />, label: "Transactions", value: String(month.variableExpenses.length + month.fixedExpenses.length), color: undefined },
            ].map(card => (
              <div key={card.label} className="p-5"
                style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: "var(--t3)" }}>
                  {card.icon}
                  <span className="text-xs font-medium">{card.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: card.color ?? "var(--t1)" }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Budget Usage</span>
              <span className="text-sm font-bold"
                style={{ color: spentPct > 90 ? "var(--bad)" : spentPct > 70 ? "var(--warn)" : "var(--accent-dim)" }}>
                {spentPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--border-2)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(spentPct, 100)}%`, background: spentPct > 90 ? "var(--bad)" : spentPct > 70 ? "var(--warn)" : "var(--accent)" }} />
            </div>
          </div>

          {/* Money Places */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Building2 className="w-5 h-5" />, label: "Bank", value: formatCurrency(month.bankPart, currency), tint: "var(--accent-tint)" },
              { icon: <Home className="w-5 h-5" />, label: "Home", value: formatCurrency(month.homePart, currency), tint: "var(--warn-tint)" },
              { icon: <Wallet className="w-5 h-5" />, label: "Wallet", value: formatCurrency(month.walletPart, currency), tint: "var(--good-tint)" },
            ].map(mp => (
              <div key={mp.label} className="p-4 text-center"
                style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: mp.tint, color: "var(--t2)" }}>
                  {mp.icon}
                </div>
                <p className="text-xs" style={{ color: "var(--t3)" }}>{mp.label}</p>
                <p className="font-bold text-sm mt-1" style={{ color: "var(--t1)" }}>{mp.value}</p>
              </div>
            ))}
          </div>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--t1)" }}>Spending by Category</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0), currency)}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs truncate" style={{ color: "var(--t2)" }}>{d.name}</span>
                      <span className="text-xs font-medium ml-auto" style={{ color: "var(--t1)" }}>{formatCurrency(d.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Variable Expenses */}
          <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--t1)" }}>Variable Expenses</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{formatCurrency(totalVarSpent, currency)} spent</p>
              </div>
              <button onClick={() => setShowAddVar(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition hover:opacity-90"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {month.variableExpenses.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--t3)" }}>No variable expenses yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(varByCategory).map(([cat, exps]) => {
                  const CatIcon = getCatIcon(cat);
                  const color = CAT_COLOR[cat] ?? "#8A8175";
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: color + "20" }}>
                          <CatIcon size={12} color={color} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "var(--t2)" }}>{cat}</span>
                        <span className="text-xs ml-auto" style={{ color: "var(--t3)" }}>
                          {formatCurrency(exps.reduce((s, e) => s + e.amount, 0), currency)}
                        </span>
                      </div>
                      {exps.map(e => (
                        <div key={e.id} className="flex items-center justify-between py-2 pl-8 group"
                          style={{ borderBottom: "1px solid var(--border)" }}>
                          <div>
                            <p className="text-sm" style={{ color: "var(--t1)" }}>{e.name}</p>
                            <p className="text-xs" style={{ color: "var(--t3)" }}>{e.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</span>
                            <button onClick={() => deleteExpense(e.id, "variable")}
                              className="opacity-0 group-hover:opacity-100 p-1 transition rounded"
                              style={{ color: "var(--bad)" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
          <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--t1)" }}>Fixed Expenses</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{formatCurrency(totalFixSpent, currency)} spent</p>
              </div>
              <button onClick={() => setShowAddFix(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition hover:opacity-90"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {month.fixedExpenses.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--t3)" }}>No fixed expenses yet</p>
            ) : (
              <div className="space-y-2">
                {month.fixedExpenses.map(e => {
                  const FixIcon = getCatIcon(e.type);
                  const color = CAT_COLOR[e.type] ?? "#8A8175";
                  return (
                    <div key={e.id} className="flex items-center justify-between py-3 px-3 rounded-xl group"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: color + "20" }}>
                          <FixIcon size={14} color={color} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>{e.name}</p>
                          <p className="text-xs" style={{ color: "var(--t3)" }}>{e.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</p>
                          {e.base > 0 && <p className="text-xs" style={{ color: "var(--t3)" }}>Budget: {formatCurrency(e.base, currency)}</p>}
                        </div>
                        <button onClick={() => deleteExpense(e.id, "fixed")}
                          className="opacity-0 group-hover:opacity-100 p-1 transition rounded"
                          style={{ color: "var(--bad)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit budget */}
          <div className="flex justify-end">
            <button onClick={openSetup}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border transition hover:opacity-80"
              style={{ color: "var(--t2)", borderColor: "var(--border-2)" }}>
              Edit Budget
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showSetup && (
        <Modal title={month ? "Edit Budget" : "Set Up Budget"} onClose={() => setShowSetup(false)}>
          <Field label="Total Budget" value={setupBudget} onChange={setSetupBudget} type="number" placeholder="3000" />
          <Field label="Bank" value={setupBank} onChange={setSetupBank} type="number" placeholder="600" />
          <Field label="Home" value={setupHome} onChange={setSetupHome} type="number" placeholder="900" />
          <Field label="Wallet" value={setupWallet} onChange={setSetupWallet} type="number" placeholder="1500" />
          <BtnPrimary onClick={saveBudget}>{month ? "Save Changes" : "Create Budget"}</BtnPrimary>
        </Modal>
      )}

      {showAddVar && (
        <Modal title="Add Variable Expense" onClose={() => setShowAddVar(false)}>
          <Field label="Name" value={varName} onChange={setVarName} placeholder="Grocery run" />
          <Field label="Amount" value={varAmount} onChange={setVarAmount} type="number" placeholder="45.00" />
          <SelectField label="Category" value={varType} onChange={setVarType}
            options={month?.activeVariableCategories.length ? month.activeVariableCategories : SUGGESTED_VARIABLE_CATEGORIES.map(c => c.type)} />
          <Field label="Date" value={varDate} onChange={setVarDate} type="date" />
          <BtnPrimary onClick={addVariableExpense}>Add Expense</BtnPrimary>
        </Modal>
      )}

      {showAddFix && (
        <Modal title="Add Fixed Expense" onClose={() => setShowAddFix(false)}>
          <Field label="Name" value={fixName} onChange={setFixName} placeholder="Electricity bill" />
          <Field label="Amount" value={fixAmount} onChange={setFixAmount} type="number" placeholder="120.00" />
          <Field label="Budgeted Amount" value={fixBase} onChange={setFixBase} type="number" placeholder="100.00" />
          <SelectField label="Category" value={fixType} onChange={setFixType}
            options={month?.activeFixedCategories.length ? month.activeFixedCategories : SUGGESTED_FIXED_CATEGORIES.map(c => c.type)} />
          <BtnPrimary onClick={addFixedExpense}>Add Expense</BtnPrimary>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function BtnPrimary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full py-3 font-semibold text-sm rounded-xl transition hover:opacity-90 mt-2"
      style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "var(--shadow-btn)" }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm p-6 space-y-4 animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "var(--t1)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition hover:opacity-70"
            style={{ background: "var(--surface-2)" }}>
            <X className="w-4 h-4" style={{ color: "var(--t2)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--t3)" }}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm outline-none transition"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
        placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--t3)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm outline-none"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

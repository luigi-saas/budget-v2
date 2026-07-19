"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, X, LayoutDashboard,
  Wallet, Home, Landmark, TrendingUp, ShoppingBag, Zap,
} from "lucide-react";
import {
  formatCurrency, CAT_COLOR, currentMonthId, monthLabel,
  prevMonthId, nextMonthId, VARIABLE_TYPES, FIXED_TYPES,
  MANAGEMENT_STRATEGIES, SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES,
} from "@/lib/constants";
import { CAT_ICON, CAT_ICON_FALLBACK, CUSTOM_ICON_CHOICES, ICON_BY_KEY } from "@/lib/category-icons";
import type { Icon } from "@phosphor-icons/react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface VariableExpense { id: string; name: string; amount: number; type: string; date: string; person?: string }
interface FixedExpense { id: string; name: string; amount: number; type: string; base: number; date?: string }
interface MonthData {
  id: number; monthId: string; label: string; totalBudget: number;
  homePart: number; walletPart: number; bankPart: number;
  variableCategoryBases: Record<string, number>;
  fixedCategoryBases: Record<string, number>;
  activeVariableCategories: string[];
  activeFixedCategories: string[];
  categoryColors: Record<string, string>;
  categoryIcons: Record<string, string>;
  variableExpenses: VariableExpense[];
  fixedExpenses: FixedExpense[];
}

function getCatIcon(cat: string): Icon {
  return CAT_ICON[cat] ?? CAT_ICON_FALLBACK;
}

// ── Charts ────────────────────────────────────────────────────────────────────
function SpendingPieChart({ data, currency }: { data: { name: string; value: number; color: string }[]; currency: string }) {
  if (data.length === 0) return null;
  return (
    <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--t1)" }}>Spending by Category</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div style={{ width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0), currency)} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0 w-full">
          {data.slice(0, 8).map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-xs flex-1 truncate" style={{ color: "var(--t2)" }}>{d.name}</span>
              <span className="text-xs font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(d.value, currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetBarChart({ budget, spent, currency }: { budget: number; spent: number; currency: string }) {
  const remaining = budget - spent;
  const data = [
    { name: "Spent", value: spent, fill: spent > budget ? "var(--bad)" : "var(--accent)" },
    { name: "Remaining", value: Math.max(remaining, 0), fill: "var(--good-tint)" },
  ];
  return (
    <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--t1)" }}>Budget Overview</h3>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tickFormatter={v => formatCurrency(v, currency)} tick={{ fontSize: 11, fill: "var(--t3)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--t2)" }} axisLine={false} tickLine={false} width={70} />
            <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0), currency)} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
  const [totalBudget, setTotalBudget] = useState("");
  const [homePart, setHomePart] = useState("");
  const [walletPart, setWalletPart] = useState("");
  const [bankPart, setBankPart] = useState("");

  // Add var form
  const [varName, setVarName] = useState("");
  const [varAmount, setVarAmount] = useState("");
  const [varType, setVarType] = useState("Groceries");
  const [varDate, setVarDate] = useState(new Date().toISOString().slice(0, 10));

  // Add fix form
  const [fixName, setFixName] = useState("");
  const [fixAmount, setFixAmount] = useState("");
  const [fixType, setFixType] = useState("Rent");
  const [fixBase, setFixBase] = useState("");

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/months?monthId=${monthId}`);
    const data = await res.json();
    setMonth(data.month ?? null);
    setLoading(false);
  }, [monthId]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  if (!user) return null;
  const currency = user.currency ?? "USD";

  const totalSpent = (month?.variableExpenses ?? []).reduce((s, e) => s + e.amount, 0)
    + (month?.fixedExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const totalVarSpent = (month?.variableExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const totalFixSpent = (month?.fixedExpenses ?? []).reduce((s, e) => s + e.amount, 0);
  const remaining = (month?.totalBudget ?? 0) - totalSpent;
  const spentPct = month && month.totalBudget > 0 ? (totalSpent / month.totalBudget) * 100 : 0;

  // Group variable expenses by category
  const varByCategory: Record<string, VariableExpense[]> = {};
  for (const e of month?.variableExpenses ?? []) {
    if (!varByCategory[e.type]) varByCategory[e.type] = [];
    varByCategory[e.type].push(e);
  }

  // Chart data
  const pieData: { name: string; value: number; color: string }[] = [];
  for (const [cat, exps] of Object.entries(varByCategory)) {
    const total = exps.reduce((s, e) => s + e.amount, 0);
    pieData.push({ name: cat, value: total, color: CAT_COLOR[cat] ?? "#8A8175" });
  }
  for (const e of month?.fixedExpenses ?? []) {
    const existing = pieData.find(d => d.name === e.type);
    if (existing) existing.value += e.amount;
    else pieData.push({ name: e.type, value: e.amount, color: CAT_COLOR[e.type] ?? "#8A8175" });
  }
  pieData.sort((a, b) => b.value - a.value);

  const handleSetup = async () => {
    const tb = parseFloat(totalBudget) || 0;
    const hp = parseFloat(homePart) || 0;
    const wp = parseFloat(walletPart) || 0;
    const bp = parseFloat(bankPart) || 0;
    await fetch("/api/months", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthId, label: monthLabel(monthId), totalBudget: tb,
        homePart: hp, walletPart: wp, bankPart: bp,
        variableCategoryBases: {}, fixedCategoryBases: {},
        activeVariableCategories: VARIABLE_TYPES.slice(0, 6),
        activeFixedCategories: FIXED_TYPES.slice(0, 4),
        categoryColors: {}, categoryIcons: {},
      }),
    });
    setShowSetup(false); fetchMonth();
    setTotalBudget(""); setHomePart(""); setWalletPart(""); setBankPart("");
  };

  const handleAddVar = async () => {
    if (!varName || !varAmount || !month) return;
    await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "variable", monthBudgetId: month.id, name: varName, amount: parseFloat(varAmount), type: varType, date: varDate }),
    });
    setShowAddVar(false); fetchMonth();
    setVarName(""); setVarAmount(""); setVarType("Groceries");
  };

  const handleAddFix = async () => {
    if (!fixName || !fixAmount || !month) return;
    await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "fixed", monthBudgetId: month.id, name: fixName, amount: parseFloat(fixAmount), type: fixType, base: parseFloat(fixBase) || 0 }),
    });
    setShowAddFix(false); fetchMonth();
    setFixName(""); setFixAmount(""); setFixType("Rent"); setFixBase("");
  };

  const handleDeleteExpense = async (id: string, kind: "variable" | "fixed") => {
    await fetch(`/api/expenses?id=${id}&kind=${kind}`, { method: "DELETE" });
    fetchMonth();
  };

  const availableVarTypes = month?.activeVariableCategories?.length ? month.activeVariableCategories : [...VARIABLE_TYPES];
  const availableFixTypes = month?.activeFixedCategories?.length ? month.activeFixedCategories : [...FIXED_TYPES];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--t3)" }}>Track your monthly budget</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setMonthId(prevMonthId(monthId)); setLoading(true); }}
            className="w-8 h-8 flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-field)" }}>
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--t2)" }} />
          </button>
          <span className="text-sm font-medium px-3 py-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
            {monthLabel(monthId)}
          </span>
          <button onClick={() => { setMonthId(nextMonthId(monthId)); setLoading(true); }}
            className="w-8 h-8 flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-field)" }}>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--t2)" }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : !month ? (
        <div className="text-center py-20" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <LayoutDashboard className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--t3)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>No budget set for {monthLabel(monthId)}</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--t3)" }}>Set up your monthly budget to start tracking</p>
          <button onClick={() => setShowSetup(true)} className="px-6 py-2.5 font-semibold text-sm transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
            Set Up Budget
          </button>
        </div>
      ) : (
        <div className="space-y-5 animate-fadeIn">
          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <Landmark className="w-4 h-4" />, label: "Total Budget", value: formatCurrency(month.totalBudget, currency), color: undefined },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Total Spent", value: formatCurrency(totalSpent, currency), color: undefined },
              { icon: <Wallet className="w-4 h-4" />, label: "Remaining", value: formatCurrency(remaining, currency), color: remaining < 0 ? "var(--bad)" : "var(--good)" },
              { icon: <ShoppingBag className="w-4 h-4" />, label: "Transactions", value: String(month.variableExpenses.length + month.fixedExpenses.length), color: undefined },
            ].map(card => (
              <div key={card.label} className="p-4" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: "var(--t3)" }}>
                  {card.icon}
                  <span className="text-xs font-medium">{card.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: card.color ?? "var(--t1)" }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="p-4" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: "var(--t2)" }}>Budget Usage</span>
              <span className="text-sm font-bold" style={{ color: spentPct > 90 ? "var(--bad)" : spentPct > 70 ? "var(--warn)" : "var(--accent-dim)" }}>
                {spentPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(spentPct, 100)}%`, background: spentPct > 90 ? "var(--bad)" : spentPct > 70 ? "var(--warn)" : "var(--accent)" }} />
            </div>
          </div>

          {/* Money Places */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Landmark className="w-5 h-5" />, label: "Bank", value: formatCurrency(month.bankPart, currency), tint: "var(--accent-tint)" },
              { icon: <Home className="w-5 h-5" />, label: "Home", value: formatCurrency(month.homePart, currency), tint: "var(--warn-tint)" },
              { icon: <Wallet className="w-5 h-5" />, label: "Wallet", value: formatCurrency(month.walletPart, currency), tint: "var(--good-tint)" },
            ].map(mp => (
              <div key={mp.label} className="p-4 flex flex-col items-center gap-2" style={{ background: mp.tint, borderRadius: "var(--r-card)", border: "1px solid var(--border)" }}>
                <div style={{ color: "var(--t2)" }}>{mp.icon}</div>
                <span className="text-xs font-medium" style={{ color: "var(--t3)" }}>{mp.label}</span>
                <span className="font-bold text-sm" style={{ color: "var(--t1)" }}>{mp.value}</span>
              </div>
            ))}
          </div>

          {/* Charts */}
          {pieData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SpendingPieChart data={pieData} currency={currency} />
              <BudgetBarChart budget={month.totalBudget} spent={totalSpent} currency={currency} />
            </div>
          )}

          {/* Variable Expenses */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" style={{ color: "var(--t3)" }} />
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Variable Expenses</h2>
                  <p className="text-xs" style={{ color: "var(--t3)" }}>{formatCurrency(totalVarSpent, currency)} spent</p>
                </div>
              </div>
              <BtnSmall onClick={() => setShowAddVar(true)}><Plus className="w-3.5 h-3.5" /> Add</BtnSmall>
            </div>
            {month.variableExpenses.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--t3)" }}>No variable expenses yet</p>
            ) : (
              <div>
                {Object.entries(varByCategory).map(([cat, exps]) => {
                  const CatIcon = getCatIcon(cat);
                  const color = CAT_COLOR[cat] ?? "#8A8175";
                  return (
                    <div key={cat} style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "var(--surface-2)" }}>
                        <CatIcon size={14} style={{ color }} weight="duotone" />
                        <span className="text-xs font-semibold" style={{ color: "var(--t2)" }}>{cat}</span>
                        <span className="ml-auto text-xs font-medium" style={{ color }}>
                          {formatCurrency(exps.reduce((s, e) => s + e.amount, 0), currency)}
                        </span>
                      </div>
                      {exps.map(e => (
                        <div key={e.id} className="flex items-center justify-between px-4 py-2.5 transition hover:opacity-80"
                          style={{ borderTop: "1px solid var(--border)" }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>{e.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{e.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</span>
                            <button onClick={() => handleDeleteExpense(e.id, "variable")} className="p-1 transition hover:opacity-70">
                              <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--t3)" }} />
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
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "var(--t3)" }} />
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Fixed Expenses</h2>
                  <p className="text-xs" style={{ color: "var(--t3)" }}>{formatCurrency(totalFixSpent, currency)} spent</p>
                </div>
              </div>
              <BtnSmall onClick={() => setShowAddFix(true)}><Plus className="w-3.5 h-3.5" /> Add</BtnSmall>
            </div>
            {month.fixedExpenses.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--t3)" }}>No fixed expenses yet</p>
            ) : (
              <div>
                {month.fixedExpenses.map(e => {
                  const FixIcon = getCatIcon(e.type);
                  const color = CAT_COLOR[e.type] ?? "#8A8175";
                  return (
                    <div key={e.id} className="flex items-center justify-between p-4 transition hover:opacity-80"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center" style={{ background: `${color}20`, borderRadius: "var(--r-field)" }}>
                          <FixIcon size={16} style={{ color }} weight="duotone" />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>{e.name}</p>
                          <p className="text-xs" style={{ color: "var(--t3)" }}>{e.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{formatCurrency(e.amount, currency)}</p>
                          {e.base > 0 && <p className="text-xs" style={{ color: "var(--t3)" }}>Budget: {formatCurrency(e.base, currency)}</p>}
                        </div>
                        <button onClick={() => handleDeleteExpense(e.id, "fixed")} className="p-1 transition hover:opacity-70">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--t3)" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit budget button */}
          <button onClick={() => setShowSetup(true)} className="w-full py-2.5 text-sm font-medium transition hover:opacity-70"
            style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-field)" }}>
            Edit Budget Settings
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showSetup && (
        <Modal title={month ? "Edit Budget" : "Set Up Budget"} onClose={() => setShowSetup(false)}>
          <div className="space-y-4">
            <Field label="Total Budget" value={totalBudget} onChange={setTotalBudget} type="number" placeholder={String(month?.totalBudget ?? 3000)} />
            <Field label="Bank Part" value={bankPart} onChange={setBankPart} type="number" placeholder={String(month?.bankPart ?? 0)} />
            <Field label="Home Part" value={homePart} onChange={setHomePart} type="number" placeholder={String(month?.homePart ?? 0)} />
            <Field label="Wallet Part" value={walletPart} onChange={setWalletPart} type="number" placeholder={String(month?.walletPart ?? 0)} />
            <BtnPrimary onClick={handleSetup}>{month ? "Save Changes" : "Create Budget"}</BtnPrimary>
          </div>
        </Modal>
      )}

      {showAddVar && (
        <Modal title="Add Variable Expense" onClose={() => setShowAddVar(false)}>
          <div className="space-y-4">
            <Field label="Name" value={varName} onChange={setVarName} placeholder="Coffee" />
            <Field label="Amount" value={varAmount} onChange={setVarAmount} type="number" placeholder="12.50" />
            <SelectFieldWithIcons label="Category" value={varType} onChange={setVarType} options={availableVarTypes} getCatIcon={getCatIcon} />
            <Field label="Date" value={varDate} onChange={setVarDate} type="date" />
            <BtnPrimary onClick={handleAddVar}>Add Expense</BtnPrimary>
          </div>
        </Modal>
      )}

      {showAddFix && (
        <Modal title="Add Fixed Expense" onClose={() => setShowAddFix(false)}>
          <div className="space-y-4">
            <Field label="Name" value={fixName} onChange={setFixName} placeholder="Rent" />
            <Field label="Amount" value={fixAmount} onChange={setFixAmount} type="number" placeholder="1200" />
            <SelectFieldWithIcons label="Type" value={fixType} onChange={setFixType} options={availableFixTypes} getCatIcon={getCatIcon} />
            <Field label="Budget (optional)" value={fixBase} onChange={setFixBase} type="number" placeholder="1200" />
            <BtnPrimary onClick={handleAddFix}>Add Expense</BtnPrimary>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function BtnSmall({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
      style={{ background: "var(--accent-tint)", color: "var(--accent-dim)", borderRadius: "var(--r-field)" }}>
      {children}
    </button>
  );
}

function BtnPrimary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full py-2.5 font-semibold text-sm transition hover:opacity-90"
      style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md p-6 animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
            <X className="w-4 h-4" style={{ color: "var(--t3)" }} />
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

function SelectFieldWithIcons({ label, value, onChange, options, getCatIcon }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; getCatIcon: (cat: string) => Icon;
}) {
  const [open, setOpen] = useState(false);
  const CatIcon = getCatIcon(value);
  const color = CAT_COLOR[value] ?? "#8A8175";

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>{label}</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm outline-none text-left transition"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
        <CatIcon size={16} style={{ color }} weight="duotone" />
        <span className="flex-1">{value}</span>
        <span style={{ color: "var(--t3)" }}>▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-card)" }}>
          {options.map(opt => {
            const OptIcon = getCatIcon(opt);
            const optColor = CAT_COLOR[opt] ?? "#8A8175";
            return (
              <button key={opt} type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition hover:opacity-70"
                style={{ color: "var(--t1)", background: opt === value ? "var(--accent-tint)" : "transparent" }}>
                <OptIcon size={15} style={{ color: optColor }} weight="duotone" />
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

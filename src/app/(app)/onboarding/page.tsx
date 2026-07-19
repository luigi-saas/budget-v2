"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { CAT_ICON, CAT_ICON_FALLBACK } from "@/lib/category-icons";
import {
  formatCurrency, currentMonthId, monthLabel,
  MANAGEMENT_STRATEGIES, SUGGESTED_VARIABLE_CATEGORIES,
  SUGGESTED_FIXED_CATEGORIES, CAT_COLOR,
} from "@/lib/constants";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = ["Welcome", "Income", "Variable Categories", "Fixed Bills", "Strategy", "Summary"];

export default function OnboardingPage() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [variableCats, setVariableCats] = useState<string[]>(
    SUGGESTED_VARIABLE_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  );
  const [fixedCats, setFixedCats] = useState<string[]>(
    SUGGESTED_FIXED_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  );
  const [strategyId, setStrategyId] = useState("50-30-20");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const currency = user?.currency ?? "USD";
  const monthId = currentMonthId();
  const incomeNum = parseFloat(income) || 0;
  const strategy = MANAGEMENT_STRATEGIES.find(s => s.id === strategyId) ?? MANAGEMENT_STRATEGIES[0];
  const walletShare = 1 - strategy.homeShare - strategy.bankShare;
  const homePart = incomeNum * strategy.homeShare;
  const bankPart = incomeNum * strategy.bankShare;
  const walletPart = incomeNum * walletShare;

  useEffect(() => {
    if (user?.onboardingComplete) router.push("/dashboard");
  }, [user, router]);

  const toggleCat = (list: string[], setList: (v: string[]) => void, cat: string) => {
    setList(list.includes(cat) ? list.filter(c => c !== cat) : [...list, cat]);
  };

  const buildCategoryBases = (cats: string[], income: number, suggestions: typeof SUGGESTED_VARIABLE_CATEGORIES) => {
    const bases: Record<string, number> = {};
    for (const cat of cats) {
      const s = suggestions.find(c => c.type === cat);
      bases[cat] = s ? (income * s.sharePct) / 100 : 0;
    }
    return bases;
  };

  const handleFinish = async () => {
    if (incomeNum <= 0) { setError("Please enter a valid income."); setStep(1); return; }
    setSaving(true);
    setError("");
    try {
      const variableCategoryBases = buildCategoryBases(variableCats, incomeNum, SUGGESTED_VARIABLE_CATEGORIES);
      const fixedCategoryBases = buildCategoryBases(fixedCats, incomeNum, SUGGESTED_FIXED_CATEGORIES);

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthId,
          label: monthLabel(monthId),
          totalBudget: incomeNum,
          homePart,
          bankPart,
          walletPart,
          variableCategoryBases,
          fixedCategoryBases,
          activeVariableCategories: variableCats,
          activeFixedCategories: fixedCats,
        }),
      });

      if (!res.ok) { setError("Failed to save. Please try again."); setSaving(false); return; }
      await refreshUser();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto pt-8 pb-16 px-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--t3)" }}>Step {step + 1} of {STEPS.length}</span>
          <span className="text-xs font-medium" style={{ color: "var(--t3)" }}>{STEPS[step]}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-2)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "var(--accent)" }} />
        </div>
      </div>

      {/* Card */}
      <div className="p-8 animate-fadeIn"
        style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>

        {/* Welcome */}
        {step === 0 && (
          <div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
              style={{ background: "var(--accent-tint)" }}>
              <span className="text-3xl">🎉</span>
            </div>
            <h1 className="text-2xl font-bold text-center mb-3" style={{ color: "var(--t1)" }}>
              Welcome to Flousy!
            </h1>
            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: "var(--t2)" }}>
              Let&apos;s set up your first budget in a few quick steps. We&apos;ll help you track expenses, set saving goals, and understand your spending patterns.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Variable Expenses", desc: "Track day-to-day spending" },
                { label: "Fixed Bills", desc: "Monthly recurring charges" },
                { label: "Saving Goals", desc: "Save towards targets" },
                { label: "Reports", desc: "Insights & analytics" },
              ].map(f => (
                <div key={f.label} className="p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Income */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--t1)" }}>Monthly Income</h2>
            <p className="text-sm mb-6" style={{ color: "var(--t3)" }}>
              What&apos;s your monthly income? We&apos;ll use it to suggest budgets for each category.
            </p>
            <label className="text-xs font-medium" style={{ color: "var(--t3)" }}>Income Amount</label>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              autoFocus
              min="0"
              step="100"
              className="mt-1.5 w-full px-4 py-3 text-lg font-semibold outline-none transition"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
              placeholder="3000"
            />
            <p className="text-xs mt-2" style={{ color: "var(--t3)" }}>Amount in {currency}, before any deductions.</p>
          </div>
        )}

        {/* Variable Categories */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--t1)" }}>Variable Expenses</h2>
            <p className="text-sm mb-5" style={{ color: "var(--t3)" }}>Pick the categories you spend on day to day.</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_VARIABLE_CATEGORIES.map(c => {
                const Icon = CAT_ICON[c.type] ?? CAT_ICON_FALLBACK;
                const active = variableCats.includes(c.type);
                const color = CAT_COLOR[c.type] ?? "#8A8175";
                return (
                  <button key={c.type}
                    onClick={() => toggleCat(variableCats, setVariableCats, c.type)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition"
                    style={{
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? "var(--accent)" : color + "20" }}>
                      <Icon size={16} color={active ? "var(--accent-ink)" : color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: active ? "var(--accent-dim)" : "var(--t1)" }}>{c.type}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--t3)" }}>{c.hint}</p>
                    </div>
                    {active && <Check className="w-3 h-3 flex-shrink-0 ml-auto" style={{ color: "var(--accent-dim)" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fixed Bills */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--t1)" }}>Fixed Bills</h2>
            <p className="text-sm mb-5" style={{ color: "var(--t3)" }}>Which recurring bills do you pay each month?</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_FIXED_CATEGORIES.map(c => {
                const Icon = CAT_ICON[c.type] ?? CAT_ICON_FALLBACK;
                const active = fixedCats.includes(c.type);
                const color = CAT_COLOR[c.type] ?? "#8A8175";
                return (
                  <button key={c.type}
                    onClick={() => toggleCat(fixedCats, setFixedCats, c.type)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition"
                    style={{
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? "var(--accent)" : color + "20" }}>
                      <Icon size={16} color={active ? "var(--accent-ink)" : color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: active ? "var(--accent-dim)" : "var(--t1)" }}>{c.type}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--t3)" }}>{c.hint}</p>
                    </div>
                    {active && <Check className="w-3 h-3 flex-shrink-0 ml-auto" style={{ color: "var(--accent-dim)" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategy */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--t1)" }}>Budget Strategy</h2>
            <p className="text-sm mb-5" style={{ color: "var(--t3)" }}>How do you want to manage your money?</p>
            <div className="space-y-3">
              {MANAGEMENT_STRATEGIES.map(s => {
                const active = s.id === strategyId;
                return (
                  <button key={s.id} onClick={() => setStrategyId(s.id)}
                    className="w-full p-4 rounded-xl text-left transition"
                    style={{
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm" style={{ color: active ? "var(--accent-dim)" : "var(--t1)" }}>{s.name}</span>
                      {s.recommended && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>Recommended</span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>{s.tagline}</p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--t2)" }}>{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--t1)" }}>All Set!</h2>
            <p className="text-sm mb-6" style={{ color: "var(--t3)" }}>Here&apos;s your budget breakdown for {monthLabel(monthId)}.</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl"
                style={{ background: "var(--accent-tint)", border: "1px solid var(--accent)" }}>
                <span className="font-semibold text-sm" style={{ color: "var(--t1)" }}>Monthly Income</span>
                <span className="font-bold text-base" style={{ color: "var(--accent-dim)" }}>{formatCurrency(incomeNum, currency)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "BANK", value: bankPart },
                  { label: "HOME", value: homePart },
                  { label: "WALLET", value: walletPart },
                ].map(mp => (
                  <div key={mp.label} className="text-center p-3 rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: "var(--t3)" }}>{mp.label}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--t1)" }}>{formatCurrency(mp.value, currency)}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--t3)" }}>Strategy: </span>
                <span className="font-semibold" style={{ color: "var(--accent-dim)" }}>{strategy.name}</span>
                <p className="text-xs mt-2" style={{ color: "var(--t3)" }}>
                  {variableCats.length} expense {variableCats.length === 1 ? "category" : "categories"} and {fixedCats.length} fixed {fixedCats.length === 1 ? "bill" : "bills"} set up.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--bad-tint)", color: "var(--bad)", border: "1px solid var(--bad)" }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border transition hover:opacity-80"
              style={{ color: "var(--t2)", borderColor: "var(--border-2)" }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--good)", color: "#fff" }}>
              {saving ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><Check className="w-4 h-4" /> Start Budgeting</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

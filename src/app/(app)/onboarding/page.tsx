"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  formatCurrency, MANAGEMENT_STRATEGIES, ManagementStrategy,
  SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES,
  currentMonthId, monthLabel, CAT_COLOR,
} from "@/lib/constants";
import { CAT_ICON, CAT_ICON_FALLBACK } from "@/lib/category-icons";

const STEPS = ["Welcome", "Income", "Variable Categories", "Fixed Bills", "Strategy", "Summary"];

export default function OnboardingPage() {
  const { user, refetchUser } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [currency] = useState(user?.currency ?? "USD");
  const [variableCats, setVariableCats] = useState<string[]>(
    SUGGESTED_VARIABLE_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  );
  const [fixedCats, setFixedCats] = useState<string[]>(
    SUGGESTED_FIXED_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  );
  const [strategyId, setStrategyId] = useState("50-30-20");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.onboardingComplete) router.push("/dashboard");
  }, [user, router]);

  const incomeNum = parseFloat(income) || 0;
  const strategy = MANAGEMENT_STRATEGIES.find(s => s.id === strategyId) ?? MANAGEMENT_STRATEGIES[0];
  const walletShare = 1 - strategy.homeShare - strategy.bankShare;
  const bankPart = incomeNum * strategy.bankShare;
  const homePart = incomeNum * strategy.homeShare;
  const walletPart = incomeNum * walletShare;

  const toggleVar = (type: string) => {
    setVariableCats(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleFixed = (type: string) => {
    setFixedCats(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleNext = () => {
    if (step === 1 && !income) { setError("Please enter your monthly income"); return; }
    setError("");
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError("");
    try {
      const monthId = currentMonthId();
      // Create this month's budget
      await fetch("/api/months", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthId, label: monthLabel(monthId), totalBudget: incomeNum,
          homePart, walletPart, bankPart,
          variableCategoryBases: Object.fromEntries(
            SUGGESTED_VARIABLE_CATEGORIES
              .filter(c => variableCats.includes(c.type))
              .map(c => [c.type, (incomeNum * c.sharePct) / 100])
          ),
          fixedCategoryBases: Object.fromEntries(
            SUGGESTED_FIXED_CATEGORIES
              .filter(c => fixedCats.includes(c.type))
              .map(c => [c.type, (incomeNum * c.sharePct) / 100])
          ),
          activeVariableCategories: variableCats,
          activeFixedCategories: fixedCats,
          categoryColors: {}, categoryIcons: {},
        }),
      });
      // Mark onboarding complete
      await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });
      await refetchUser();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", borderRadius: "12px", color: "var(--accent-ink)" }}>F</div>
          <span className="text-xl font-bold" style={{ color: "var(--t1)" }}>Flousy</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  background: i < step ? "var(--good)" : i === step ? "var(--accent)" : "var(--surface-2)",
                  color: i <= step ? "var(--accent-ink)" : "var(--t3)",
                }}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-0.5" style={{ background: i < step ? "var(--good)" : "var(--border-2)" }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="p-8 animate-slideUp" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--t1)" }}>{STEPS[step]}</h2>

          {/* Welcome */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "var(--t2)" }}>
                Welcome to Flousy! Let&apos;s set up your first budget in a few quick steps. We&apos;ll help you track expenses, set saving goals, and understand your spending patterns.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { label: "Variable Expenses", desc: "Track day-to-day spending" },
                  { label: "Fixed Bills", desc: "Monthly recurring charges" },
                  { label: "Saving Goals", desc: "Save towards targets" },
                  { label: "Reports", desc: "Insights & analytics" },
                ].map(f => (
                  <div key={f.label} className="p-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--t1)" }}>{f.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--t2)" }}>
                What&apos;s your monthly income? We&apos;ll use it to suggest budgets for each category.
              </p>
              <input type="number" value={income} onChange={e => setIncome(e.target.value)} autoFocus
                className="w-full px-4 py-3 text-lg font-semibold outline-none transition"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
                placeholder="3000" />
              <p className="text-xs" style={{ color: "var(--t3)" }}>Amount in {currency}, before any deductions.</p>
            </div>
          )}

          {/* Variable Categories */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--t2)" }}>Pick the categories you spend on day to day.</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_VARIABLE_CATEGORIES.map(c => {
                  const Icon = CAT_ICON[c.type] ?? CAT_ICON_FALLBACK;
                  const active = variableCats.includes(c.type);
                  const color = CAT_COLOR[c.type] ?? "#8A8175";
                  return (
                    <button key={c.type} onClick={() => toggleVar(c.type)}
                      className="flex items-center gap-2 p-3 text-left transition"
                      style={{
                        background: active ? "var(--accent-tint)" : "var(--surface-2)",
                        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "var(--r-field)",
                      }}>
                      <Icon size={16} style={{ color: active ? color : "var(--t3)" }} weight="duotone" />
                      <div>
                        <p className="text-xs font-medium" style={{ color: active ? "var(--t1)" : "var(--t2)" }}>{c.type}</p>
                        <p className="text-[10px]" style={{ color: "var(--t3)" }}>{c.hint}</p>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "var(--accent-dim)" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fixed Bills */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--t2)" }}>Which recurring bills do you pay each month?</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_FIXED_CATEGORIES.map(c => {
                  const Icon = CAT_ICON[c.type] ?? CAT_ICON_FALLBACK;
                  const active = fixedCats.includes(c.type);
                  const color = CAT_COLOR[c.type] ?? "#8A8175";
                  return (
                    <button key={c.type} onClick={() => toggleFixed(c.type)}
                      className="flex items-center gap-2 p-3 text-left transition"
                      style={{
                        background: active ? "var(--accent-tint)" : "var(--surface-2)",
                        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "var(--r-field)",
                      }}>
                      <Icon size={16} style={{ color: active ? color : "var(--t3)" }} weight="duotone" />
                      <div>
                        <p className="text-xs font-medium" style={{ color: active ? "var(--t1)" : "var(--t2)" }}>{c.type}</p>
                        <p className="text-[10px]" style={{ color: "var(--t3)" }}>{c.hint}</p>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "var(--accent-dim)" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategy */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--t2)" }}>How do you want to manage your money?</p>
              {MANAGEMENT_STRATEGIES.map(s => {
                const active = s.id === strategyId;
                return (
                  <button key={s.id} onClick={() => setStrategyId(s.id)}
                    className="w-full p-4 text-left transition"
                    style={{
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "var(--r-field)",
                    }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{s.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{s.tagline}</p>
                      </div>
                      {active && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-dim)" }} />}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--t2)" }}>{s.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4" style={{ background: "var(--accent-tint)", borderRadius: "var(--r-field)", border: "1px solid var(--accent)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--t3)" }}>Monthly Income</p>
                <p className="text-2xl font-bold" style={{ color: "var(--t1)" }}>{formatCurrency(incomeNum, currency)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "BANK", value: bankPart },
                  { label: "HOME", value: homePart },
                  { label: "WALLET", value: walletPart },
                ].map(mp => (
                  <div key={mp.label} className="p-3 text-center" style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--t3)" }}>{mp.label}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--t1)" }}>{formatCurrency(mp.value, currency)}</p>
                  </div>
                ))}
              </div>
              <div className="text-sm p-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
                <span style={{ color: "var(--t2)" }}>Strategy: </span>
                <span className="font-medium" style={{ color: "var(--t1)" }}>{strategy.name}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--t3)" }}>
                {variableCats.length} expense categor{variableCats.length === 1 ? "y" : "ies"} and {fixedCats.length} fixed bill{fixedCats.length === 1 ? "" : "s"} set up, with suggested budgets you can fine-tune anytime.
              </p>
            </div>
          )}

          {error && <p className="text-xs mt-3 p-2.5 banner banner-error">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition hover:opacity-70"
                style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-field)" }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-semibold transition hover:opacity-90"
                style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
                {submitting ? (
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent-ink)", borderTopColor: "transparent" }} />
                ) : <><Check className="w-4 h-4" /> Let&apos;s Go!</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

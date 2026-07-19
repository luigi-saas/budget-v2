"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import {
  SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES,
  MANAGEMENT_STRATEGIES, VARIABLE_TYPES, FIXED_TYPES,
  currentMonthId, monthLabel, formatCurrency,
} from "@/lib/constants";

const STEPS = ["Income", "Categories", "Fixed Bills", "Strategy", "Review"];

export default function OnboardingPage() {
  const { user, refetchUser } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [variableCats, setVariableCats] = useState<string[]>(SUGGESTED_VARIABLE_CATEGORIES.filter(c => c.recommended).map(c => c.type));
  const [fixedCats, setFixedCats] = useState<string[]>(SUGGESTED_FIXED_CATEGORIES.filter(c => c.recommended).map(c => c.type));
  const [strategyId, setStrategyId] = useState("50-30-20");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  if (!user) return null;

  const currency = user.currency ?? "USD";
  const incomeNum = parseFloat(income) || 0;
  const strategy = MANAGEMENT_STRATEGIES.find(s => s.id === strategyId) ?? MANAGEMENT_STRATEGIES[0];
  const homePart = Math.round(incomeNum * strategy.homeShare);
  const bankPart = Math.round(incomeNum * strategy.bankShare);
  const walletPart = Math.max(0, incomeNum - homePart - bankPart);

  const toggleCat = (list: string[], setList: (v: string[]) => void, type: string) => {
    setList(list.includes(type) ? list.filter(t => t !== type) : [...list, type]);
  };

  const finish = async () => {
    setSaving(true);
    const variableCategoryBases = Object.fromEntries(VARIABLE_TYPES.map(t => {
      const s = SUGGESTED_VARIABLE_CATEGORIES.find(c => c.type === t);
      return [t, variableCats.includes(t) && s ? Math.round(incomeNum * (s.sharePct / 100)) : 0];
    }));
    const fixedCategoryBases = Object.fromEntries(FIXED_TYPES.map(t => {
      const s = SUGGESTED_FIXED_CATEGORIES.find(c => c.type === t);
      return [t, fixedCats.includes(t) && s ? Math.round(incomeNum * (s.sharePct / 100)) : 0];
    }));
    const mId = currentMonthId();
    await fetch("/api/months", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthId: mId, label: monthLabel(mId), totalBudget: incomeNum, homePart, walletPart, bankPart, variableCategoryBases, fixedCategoryBases, activeVariableCategories: [...VARIABLE_TYPES], activeFixedCategories: [...FIXED_TYPES] }) });
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingComplete: true }) });
    await refetchUser(); router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
              style={{
                background: i < step ? "var(--accent)" : i === step ? "var(--accent-tint)" : "var(--surface-3)",
                color: i < step ? "var(--accent-ink)" : i === step ? "var(--accent-dim)" : "var(--t3)",
                border: i === step ? "2px solid var(--accent)" : "none",
              }}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-0.5" style={{ background: i < step ? "var(--accent)" : "var(--border-2)" }} />}
          </div>
        ))}
      </div>

      <div className="p-8 animate-fadeIn" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--t1)" }}>{STEPS[step]}</h2>

        {step === 0 && (
          <div className="mt-4 space-y-4">
            <p className="text-sm" style={{ color: "var(--t3)" }}>What&apos;s your monthly income? We&apos;ll use it to suggest budgets.</p>
            <input type="number" value={income} onChange={e => setIncome(e.target.value)} autoFocus
              className="w-full px-4 py-3 text-lg outline-none" placeholder="e.g. 5000"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }} />
            <p className="text-xs" style={{ color: "var(--t3)" }}>Monthly income before deductions</p>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4">
            <p className="text-sm mb-4" style={{ color: "var(--t3)" }}>Pick the categories you spend on day to day.</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_VARIABLE_CATEGORIES.map(c => {
                const active = variableCats.includes(c.type);
                return (
                  <button key={c.type} onClick={() => toggleCat(variableCats, setVariableCats, c.type)}
                    className="flex items-center gap-3 p-3 text-left text-sm transition-all"
                    style={{ borderRadius: "var(--r-field)", border: `1px solid ${active ? "var(--accent)" : "var(--border-2)"}`, background: active ? "var(--accent-tint)" : "transparent", color: active ? "var(--accent-dim)" : "var(--t2)" }}>
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                      style={{ borderRadius: "6px", background: active ? "var(--accent)" : "var(--surface-3)", color: active ? "var(--accent-ink)" : "transparent" }}>
                      {active && <Check className="w-3 h-3" />}
                    </div>
                    <div><p className="font-medium">{c.type}</p><p className="text-xs" style={{ color: "var(--t3)" }}>{c.hint}</p></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4">
            <p className="text-sm mb-4" style={{ color: "var(--t3)" }}>Which recurring bills do you pay each month?</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_FIXED_CATEGORIES.map(c => {
                const active = fixedCats.includes(c.type);
                return (
                  <button key={c.type} onClick={() => toggleCat(fixedCats, setFixedCats, c.type)}
                    className="flex items-center gap-3 p-3 text-left text-sm transition-all"
                    style={{ borderRadius: "var(--r-field)", border: `1px solid ${active ? "var(--accent)" : "var(--border-2)"}`, background: active ? "var(--accent-tint)" : "transparent", color: active ? "var(--accent-dim)" : "var(--t2)" }}>
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                      style={{ borderRadius: "6px", background: active ? "var(--accent)" : "var(--surface-3)", color: active ? "var(--accent-ink)" : "transparent" }}>
                      {active && <Check className="w-3 h-3" />}
                    </div>
                    <div><p className="font-medium">{c.type}</p><p className="text-xs" style={{ color: "var(--t3)" }}>{c.hint}</p></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4">
            <p className="text-sm mb-4" style={{ color: "var(--t3)" }}>How do you want to manage your money?</p>
            <div className="space-y-2">
              {MANAGEMENT_STRATEGIES.map(s => {
                const active = strategyId === s.id;
                return (
                  <button key={s.id} onClick={() => setStrategyId(s.id)}
                    className="w-full flex items-start gap-3 p-4 text-left transition-all"
                    style={{ borderRadius: "var(--r-field)", border: `1px solid ${active ? "var(--accent)" : "var(--border-2)"}`, background: active ? "var(--accent-tint)" : "transparent" }}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ border: `2px solid ${active ? "var(--accent-dim)" : "var(--border-2)"}`, background: active ? "var(--accent-dim)" : "transparent" }}>
                      {active && <div className="w-2 h-2 rounded-full" style={{ background: "var(--bg)" }} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--t1)" }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--accent-dim)" }}>{s.tagline}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>{s.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 space-y-4">
            <div className="p-4 text-center" style={{ background: "var(--surface-2)", borderRadius: "var(--r-field)" }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--t3)" }}>Monthly Income</p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--t1)" }}>{formatCurrency(incomeNum, currency)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bank", value: bankPart, tint: "var(--accent-tint)" },
                { label: "Home", value: homePart, tint: "var(--warn-tint)" },
                { label: "Wallet", value: walletPart, tint: "var(--good-tint)" },
              ].map(p => (
                <div key={p.label} className="p-3 text-center" style={{ background: p.tint, borderRadius: "var(--r-field)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--t2)" }}>{p.label}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--t1)" }}>{formatCurrency(p.value, currency)}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-center" style={{ color: "var(--t3)" }}>
              Strategy: <strong>{strategy.name}</strong> · {variableCats.length} expense categories · {fixedCats.length} fixed bills
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition hover:opacity-80"
              style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-field)" }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 0 && !income}
              className="flex items-center gap-2 px-6 py-2.5 font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)", boxShadow: "var(--shadow-btn)" }}>
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--good)", color: "var(--inv)", borderRadius: "var(--r-field)" }}>
              {saving ? <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                : <><Sparkles className="w-4 h-4" /> Start Tracking</>}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-sm mt-4" style={{ color: "var(--t3)" }}>
        <button onClick={() => router.push("/dashboard")} className="underline hover:opacity-70">Skip onboarding</button>
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { ArrowRight, ArrowLeft, Check, Sparkle, Wallet, Bank, House, CreditCard } from "@phosphor-icons/react";
import {
  SUGGESTED_VARIABLE_CATEGORIES,
  SUGGESTED_FIXED_CATEGORIES,
  MANAGEMENT_STRATEGIES,
  currentMonthId,
  formatCurrency,
  CAT_COLOR,
} from "@/lib/constants";
import { CAT_ICON, CAT_ICON_FALLBACK } from "@/lib/category-icons";

const STEPS = ["Income", "Expense categories", "Fixed bills", "Strategy", "Review"] as const;

function buildMonthFromOnboarding(
  monthId: string,
  opts: {
    income: number;
    variableCategories: string[];
    fixedCategories: string[];
    strategyId: string;
  }
) {
  const strategy = MANAGEMENT_STRATEGIES.find((s) => s.id === opts.strategyId) ?? MANAGEMENT_STRATEGIES[0];
  const homePart = Math.round(opts.income * strategy.homeShare);
  const bankPart = Math.round(opts.income * strategy.bankShare);
  const walletPart = Math.max(0, opts.income - homePart - bankPart);

  const variableCategoryBases: Record<string, number> = {};
  const fixedCategoryBases: Record<string, number> = {};

  // Distribute wallet part among variable categories
  const varSuggestions = SUGGESTED_VARIABLE_CATEGORIES.filter((c) =>
    opts.variableCategories.includes(c.type)
  );
  const totalVarPct = varSuggestions.reduce((sum, c) => sum + c.sharePct, 0);
  varSuggestions.forEach((c) => {
    variableCategoryBases[c.type] = Math.round((c.sharePct / totalVarPct) * walletPart);
  });

  // Distribute bank/home part among fixed categories
  const fixedTotal = homePart + bankPart * 0.5;
  const fixSuggestions = SUGGESTED_FIXED_CATEGORIES.filter((c) =>
    opts.fixedCategories.includes(c.type)
  );
  const totalFixPct = fixSuggestions.reduce((sum, c) => sum + c.sharePct, 0);
  fixSuggestions.forEach((c) => {
    fixedCategoryBases[c.type] = Math.round((c.sharePct / totalFixPct) * fixedTotal);
  });

  return {
    monthId,
    label: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
    totalBudget: opts.income,
    homePart,
    walletPart,
    bankPart,
    variableCategoryBases,
    fixedCategoryBases,
    activeVariableCategories: opts.variableCategories,
    activeFixedCategories: opts.fixedCategories,
    categoryColors: {} as Record<string, string>,
    categoryIcons: {} as Record<string, string>,
  };
}

export default function OnboardingPage() {
  const { user, loading: authLoading, refetchUser } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [variableCats, setVariableCats] = useState<string[]>(
    SUGGESTED_VARIABLE_CATEGORIES.filter((c) => c.recommended).map((c) => c.type)
  );
  const [fixedCats, setFixedCats] = useState<string[]>(
    SUGGESTED_FIXED_CATEGORIES.filter((c) => c.recommended).map((c) => c.type)
  );
  const [strategyId, setStrategyId] = useState(
    MANAGEMENT_STRATEGIES.find((s) => s.recommended)?.id ?? MANAGEMENT_STRATEGIES[0].id
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const incomeNum = parseFloat(income) || 0;
  const currency = user?.currency ?? "USD";

  function toggle<T>(list: T[], setList: (v: T[]) => void, val: T) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const monthId = currentMonthId();
      const month = buildMonthFromOnboarding(monthId, {
        income: incomeNum,
        variableCategories: variableCats,
        fixedCategories: fixedCats,
        strategyId,
      });

      // Create the initial month budget
      const res = await fetch("/api/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(month),
      });
      if (!res.ok) throw new Error("Failed to save month");

      // Mark onboarding complete
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });

      await refetchUser();
      router.replace("/dashboard");
    } catch (e) {
      console.error(e);
      setError("Couldn't save your setup. Check your connection and try again.");
      setSaving(false);
    }
  }

  const canNext =
    step === 0
      ? incomeNum > 0
      : step === 1
      ? variableCats.length > 0
      : step === 2
      ? true
      : step === 3
      ? !!strategyId
      : true;

  const strategy = MANAGEMENT_STRATEGIES.find((s) => s.id === strategyId) ?? MANAGEMENT_STRATEGIES[0];
  const homePart = Math.round(incomeNum * strategy.homeShare);
  const bankPart = Math.round(incomeNum * strategy.bankShare);
  const walletPart = Math.max(0, incomeNum - homePart - bankPart);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div
          className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md relative slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-btn)" }}
          >
            <Wallet size={28} weight="bold" color="var(--accent-ink)" />
          </div>
          <h1 className="f-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}>
            Set up your budget
          </h1>
          <p style={{ color: "var(--t2)", fontSize: 13, marginTop: 6 }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 4,
                  borderRadius: 2,
                  background: i <= step ? "var(--accent)" : "var(--border-2)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="glass p-6 space-y-4">
          {step === 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 13, color: "var(--t2)" }}>
                What's your monthly income? We'll use it to suggest budgets for each category.
              </p>
              <input
                className="field"
                style={{ fontSize: 18, fontWeight: 700 }}
                placeholder="e.g. 5000"
                inputMode="decimal"
                type="number"
                min={0}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                autoFocus
              />
              <p style={{ fontSize: 11, color: "var(--t3)" }}>
                Amount in {currency}, before any deductions.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 4 }}>
                Pick the categories you spend on day to day. We've preselected the ones most people need.
              </p>
              {SUGGESTED_VARIABLE_CATEGORIES.map((c) => {
                const Icon = CAT_ICON[c.type] ?? CAT_ICON_FALLBACK;
                const active = variableCats.includes(c.type);
                const color = CAT_COLOR[c.type] ?? "#8A8175";
                return (
                  <button
                    key={c.type}
                    onClick={() => toggle(variableCats, setVariableCats, c.type)}
                    className="tap w-full"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 14px",
                      borderRadius: "var(--r-field)",
                      border: `1.5px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: active ? color : "var(--surface-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} weight="bold" color={active ? "#fff" : "var(--t2)"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>
                        {c.type}
                        {c.recommended && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-dim)", marginLeft: 6 }}>
                            · suggested
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--t3)" }}>{c.hint}</p>
                    </div>
                    {active && <Check size={16} weight="bold" color="var(--accent)" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 4 }}>
                Which recurring bills do you pay each month?
              </p>
              {SUGGESTED_FIXED_CATEGORIES.map((c) => {
                const Icon = CAT_ICON[c.type] ?? CAT_ICON_FALLBACK;
                const active = fixedCats.includes(c.type);
                const color = CAT_COLOR[c.type] ?? "#8A8175";
                return (
                  <button
                    key={c.type}
                    onClick={() => toggle(fixedCats, setFixedCats, c.type)}
                    className="tap w-full"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 14px",
                      borderRadius: "var(--r-field)",
                      border: `1.5px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: active ? color : "var(--surface-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} weight="bold" color={active ? "#fff" : "var(--t2)"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>
                        {c.type}
                        {c.recommended && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-dim)", marginLeft: 6 }}>
                            · suggested
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--t3)" }}>{c.hint}</p>
                    </div>
                    {active && <Check size={16} weight="bold" color="var(--accent)" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 4 }}>
                How do you want to manage your money? Pick a strategy, you can change this anytime.
              </p>
              {MANAGEMENT_STRATEGIES.map((s) => {
                const active = s.id === strategyId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStrategyId(s.id)}
                    className="tap w-full"
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--r-field)",
                      border: `1.5px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
                      background: active ? "var(--accent-tint)" : "var(--surface-2)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", flex: 1 }}>
                        {s.name}
                      </p>
                      {active && <Check size={16} weight="bold" color="var(--accent)" />}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--accent-dim)", fontWeight: 700, marginTop: 2 }}>
                      {s.tagline}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 2, lineHeight: 1.4 }}>
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {/* Income summary */}
              <div className="glass-2" style={{ padding: 14 }}>
                <p style={{ fontSize: 11, color: "var(--t3)", fontWeight: 700 }}>MONTHLY INCOME</p>
                <p className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)" }}>
                  {formatCurrency(incomeNum, currency)}
                </p>
              </div>

              {/* Money distribution */}
              <div className="glass-2" style={{ padding: 14, display: "flex", gap: 12 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <Bank size={20} weight="bold" color="var(--t2)" style={{ marginBottom: 4 }} />
                  <p style={{ fontSize: 11, color: "var(--t3)", fontWeight: 700 }}>BANK</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>
                    {formatCurrency(bankPart, currency)}
                  </p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <House size={20} weight="bold" color="var(--t2)" style={{ marginBottom: 4 }} />
                  <p style={{ fontSize: 11, color: "var(--t3)", fontWeight: 700 }}>HOME</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>
                    {formatCurrency(homePart, currency)}
                  </p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <CreditCard size={20} weight="bold" color="var(--t2)" style={{ marginBottom: 4 }} />
                  <p style={{ fontSize: 11, color: "var(--t3)", fontWeight: 700 }}>WALLET</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>
                    {formatCurrency(walletPart, currency)}
                  </p>
                </div>
              </div>

              {/* Strategy */}
              <div className="glass-2" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkle size={18} weight="bold" color="var(--accent)" />
                <p style={{ fontSize: 13, color: "var(--t2)" }}>
                  Strategy: <strong style={{ color: "var(--t1)" }}>{strategy.name}</strong>
                </p>
              </div>

              {/* Categories summary */}
              <p style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", marginTop: 8 }}>
                {variableCats.length} expense categor{variableCats.length === 1 ? "y" : "ies"} and{" "}
                {fixedCats.length} fixed bill{fixedCats.length === 1 ? "" : "s"} set up, with suggested
                budgets you can fine-tune anytime.
              </p>
            </div>
          )}

          {error && <p className="banner banner-error">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost tap"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 16px",
                  borderRadius: "var(--r-field)",
                  border: "1.5px solid var(--border-2)",
                  background: "var(--surface-2)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--t1)",
                }}
              >
                <ArrowLeft size={16} weight="bold" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                className="btn-primary tap"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 16px",
                  borderRadius: "var(--r-field)",
                  background: canNext ? "var(--accent)" : "var(--surface-3)",
                  color: canNext ? "var(--accent-ink)" : "var(--t3)",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: canNext ? "pointer" : "not-allowed",
                }}
              >
                Continue <ArrowRight size={16} weight="bold" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="btn-primary tap"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 16px",
                  borderRadius: "var(--r-field)",
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                }}
              >
                {saving ? (
                  <span
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(0,0,0,0.25)", borderTopColor: "var(--accent-ink)" }}
                  />
                ) : (
                  <>
                    <Check size={16} weight="bold" /> Finish Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

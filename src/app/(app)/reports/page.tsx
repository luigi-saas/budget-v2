"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { BarChart3, PieChart, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, CAT_COLOR } from "@/lib/constants";

interface MonthlySummary {
  monthId: string; label: string; budget: number;
  totalVariable: number; totalFixed: number; totalSpent: number; remaining: number;
  categoryBreakdown: Record<string, number>;
}

interface ReportData {
  monthlySummaries: MonthlySummary[];
  overallCategories: Record<string, number>;
}

export default function ReportsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch("/api/reports").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;
  const currency = user.currency ?? "USD";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const summaries = data?.monthlySummaries ?? [];
  const overallCats = data?.overallCategories ?? {};
  const totalOverall = Object.values(overallCats).reduce((s, v) => s + v, 0);
  const sortedCats = Object.entries(overallCats).sort((a, b) => b[1] - a[1]);
  const maxMonthSpent = Math.max(...summaries.map(s => s.totalSpent), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Reports &amp; Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Insights into your spending patterns</p>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-16" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--t3)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>No data yet</h2>
          <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Start tracking expenses to see your reports</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <BarChart3 className="w-5 h-5" />, label: "Months Tracked", value: String(summaries.length) },
              { icon: <TrendingDown className="w-5 h-5" />, label: "Total Spent", value: formatCurrency(totalOverall, currency) },
              { icon: <TrendingUp className="w-5 h-5" />, label: "Avg Monthly", value: formatCurrency(totalOverall / (summaries.length || 1), currency) },
              { icon: <PieChart className="w-5 h-5" />, label: "Categories", value: String(sortedCats.length) },
            ].map(c => (
              <div key={c.label} className="p-4" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: "var(--accent-dim)" }}>{c.icon}</span>
                  <span className="text-xs" style={{ color: "var(--t3)" }}>{c.label}</span>
                </div>
                <p className="text-lg font-bold" style={{ color: "var(--t1)" }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly bar chart */}
          <div className="p-6" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-6" style={{ color: "var(--t1)" }}>Monthly Spending Trend</h3>
            <div className="flex items-end gap-2 h-48">
              {summaries.map(s => {
                const pct = (s.totalSpent / maxMonthSpent) * 100;
                const overBudget = s.totalSpent > s.budget && s.budget > 0;
                return (
                  <div key={s.monthId} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                      style={{ background: "var(--t1)", color: "var(--inv)", borderRadius: "var(--r-field)" }}>
                      {formatCurrency(s.totalSpent, currency)}<br />
                      Budget: {formatCurrency(s.budget, currency)}
                    </div>
                    <div className="w-full transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, 4)}%`, minHeight: "4px",
                        borderRadius: "6px 6px 0 0",
                        background: overBudget ? "var(--bad)" : "var(--accent)",
                      }} />
                    <span className="text-[10px] mt-1" style={{ color: "var(--t3)" }}>{s.monthId.slice(5)}/{s.monthId.slice(2, 4)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "var(--t3)" }}>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "var(--accent)" }} /> Under budget</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "var(--bad)" }} /> Over budget</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="p-6" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-6" style={{ color: "var(--t1)" }}>Spending by Category (All Time)</h3>
            <div className="space-y-3">
              {sortedCats.map(([cat, amount]) => {
                const pct = totalOverall > 0 ? (amount / totalOverall) * 100 : 0;
                const color = CAT_COLOR[cat] ?? "#A9A9A9";
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium" style={{ color: "var(--t2)" }}>{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: "var(--t3)" }}>{pct.toFixed(1)}%</span>
                        <span className="font-medium w-24 text-right" style={{ color: "var(--t1)" }}>{formatCurrency(amount, currency)}</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden" style={{ background: "var(--surface-2)", borderRadius: "var(--r-pill)" }}>
                      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color, borderRadius: "var(--r-pill)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold p-6 pb-0" style={{ color: "var(--t1)" }}>Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Month", "Budget", "Variable", "Fixed", "Total", "Remaining"].map(h => (
                      <th key={h} className={`px-6 py-3 font-medium ${h === "Month" ? "text-left" : "text-right"}`} style={{ color: "var(--t3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(s => (
                    <tr key={s.monthId} className="transition hover:opacity-80" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-6 py-3 font-medium" style={{ color: "var(--t1)" }}>{s.label}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--t2)" }}>{formatCurrency(s.budget, currency)}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--t2)" }}>{formatCurrency(s.totalVariable, currency)}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--t2)" }}>{formatCurrency(s.totalFixed, currency)}</td>
                      <td className="px-6 py-3 text-right font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(s.totalSpent, currency)}</td>
                      <td className="px-6 py-3 text-right font-medium" style={{ color: s.remaining >= 0 ? "var(--good)" : "var(--bad)" }}>
                        {formatCurrency(s.remaining, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

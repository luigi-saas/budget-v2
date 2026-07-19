"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { BarChart3, Calendar, DollarSign, Tag, TrendingUp } from "lucide-react";
import { formatCurrency, CAT_COLOR } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

interface MonthlySummary {
  monthId: string; label: string; budget: number;
  totalVariable: number; totalFixed: number; totalSpent: number; remaining: number;
  categoryBreakdown: Record<string, number>;
}

interface ReportsData {
  monthlySummaries: MonthlySummary[];
  overallCategories: Record<string, number>;
}

export default function ReportsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [data, setData] = useState<ReportsData | null>(null);
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

  const barChartData = summaries.map(s => ({
    name: s.monthId.slice(5) + "/" + s.monthId.slice(2, 4),
    Spent: s.totalSpent,
    Budget: s.budget,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Reports & Analytics</h1>
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
              { icon: <Calendar className="w-4 h-4" />, label: "Months Tracked", value: String(summaries.length) },
              { icon: <DollarSign className="w-4 h-4" />, label: "Total Spent", value: formatCurrency(totalOverall, currency) },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Avg Monthly", value: formatCurrency(totalOverall / (summaries.length || 1), currency) },
              { icon: <Tag className="w-4 h-4" />, label: "Categories", value: String(sortedCats.length) },
            ].map(c => (
              <div key={c.label} className="p-4" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: "var(--t3)" }}>
                  {c.icon}<span className="text-xs">{c.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly bar chart with Recharts */}
          {barChartData.length > 0 && (
            <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--t1)" }}>Monthly Spending Trend</h3>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--t3)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => formatCurrency(v, currency)} tick={{ fontSize: 10, fill: "var(--t3)" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v ?? 0), currency)}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--t2)" }} />
                    <Bar dataKey="Spent" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Budget" fill="var(--accent-tint)" radius={[4, 4, 0, 0]} stroke="var(--accent)" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div className="p-5" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--t1)" }}>Spending by Category (All Time)</h3>
            <div className="space-y-3">
              {sortedCats.map(([cat, amount]) => {
                const pct = totalOverall > 0 ? (amount / totalOverall) * 100 : 0;
                const color = CAT_COLOR[cat] ?? "#A9A9A9";
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm" style={{ color: "var(--t2)" }}>{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--t3)" }}>{pct.toFixed(1)}%</span>
                        <span className="text-sm font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(amount, currency)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly breakdown table */}
          <div className="overflow-hidden" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    {["Month", "Budget", "Variable", "Fixed", "Total", "Remaining"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--t3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(s => (
                    <tr key={s.monthId} className="transition hover:opacity-80" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--t1)" }}>{s.label}</td>
                      <td className="px-4 py-3" style={{ color: "var(--t2)" }}>{formatCurrency(s.budget, currency)}</td>
                      <td className="px-4 py-3" style={{ color: "var(--t2)" }}>{formatCurrency(s.totalVariable, currency)}</td>
                      <td className="px-4 py-3" style={{ color: "var(--t2)" }}>{formatCurrency(s.totalFixed, currency)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--t1)" }}>{formatCurrency(s.totalSpent, currency)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: s.remaining >= 0 ? "var(--good)" : "var(--bad)" }}>
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

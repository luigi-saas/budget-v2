"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { FileText, Search, Filter, ArrowUpDown } from "lucide-react";
import { formatCurrency, CAT_COLOR } from "@/lib/constants";

interface Transaction {
  id: string; name: string; amount: number; type: string;
  date: string; kind: "variable" | "fixed"; monthId: string;
}

export default function HistoryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterKind, setFilterKind] = useState<"all" | "variable" | "fixed">("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch("/api/export?format=json").then(r => r.json()).then(data => {
      const txns: Transaction[] = [];
      const months = data.months ?? [];
      for (const e of data.variableExpenses ?? []) {
        const m = months.find((m: { id: number }) => m.id === e.monthBudgetId);
        txns.push({ id: e.id, name: e.name, amount: e.amount, type: e.type, date: e.date, kind: "variable", monthId: m?.monthId ?? "" });
      }
      for (const e of data.fixedExpenses ?? []) {
        const m = months.find((m: { id: number }) => m.id === e.monthBudgetId);
        txns.push({ id: e.id, name: e.name, amount: e.amount, type: e.type, date: e.date ?? "", kind: "fixed", monthId: m?.monthId ?? "" });
      }
      setTransactions(txns); setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;
  const currency = user.currency ?? "USD";
  const categories = Array.from(new Set(transactions.map(t => t.type))).sort();

  const filtered = transactions
    .filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.type.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== "all" && t.type !== filterCat) return false;
      if (filterKind !== "all" && t.kind !== filterKind) return false;
      return true;
    })
    .sort((a, b) => sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Transaction History</h1>
        <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Search and filter all your transactions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters */}
          <div className="p-4" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--t3)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
                  placeholder="Search transactions..." />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--t3)" }} />
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className="pl-9 pr-8 py-2.5 text-sm outline-none appearance-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <select value={filterKind} onChange={e => setFilterKind(e.target.value as "all" | "variable" | "fixed")}
                  className="px-4 py-2.5 text-sm outline-none appearance-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}>
                  <option value="all">All Types</option>
                  <option value="variable">Variable</option>
                  <option value="fixed">Fixed</option>
                </select>
                <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                  className="p-2.5 transition hover:opacity-70"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)" }}>
                  <ArrowUpDown className="w-4 h-4" style={{ color: "var(--t3)" }} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm" style={{ color: "var(--t3)" }}>
              <span>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</span>
              <span className="font-medium" style={{ color: "var(--t2)" }}>Total: {formatCurrency(totalFiltered, currency)}</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--t3)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>No transactions found</h2>
              <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-hidden" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              {filtered.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 transition hover:opacity-80"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLOR[t.type] ?? "#A9A9A9" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>{t.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "var(--t3)" }}>{t.type}</span>
                        <span className="text-xs" style={{ color: "var(--t3)" }}>·</span>
                        <span className="text-xs px-1.5 py-0.5"
                          style={{ background: t.kind === "fixed" ? "var(--accent-tint)" : "var(--warn-tint)", color: t.kind === "fixed" ? "var(--accent-dim)" : "var(--warn)", borderRadius: "6px" }}>
                          {t.kind}
                        </span>
                        {t.monthId && <span className="text-xs" style={{ color: "var(--t3)" }}>{t.monthId}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{formatCurrency(t.amount, currency)}</p>
                    <p className="text-xs" style={{ color: "var(--t3)" }}>{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

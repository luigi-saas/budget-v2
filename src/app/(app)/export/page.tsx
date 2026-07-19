"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";

export default function ExportPage() {
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  if (!user) return null;

  const handleExport = (format: "csv" | "json") => {
    const url = `/api/export?format=${format}`;
    if (format === "csv") { window.open(url, "_blank"); }
    else {
      fetch(url).then(r => r.json()).then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `flousy-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Export Your Data</h1>
        <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Download all your financial data in your preferred format</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 animate-fadeIn">
        {[
          { format: "csv" as const, icon: FileSpreadsheet, title: "CSV Export", desc: "Download as a spreadsheet-compatible CSV file. Open in Excel, Google Sheets, or any spreadsheet app.", label: "Download CSV", tint: "var(--good-tint)" },
          { format: "json" as const, icon: FileJson, title: "JSON Export", desc: "Download as structured JSON. Perfect for data migration, backups, or importing into other tools.", label: "Download JSON", tint: "var(--accent-tint)" },
        ].map(item => (
          <button key={item.format} onClick={() => handleExport(item.format)}
            className="p-8 text-left group transition-all hover:shadow-lg"
            style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
              style={{ background: item.tint, borderRadius: "var(--r-field)" }}>
              <item.icon className="w-6 h-6" style={{ color: "var(--t1)" }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>{item.title}</h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--t3)" }}>{item.desc}</p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: "var(--accent-dim)" }}>
              <Download className="w-4 h-4" /> {item.label}
            </div>
          </button>
        ))}
      </div>

      <div className="p-6" style={{ background: "var(--accent-tint)", borderRadius: "var(--r-card)", border: "1px solid var(--accent)" }}>
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-dim)" }} />
          <div>
            <h4 className="font-semibold text-sm" style={{ color: "var(--t1)" }}>What&apos;s included?</h4>
            <ul className="mt-2 text-sm space-y-1.5 leading-relaxed" style={{ color: "var(--t2)" }}>
              <li>• All monthly budgets and their settings</li>
              <li>• Variable expenses with categories, dates, and amounts</li>
              <li>• Fixed expenses with budgeted vs actual amounts</li>
              <li>• Saving goals with current progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

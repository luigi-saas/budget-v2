"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, Mail, MessageCircle, BookOpen, Wallet, Shield } from "lucide-react";

const FAQ_SECTIONS = [
  {
    title: "Getting Started", icon: BookOpen,
    items: [
      { q: "How do I set up my first budget?", a: "Go to the Dashboard, choose the current month, and click \"Set Up Budget\". Enter your total monthly income and decide how to split it between Bank, Home, and Wallet. You can adjust these anytime." },
      { q: "What are Money Places (Bank, Home, Wallet)?", a: "Money Places represent where your money physically lives. Bank is for savings and online payments. Home is cash kept at home. Wallet is cash you carry daily. This helps you track not just how much you have, but where it is." },
      { q: "What's the difference between variable and fixed expenses?", a: "Variable expenses change each month — groceries, eating out, shopping. Fixed expenses are recurring monthly charges — rent, utilities, subscriptions. Tracking them separately gives you better control." },
    ],
  },
  {
    title: "Budget Strategies", icon: Wallet,
    items: [
      { q: "What is the 50/30/20 Rule?", a: "The most popular budgeting strategy: 50% of income goes to needs (rent, food, utilities), 30% to wants (entertainment, shopping), and 20% to savings. It's balanced and works for most people." },
      { q: "What is Zero-Based Budgeting?", a: "Every dollar gets assigned a job. Income minus all budgeted categories equals zero. It gives you maximum control but requires more planning." },
      { q: "Can I change my strategy later?", a: "Absolutely! Your strategy only affects the initial split when setting up a month. You can manually adjust the Bank/Home/Wallet split anytime from the Dashboard." },
    ],
  },
  {
    title: "Savings & Goals", icon: Shield,
    items: [
      { q: "How do saving goals work?", a: "Saving goals are separate from monthly budgets. Create a goal with a name, target amount, and source (Bank/Home/Wallet). Add funds to it whenever you want. Goals persist across months." },
      { q: "Can I pause a saving goal?", a: "Yes! Click the pause icon on any goal to temporarily deactivate it. Your saved amount is preserved. Click play to resume whenever you're ready." },
      { q: "What happens when I reach my goal?", a: "The goal will show a completion badge. You can keep adding funds beyond the target, delete it, or create new goals." },
    ],
  },
  {
    title: "Data & Privacy", icon: Shield,
    items: [
      { q: "How can I export my data?", a: "Go to Export Data in the sidebar. You can download all your data as a CSV spreadsheet or a JSON file." },
      { q: "Can I delete my account?", a: "Yes. Go to Settings → Danger Zone → Delete Account. This permanently removes your account and all associated data. This action cannot be undone." },
      { q: "Is my data secure?", a: "Yes. Passwords are hashed with bcrypt. Sessions use secure HTTP-only cookies. Each user can only access their own data." },
    ],
  },
];

export default function HelpPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Help &amp; FAQ</h1>
        <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>Find answers to common questions</p>
      </div>

      <div className="space-y-6 animate-fadeIn">
        {FAQ_SECTIONS.map(section => (
          <div key={section.title} className="overflow-hidden"
            style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3 p-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <section.icon className="w-5 h-5" style={{ color: "var(--accent-dim)" }} />
              <h2 className="font-semibold" style={{ color: "var(--t1)" }}>{section.title}</h2>
            </div>
            <div>
              {section.items.map(item => {
                const key = `${section.title}-${item.q}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                    <button onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-5 text-left transition hover:opacity-80">
                      <span className="text-sm font-medium pr-4" style={{ color: "var(--t1)" }}>{item.q}</span>
                      <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        style={{ color: "var(--t3)" }} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 -mt-1">
                        <p className="text-sm leading-relaxed" style={{ color: "var(--t2)" }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="p-8 text-center" style={{ background: "var(--accent-tint)", borderRadius: "var(--r-card)", border: "1px solid var(--accent)" }}>
          <HelpCircle className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--accent-dim)" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>Still need help?</h3>
          <p className="text-sm mt-2 mb-6" style={{ color: "var(--t2)" }}>Can&apos;t find what you&apos;re looking for? Reach out to us.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:support@flousy.app" className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition hover:opacity-80"
              style={{ background: "var(--bg)", color: "var(--accent-dim)", border: "1px solid var(--accent)", borderRadius: "var(--r-field)" }}>
              <Mail className="w-4 h-4" /> Email Support
            </a>
            <a href="#" className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-field)" }}>
              <MessageCircle className="w-4 h-4" /> Community Forum
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

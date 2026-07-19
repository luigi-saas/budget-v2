import Link from "next/link";
import { TrendingUp, PiggyBank, Shield, ArrowRight, BarChart3, Globe, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium mb-6"
            style={{ background: "var(--accent-tint)", color: "var(--accent-dim)", borderRadius: "var(--r-pill)", border: "1px solid var(--accent)" }}>
            <PiggyBank className="w-4 h-4" /> Personal Budget Tracker
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]" style={{ color: "var(--t1)" }}>
            Take control of your{" "}
            <span style={{ color: "var(--accent-dim)" }}>finances</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--t2)" }}>
            Track variable expenses, fixed monthly charges, and saving goals with per-category budgets and month-over-month history. Simple, beautiful, and free.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="flex items-center gap-2 px-8 py-3.5 font-semibold text-base transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-btn)" }}>
              Start For Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="flex items-center gap-2 px-8 py-3.5 font-semibold text-base transition-all hover:opacity-80"
              style={{ border: "1px solid var(--border-2)", color: "var(--t2)", borderRadius: "var(--r-card)" }}>
              See Features
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { label: "Budget Categories", value: "17+" },
            { label: "Money Places", value: "3" },
            { label: "Saving Strategies", value: "4" },
            { label: "Price", value: "Free" },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4"
              style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--accent-dim)" }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24" style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--t1)" }}>
              Everything you need to budget
            </h2>
            <p className="mt-3 text-lg" style={{ color: "var(--t3)" }}>
              A complete toolkit for managing your personal finances
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Monthly Budgets", desc: "Set a total budget each month and split it across bank, home, and wallet.", tint: "var(--accent-tint)" },
              { icon: TrendingUp, title: "Expense Tracking", desc: "Log variable and fixed expenses with categories, dates, and amounts.", tint: "var(--good-tint)" },
              { icon: PiggyBank, title: "Saving Goals", desc: "Create saving goals with targets and track progress from any money place.", tint: "var(--warn-tint)" },
              { icon: Globe, title: "Multi-Currency", desc: "Support for USD, EUR, GBP, MAD, and more. Choose your local currency.", tint: "var(--accent-tint)" },
              { icon: Smartphone, title: "Mobile-First", desc: "Fully responsive design works beautifully on phones, tablets, and desktops.", tint: "var(--good-tint)" },
              { icon: Shield, title: "Private & Secure", desc: "Your data stays yours. Secured with bcrypt hashing and HTTP-only cookies.", tint: "var(--accent-tint)" },
            ].map(f => (
              <div key={f.title} className="p-6 transition-all group hover:shadow-lg"
                style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)" }}>
                <div className="w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: f.tint, borderRadius: "var(--r-field)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "var(--t1)" }} />
                </div>
                <h3 className="font-semibold text-lg" style={{ color: "var(--t1)" }}>{f.title}</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--t3)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 sm:p-16"
            style={{ background: "var(--accent)", borderRadius: "calc(var(--r-card) + 4px)", boxShadow: "var(--shadow-btn)" }}>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--accent-ink)" }}>
              Ready to take control?
            </h2>
            <p className="mt-4 text-lg opacity-70" style={{ color: "var(--accent-ink)" }}>
              Join thousands who already track their finances with Flousy.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 font-semibold text-base transition-all hover:opacity-90"
              style={{ background: "var(--bg)", color: "var(--accent-dim)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-card)" }}>
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

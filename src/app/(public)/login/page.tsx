"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PiggyBank, Eye, EyeOff, ArrowRight, Mail, Lock, User } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "register") setTab("register");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "register") {
        if (!email || !password) {
          setError("Email and password are required.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed.");
          setLoading(false);
          return;
        }
        router.push("/onboarding");
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed.");
          setLoading(false);
          return;
        }
        if (!data.user.onboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold" style={{ color: "var(--t1)" }}>Flousy</span>
          </Link>
          <p className="mt-3 text-sm" style={{ color: "var(--t3)" }}>
            {tab === "login" ? "Welcome back! Sign in to your account." : "Create your free account and start budgeting."}
          </p>
        </div>

        {/* Card */}
        <div className="p-8" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
          {/* Tabs */}
          <div className="flex mb-6 p-1 rounded-xl gap-1"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                style={{
                  background: tab === t ? "var(--surface)" : "transparent",
                  color: tab === t ? "var(--t1)" : "var(--t3)",
                  boxShadow: tab === t ? "var(--shadow-card)" : "none",
                }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name (register only) */}
            {tab === "register" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--t3)" }} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 text-sm outline-none transition"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--t3)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 text-sm outline-none transition"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--t3)" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--t3)" }} />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === "register" ? "Min. 6 characters" : "Your password"}
                  required
                  autoComplete={tab === "register" ? "new-password" : "current-password"}
                  className="w-full pl-10 pr-12 py-3 text-sm outline-none transition"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-field)", color: "var(--t1)" }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition hover:opacity-70">
                  {showPass
                    ? <EyeOff className="w-4 h-4" style={{ color: "var(--t3)" }} />
                    : <Eye className="w-4 h-4" style={{ color: "var(--t3)" }} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--bad-tint)", color: "var(--bad)", border: "1px solid var(--bad)" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm rounded-xl transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "var(--shadow-btn)" }}>
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  {tab === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch tab link */}
          <p className="text-center text-sm mt-5" style={{ color: "var(--t3)" }}>
            {tab === "login" ? (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => { setTab("register"); setError(""); }} className="font-semibold hover:opacity-80" style={{ color: "var(--accent-dim)" }}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => { setTab("login"); setError(""); }} className="font-semibold hover:opacity-80" style={{ color: "var(--accent-dim)" }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center text-sm mt-6" style={{ color: "var(--t3)" }}>
          <Link href="/" className="hover:opacity-80" style={{ color: "var(--accent-dim)" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || "User" } },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          // Email confirmation disabled — auto-signed in
          router.push("/dashboard");
          router.refresh();
        } else {
          // Email confirmation required
          setInfo("Check your email for a confirmation link, then sign in.");
          setMode("login");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--t1)" }}
          >
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--t3)" }}>
            {mode === "login"
              ? "Sign in to manage your budget"
              : "Start tracking your finances today"}
          </p>
        </div>

        {/* Form card */}
        <div
          className="p-8"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-card)",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--border)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <FieldGroup label="Full Name" icon={<User className="w-4 h-4" />}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm outline-none"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-2)",
                    borderRadius: "var(--r-field)",
                    color: "var(--t1)",
                  }}
                  placeholder="John Doe"
                />
              </FieldGroup>
            )}

            <FieldGroup label="Email" icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--r-field)",
                  color: "var(--t1)",
                }}
                placeholder="you@example.com"
              />
            </FieldGroup>

            <FieldGroup label="Password" icon={<Lock className="w-4 h-4" />}>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm outline-none"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-2)",
                    borderRadius: "var(--r-field)",
                    color: "var(--t1)",
                  }}
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--t3)" }}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </FieldGroup>

            {error && (
              <div
                className="text-sm px-4 py-2.5"
                style={{
                  background: "var(--bad-tint)",
                  color: "var(--bad)",
                  borderRadius: "var(--r-field)",
                }}
              >
                {error}
              </div>
            )}

            {info && (
              <div
                className="text-sm px-4 py-2.5"
                style={{
                  background: "var(--good-tint)",
                  color: "var(--good)",
                  borderRadius: "var(--r-field)",
                }}
              >
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "var(--accent-ink)",
                borderRadius: "var(--r-field)",
                boxShadow: "var(--shadow-btn)",
              }}
            >
              {loading ? (
                <div
                  className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "var(--accent-ink)",
                    borderTopColor: "transparent",
                  }}
                />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--t3)" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setInfo("");
                  }}
                  className="font-semibold hover:underline"
                  style={{ color: "var(--accent-dim)" }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setInfo("");
                  }}
                  className="font-semibold hover:underline"
                  style={{ color: "var(--accent-dim)" }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--t2)" }}>
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--t3)" }}
        >
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

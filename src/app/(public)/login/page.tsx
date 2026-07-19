"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnvelopeSimple, LockSimple, User, ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (err) throw err;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      setError(msg);
      setLoading(false);
    }
  }

  async function handleEmail() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      if (!email || !password || (mode === "signup" && !name)) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, full_name: name },
          },
        });
        if (err) throw err;
        setNotice("Check your email for a confirmation link!");
        setLoading(false);
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      router.replace("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      setError(msg.replace("AuthApiError: ", ""));
      setLoading(false);
    }
  }

  async function handleReset() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      if (!email) {
        setError("Enter your email first.");
        setLoading(false);
        return;
      }

      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (err) throw err;
      setNotice("Password reset email sent — check your inbox.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Password reset failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Check if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isConfigured = supabaseUrl && !supabaseUrl.includes("placeholder");

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div
          className="glass"
          style={{ maxWidth: 380, padding: 24, textAlign: "center" }}
        >
          <p
            className="f-display"
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: "var(--t1)",
              marginBottom: 8,
            }}
          >
            Supabase isn&rsquo;t configured
          </p>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>
            Add your Supabase project credentials to{" "}
            <code
              style={{
                background: "var(--surface-2)",
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              .env.local
            </code>{" "}
            and restart the app to enable sign-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm relative slide-up">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-btn)" }}
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <h1
            className="f-display"
            style={{ fontSize: 32, fontWeight: 700, color: "var(--t1)" }}
          >
            Flousy
          </h1>
          <p style={{ color: "var(--t2)", fontSize: 14, marginTop: 6 }}>
            {mode === "login"
              ? "Welcome back. Track smarter."
              : mode === "signup"
              ? "Start your financial clarity journey."
              : "Reset your password."}
          </p>
        </div>

        {/* Card */}
        <div className="glass p-6 space-y-4">
          {mode !== "reset" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="btn-ghost w-full tap"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: "var(--r-field)",
                  border: "1.5px solid var(--border-2)",
                  background: "var(--surface-2)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--t1)",
                  cursor: "pointer",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.6-4.2-13.5-10l-7.8 6C6.6 42.6 14.6 48 24 48z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div style={{ flex: 1, height: 1, background: "var(--border-2)" }} />
                <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 600 }}>
                  OR
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border-2)" }} />
              </div>
            </>
          )}

          {mode === "signup" && (
            <div className="relative">
              <User
                size={16}
                color="var(--t3)"
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                className="field"
                style={{ paddingLeft: 40 }}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="relative">
            <EnvelopeSimple
              size={16}
              color="var(--t3)"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              className="field"
              style={{ paddingLeft: 40 }}
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && mode === "reset" && handleReset()}
            />
          </div>

          {mode !== "reset" && (
            <div className="relative">
              <LockSimple
                size={16}
                color="var(--t3)"
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                className="field"
                style={{ paddingLeft: 40, paddingRight: 40 }}
                placeholder="Password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPass ? (
                  <EyeSlash size={16} color="var(--t3)" />
                ) : (
                  <Eye size={16} color="var(--t3)" />
                )}
              </button>
            </div>
          )}

          {mode === "login" && (
            <button
              onClick={() => {
                setMode("reset");
                setError("");
                setNotice("");
              }}
              style={{
                fontSize: 12,
                color: "var(--t3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "right",
                display: "block",
                marginLeft: "auto",
              }}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="banner banner-error">{error}</p>}
          {notice && <p className="banner banner-success">{notice}</p>}

          <button
            onClick={mode === "reset" ? handleReset : handleEmail}
            disabled={loading}
            className="btn-primary tap"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: "var(--r-field)",
              background: "var(--accent)",
              color: "var(--accent-ink)",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? (
              <span
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "rgba(0,0,0,0.25)",
                  borderTopColor: "var(--accent-ink)",
                }}
              />
            ) : (
              <>
                <ArrowRight size={16} weight="bold" />
                {mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
              </>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--t3)" }}>
            {mode === "reset" ? (
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setNotice("");
                }}
                style={{
                  color: "var(--t1)",
                  fontWeight: 700,
                  textDecoration: "underline",
                  textDecorationColor: "var(--accent-dim)",
                  textUnderlineOffset: "3px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Back to sign in
              </button>
            ) : (
              <>
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError("");
                  }}
                  style={{
                    color: "var(--t1)",
                    fontWeight: 700,
                    textDecoration: "underline",
                    textDecorationColor: "var(--accent-dim)",
                    textUnderlineOffset: "3px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {mode === "login" ? "Sign up free" : "Sign in"}
                </button>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          {["Encrypted", "Cloud sync", "Installable"].map((b) => (
            <span
              key={b}
              style={{ fontSize: 11, color: "var(--t3)", fontWeight: 600 }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

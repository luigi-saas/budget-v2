import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 flex items-center justify-center" style={{ background: "var(--accent-tint)", borderRadius: "var(--r-field)" }}>
          <Shield className="w-5 h-5" style={{ color: "var(--accent-dim)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Privacy Policy</h1>
          <p className="text-sm" style={{ color: "var(--t3)" }}>Last updated: January 2025</p>
        </div>
      </div>

      <div className="p-8" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
        <div className="prose-style space-y-6">
          <Section title="1. Introduction">
            <p>Flousy (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our personal budget tracking application.</p>
          </Section>
          <Section title="2. Information We Collect">
            <p className="font-medium mb-1" style={{ color: "var(--t1)" }}>Account Information</p>
            <p>When you create an account, we collect your email address, display name, and password (stored as a secure hash — we never see your actual password).</p>
            <p className="font-medium mb-1 mt-3" style={{ color: "var(--t1)" }}>Financial Data</p>
            <p>You voluntarily provide financial data including monthly budget amounts, expense entries, saving goals, and currency preference.</p>
          </Section>
          <Section title="3. How We Use Your Information">
            <p>We use your information to provide and maintain the budget tracking service, authenticate your identity, display your budget data, generate reports and analytics, and improve our application.</p>
          </Section>
          <Section title="4. Data Storage & Security">
            <p>Your data is stored securely in our PostgreSQL database. Passwords are hashed using bcrypt. Sessions use HTTP-only cookies with secure flags. Each user&apos;s data is fully isolated.</p>
          </Section>
          <Section title="5. Data Sharing">
            <p>We do <strong>not</strong> sell, trade, or share your personal or financial data with third parties. Your budget information is entirely private to you.</p>
          </Section>
          <Section title="6. Data Export & Deletion">
            <p>You have the right to export all your data at any time via the Export page (CSV or JSON format). You can also permanently delete your account and all associated data from Settings.</p>
          </Section>
          <Section title="7. Cookies">
            <p>We use a single essential cookie for authentication (session token). We do not use advertising or tracking cookies.</p>
          </Section>
          <Section title="8. Children's Privacy">
            <p>Flousy is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
          </Section>
          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the &ldquo;Last updated&rdquo; date.</p>
          </Section>
          <Section title="10. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@flousy.app" style={{ color: "var(--accent-dim)" }} className="underline">privacy@flousy.app</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--t1)" }}>{title}</h2>
      <div className="text-sm leading-relaxed" style={{ color: "var(--t2)" }}>{children}</div>
    </div>
  );
}

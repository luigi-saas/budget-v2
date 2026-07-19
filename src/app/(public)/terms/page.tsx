import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 flex items-center justify-center" style={{ background: "var(--accent-tint)", borderRadius: "var(--r-field)" }}>
          <FileText className="w-5 h-5" style={{ color: "var(--accent-dim)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>Terms of Service</h1>
          <p className="text-sm" style={{ color: "var(--t3)" }}>Last updated: January 2025</p>
        </div>
      </div>

      <div className="p-8" style={{ background: "var(--surface)", borderRadius: "var(--r-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
        <div className="space-y-6">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using Flousy (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </Section>
          <Section title="2. Description of Service">
            <p>Flousy is a personal budget tracking application that allows you to create and manage monthly budgets, track variable and fixed expenses, set and monitor saving goals, view reports and analytics, and export your financial data.</p>
          </Section>
          <Section title="3. Account Registration">
            <p>To use the Service, you must create an account with a valid email address and password. You are responsible for maintaining the confidentiality of your account credentials.</p>
          </Section>
          <Section title="4. User Responsibilities">
            <p>You agree to provide accurate information, use the Service only for personal budget tracking, not attempt to access other users&apos; data, and not use the Service for any illegal purpose.</p>
          </Section>
          <Section title="5. Data Ownership">
            <p>You retain ownership of all financial data you enter. We do not claim any intellectual property rights over your data. You may export or delete your data at any time.</p>
          </Section>
          <Section title="6. Service Availability">
            <p>We strive to maintain availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance or circumstances beyond our control.</p>
          </Section>
          <Section title="7. Disclaimer">
            <p>Flousy is a budgeting tool, not a financial advisor. The Service does not provide financial advice, investment recommendations, or tax guidance.</p>
          </Section>
          <Section title="8. Limitation of Liability">
            <p>The Service is provided &ldquo;as is&rdquo; without warranties. We are not liable for any damages arising from your use of the Service.</p>
          </Section>
          <Section title="9. Free and Pro Plans">
            <p>The Service currently operates on a free plan. A Pro plan with additional features may be offered in the future. Existing free features will remain available.</p>
          </Section>
          <Section title="10. Account Termination">
            <p>You may delete your account at any time from the Settings page. We reserve the right to terminate accounts that violate these terms.</p>
          </Section>
          <Section title="11. Changes to Terms">
            <p>We may update these Terms from time to time. Continued use constitutes acceptance of the new terms.</p>
          </Section>
          <Section title="12. Contact">
            <p>For questions about these Terms, please contact us at <a href="mailto:legal@flousy.app" style={{ color: "var(--accent-dim)" }} className="underline">legal@flousy.app</a>.</p>
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

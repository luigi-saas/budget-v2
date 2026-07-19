import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flousy — Personal Budget Tracker",
  description: "Track variable expenses, fixed monthly charges, and saving goals with per-category budgets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

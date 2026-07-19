"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AppShell";
import { Settings } from "lucide-react";

// Settings page is now a modal in AppShell
// This page just redirects to dashboard with a note
export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    // Settings are now handled via the modal in the sidebar/header
    router.push("/dashboard");
  }, [user, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Settings className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--t3)" }} />
        <p className="text-sm" style={{ color: "var(--t3)" }}>Redirecting...</p>
      </div>
    </div>
  );
}

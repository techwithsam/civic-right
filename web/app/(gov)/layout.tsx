"use client";
import { AuthProvider, useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ChartBar, SignOut, Buildings } from "@phosphor-icons/react";

function GovNav() {
  const { logOut, civicUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(9,17,31,0.9)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 24px",
      height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-gov)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Buildings size={16} color="#fff" weight="fill" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>Civic Right</span>
        <span style={{
          padding: "2px 8px", borderRadius: "var(--radius-full)",
          background: "var(--accent-gov-dim)", border: "1px solid rgba(79,142,247,0.2)",
          fontSize: 11, fontWeight: 600, color: "var(--accent-gov)", letterSpacing: "0.04em",
        }}>
          GOV
        </span>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius-full)", background: "var(--accent-gov-dim)", border: "1px solid rgba(79,142,247,0.2)", color: "var(--accent-gov)", fontSize: 13, fontWeight: 600 }}>
            <ChartBar size={15} />
            Dashboard
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--radius-full)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
          {civicUser?.name?.split(" ")[0]}
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 6 }} title="Sign out">
          <SignOut size={18} />
        </button>
      </nav>
    </header>
  );
}

function GovAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, civicUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (civicUser?.role === "citizen") router.replace("/home");
  }, [user, civicUser, loading, router]);

  if (loading || !user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--accent-gov)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return <>{children}</>;
}

export default function GovLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GovAuthGuard>
        <GovNav />
        <main style={{ minHeight: "calc(100dvh - 64px)" }}>
          {children}
        </main>
      </GovAuthGuard>
    </AuthProvider>
  );
}

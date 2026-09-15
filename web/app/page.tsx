"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/firebase/auth";

function Redirector() {
  const { user, civicUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (civicUser?.role === "government") {
      router.replace("/dashboard");
    } else {
      router.replace("/home");
    }
  }, [user, civicUser, loading, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "2px solid var(--accent)", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</span>
      </div>
    </div>
  );
}

export default function RootPage() {
  return (
    <AuthProvider>
      <Redirector />
    </AuthProvider>
  );
}

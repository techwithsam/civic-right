"use client";
import { useAuth } from "@/lib/firebase/auth";
import { AuthProvider } from "@/lib/firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  House,
  ChatCircle,
  Warning,
  List as ListIcon,
  User,
  SignOut,
} from "@phosphor-icons/react";

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 16px",
        borderRadius: "var(--radius-md)",
        textDecoration: "none",
        color: active ? "var(--accent)" : "var(--text-muted)",
        background: active ? "var(--accent-dim)" : "transparent",
        transition: "all 0.18s ease",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <Icon size={22} weight={active ? "fill" : "regular"} />
      {label}
    </Link>
  );
}

function CitizenNav() {
  const pathname = usePathname();
  const { logOut, civicUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  return (
    <>
      {/* Top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(9,17,31,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7V18H17V7L10 2Z" stroke="#031A12" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="7.5" y="12" width="5" height="6" rx="1" stroke="#031A12" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>Civic Right</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: "var(--radius-full)",
            background: "var(--surface)", border: "1px solid var(--border)",
            fontSize: 13, color: "var(--text-secondary)",
          }}>
            <User size={14} />
            {civicUser?.name?.split(" ")[0] ?? "You"}
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 6, borderRadius: 8 }} title="Sign out">
            <SignOut size={18} />
          </button>
        </div>
      </header>

      {/* Bottom tab bar (mobile-first) */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "rgba(9,17,31,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-around",
        padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
      }}>
        <NavItem href="/home" icon={House} label="Home" active={pathname === "/home"} />
        <NavItem href="/report" icon={Warning} label="Report" active={pathname === "/report"} />
        <NavItem href="/ask" icon={ChatCircle} label="Ask AI" active={pathname === "/ask"} />
        <NavItem href="/issues" icon={ListIcon} label="Community" active={pathname === "/issues"} />
        <NavItem href="/my-reports" icon={User} label="Mine" active={pathname === "/my-reports"} />
      </nav>
    </>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, civicUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (civicUser?.role === "government") router.replace("/dashboard");
  }, [user, civicUser, loading, router]);

  if (loading || !user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return <>{children}</>;
}

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <CitizenNav />
        <main style={{ paddingBottom: 90, minHeight: "100dvh" }}>
          {children}
        </main>
      </AuthGuard>
    </AuthProvider>
  );
}

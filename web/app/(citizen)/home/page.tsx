"use client";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { Warning, ChatCircle, ArrowRight, MapPin } from "@phosphor-icons/react";

export default function CitizenHomePage() {
  const { civicUser } = useAuth();
  const firstName = civicUser?.name?.split(" ")[0] ?? "there";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 4 }}>
          Good day,
        </p>
        <h1 className="display-md" style={{ marginBottom: 8 }}>
          Hello, {firstName} 👋
        </h1>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: "var(--radius-full)",
          background: "var(--surface)", border: "1px solid var(--border)",
          fontSize: 12, color: "var(--text-secondary)",
        }}>
          <MapPin size={12} />
          {civicUser?.lga}, {civicUser?.state}
        </div>
      </div>

      {/* Primary actions */}
      <div style={{ display: "grid", gap: 14, marginBottom: 36 }}>
        {/* Report */}
        <Link href="/report" style={{ textDecoration: "none" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(34,211,165,0.14) 0%, rgba(34,211,165,0.05) 100%)",
            border: "1px solid rgba(34,211,165,0.2)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 28px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Warning size={22} color="var(--accent)" weight="fill" />
                </div>
                <h2 className="heading-lg" style={{ marginBottom: 6 }}>Report an issue</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55, maxWidth: 280 }}>
                  Roads, power cuts, flooding — describe what&apos;s happening and we&apos;ll get it to the right authority.
                </p>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent)", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ArrowRight size={16} color="#031A12" weight="bold" />
              </div>
            </div>
          </div>
        </Link>

        {/* Ask AI */}
        <Link href="/ask" style={{ textDecoration: "none" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(79,142,247,0.12) 0%, rgba(79,142,247,0.04) 100%)",
            border: "1px solid rgba(79,142,247,0.18)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 28px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--accent-gov-dim)", border: "1px solid rgba(79,142,247,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <ChatCircle size={22} color="var(--accent-gov)" weight="fill" />
                </div>
                <h2 className="heading-lg" style={{ marginBottom: 6 }}>Ask about a policy</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55, maxWidth: 280 }}>
                  Tax reform, electricity tariffs, road projects — get clear answers from official sources.
                </p>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent-gov)", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ArrowRight size={16} color="#fff" weight="bold" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick links */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 14, letterSpacing: "0.01em" }}>
          QUICK ACCESS
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Link href="/issues" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "16px",
              fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
              transition: "all 0.18s ease", cursor: "pointer",
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              Issues near me
            </div>
          </Link>
          <Link href="/my-reports" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "16px",
              fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
              transition: "all 0.18s ease", cursor: "pointer",
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              My reports
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

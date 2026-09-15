"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { getMyReports, type Report, type ReportCategory } from "@/lib/firebase/firestore";
import { RoadHorizon, Lightning, Drop, ArrowRight } from "@phosphor-icons/react";

const catIcon: Record<ReportCategory, React.ElementType> = {
  roads: RoadHorizon,
  electricity: Lightning,
  waste_flooding: Drop,
};
const catColor: Record<ReportCategory, string> = {
  roads: "var(--warning)",
  electricity: "var(--accent-gov)",
  waste_flooding: "var(--accent)",
};

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  community_confirmed: "Community confirmed",
  assigned: "Assigned",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyReports(user.uid).then((r) => {
      setReports(r);
      setLoading(false);
    });
  }, [user]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
      <h1 className="heading-lg" style={{ marginBottom: 6 }}>My reports</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Issues you&apos;ve submitted
      </p>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0,1,2].map((i) => (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 11, width: "35%" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>You haven&apos;t submitted any reports yet.</p>
          <Link href="/report">
            <button className="btn btn-primary">
              Report an issue <ArrowRight size={16} weight="bold" />
            </button>
          </Link>
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map((r) => {
            const Icon = catIcon[r.category];
            const color = catColor[r.category];
            return (
              <Link key={r.id} href={`/issues/${r.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{
                  padding: "16px 18px", cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex", alignItems: "center", gap: 14,
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={17} color={color} weight="fill" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.location}</p>
                  </div>
                  <span className={`badge badge-${r.status.replace(/_/g, "-")}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

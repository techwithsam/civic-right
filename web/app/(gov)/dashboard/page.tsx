"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllReports, type Report, type ReportCategory } from "@/lib/firebase/firestore";
import { RoadHorizon, Lightning, Drop, Users, ArrowRight, Flag } from "@phosphor-icons/react";

const catIcon: Record<ReportCategory, React.ElementType> = { roads: RoadHorizon, electricity: Lightning, waste_flooding: Drop };
const catColor: Record<ReportCategory, string> = { roads: "var(--warning)", electricity: "var(--accent-gov)", waste_flooding: "var(--accent)" };
const catLabel: Record<ReportCategory, string> = { roads: "Roads", electricity: "Electricity", waste_flooding: "Waste / Flooding" };

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported", community_confirmed: "Community confirmed",
  assigned: "Assigned", acknowledged: "Acknowledged",
  in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <p style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value.toLocaleString()}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

export default function GovDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    getAllReports(100).then((r) => { setReports(r); setLoading(false); });
  }, []);

  const total    = reports.length;
  const newCount = reports.filter((r) => r.status === "reported").length;
  const inProg   = reports.filter((r) => r.status === "in_progress").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  const filtered = statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="display-md" style={{ marginBottom: 6 }}>Reports Dashboard</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>All community-reported civic issues, sorted by priority</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
          {[0,1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
          <StatCard label="Total reports" value={total} color="var(--text-primary)" />
          <StatCard label="New / Reported" value={newCount} color="var(--warning)" />
          <StatCard label="In progress" value={inProg} color="var(--accent-gov)" />
          <StatCard label="Resolved" value={resolved} color="var(--accent)" />
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["all", "reported", "community_confirmed", "assigned", "in_progress", "resolved"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "6px 14px", borderRadius: "var(--radius-full)", border: "1px solid",
            borderColor: statusFilter === s ? "var(--accent-gov)" : "var(--border)",
            background: statusFilter === s ? "var(--accent-gov-dim)" : "transparent",
            color: statusFilter === s ? "var(--accent-gov)" : "var(--text-secondary)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.18s ease",
          }}>
            {s === "all" ? "All" : STATUS_LABELS[s] ?? s}
          </button>
        ))}
      </div>

      {/* Reports table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0,1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r, idx) => {
            const Icon = catIcon[r.category];
            const color = catColor[r.category];
            const isHighPriority = r.confirmationCount >= 500 || r.status === "reported";
            return (
              <Link key={r.id} href={`/reports/${r.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{
                  padding: "16px 20px", cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex", alignItems: "center", gap: 16,
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {/* Rank */}
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, width: 24, textAlign: "right", flexShrink: 0 }}>
                    {idx + 1}
                  </span>

                  {/* Category icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color={color} weight="fill" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      {isHighPriority && <Flag size={12} color="var(--danger)" weight="fill" />}
                      <p style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {catLabel[r.category]} · {r.location}
                    </p>
                  </div>

                  {/* Confirmations */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                      {r.confirmationCount.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <Users size={10} /> confirmations
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`badge badge-${r.status.replace(/_/g, "-")}`} style={{ flexShrink: 0 }}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>

                  <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          No reports match this filter.
        </div>
      )}
    </div>
  );
}

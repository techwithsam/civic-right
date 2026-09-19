"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { getReportsByLGA, type Report, type ReportCategory } from "@/lib/firebase/firestore";
import { RoadHorizon, Lightning, Drop, Users, ArrowRight } from "@phosphor-icons/react";

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

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ReportCard({ report }: { report: Report }) {
  const Icon = catIcon[report.category];
  const color = catColor[report.category];
  const statusClass = `badge badge-${report.status.replace(/_/g, "-")}`;

  return (
    <Link href={`/issues/${report.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{
        padding: "18px", cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={18} color={color} weight="fill" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{report.title}</h3>
              <span className={statusClass} style={{ flexShrink: 0 }}>{statusLabel(report.status)}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{report.location}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>{report.confirmationCount.toLocaleString()}</strong> confirmations
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: "18px" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 8, width: "70%" }} />
          <div className="skeleton" style={{ height: 11, borderRadius: 6, width: "40%" }} />
        </div>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  const { civicUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportCategory | "all">("all");

  useEffect(() => {
    if (!civicUser) return;
    let isCurrent = true;
    getReportsByLGA(civicUser.state, civicUser.lga).then((r) => {
      if (isCurrent) {
        setReports(r);
        setLoading(false);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [civicUser]);

  const filtered = filter === "all" ? reports : reports.filter((r) => r.category === filter);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 className="heading-lg">Issues near you</h1>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {civicUser?.lga}, {civicUser?.state}
        </span>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        Community-reported issues in your area
      </p>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(["all", "roads", "electricity", "waste_flooding"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip ${f === "all" ? (filter === "all" ? "chip-roads" : "chip-inactive") : filter === f ? `chip-${f === "roads" ? "roads" : f === "electricity" ? "electricity" : "waste"}` : "chip-inactive"}`}
            style={{ fontSize: 12 }}
          >
            {f === "all" ? "All issues" : f === "roads" ? "Roads" : f === "electricity" ? "Electricity" : "Waste / Flooding"}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 16 }}>
            No issues reported in your area yet.
          </p>
          <Link href="/report">
            <button className="btn btn-primary">
              Report the first one <ArrowRight size={16} weight="bold" />
            </button>
          </Link>
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}

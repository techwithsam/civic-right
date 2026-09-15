"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  subscribeToReport,
  updateReportStatus,
  getAuthority,
  type Report,
  type ReportStatus,
  type Authority,
} from "@/lib/firebase/firestore";
import { RoadHorizon, Lightning, Drop, ArrowLeft, Users, CheckCircle, Circle } from "@phosphor-icons/react";

const catIcon: Record<string, React.ElementType> = { roads: RoadHorizon, electricity: Lightning, waste_flooding: Drop };
const catColor: Record<string, string> = { roads: "var(--warning)", electricity: "var(--accent-gov)", waste_flooding: "var(--accent)" };

const STATUS_FLOW: { value: ReportStatus; label: string; action: string }[] = [
  { value: "reported",           label: "Reported",           action: "" },
  { value: "community_confirmed",label: "Community confirmed", action: "" },
  { value: "assigned",           label: "Assigned",           action: "Mark as Assigned" },
  { value: "acknowledged",       label: "Acknowledged",       action: "Acknowledge" },
  { value: "in_progress",        label: "In progress",        action: "Mark In Progress" },
  { value: "resolved",           label: "Resolved",           action: "Mark Resolved" },
];

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported", community_confirmed: "Community confirmed",
  assigned: "Assigned", acknowledged: "Acknowledged",
  in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

export default function GovReportDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [report, setReport]     = useState<Report | null>(null);
  const [authority, setAuthority] = useState<Authority | null>(null);
  const [loading, setLoading]   = useState(true);
  const [note, setNote]         = useState("");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess]   = useState("");

  useEffect(() => {
    const unsub = subscribeToReport(id, (r) => {
      setReport(r);
      setLoading(false);
      if (r.authorityId) getAuthority(r.authorityId).then(setAuthority);
    });
    return unsub;
  }, [id]);

  const advanceStatus = async (newStatus: ReportStatus) => {
    if (!report) return;
    setUpdating(true);
    await updateReportStatus(report.id, newStatus, note || undefined);
    setNote("");
    setSuccess(`Status updated to "${STATUS_LABELS[newStatus]}"`);
    setTimeout(() => setSuccess(""), 3000);
    setUpdating(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <div className="skeleton" style={{ height: 18, width: "50%", marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  if (!report) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
      <p style={{ color: "var(--text-muted)" }}>Report not found.</p>
    </div>
  );

  const currentIdx = STATUS_FLOW.findIndex((s) => s.value === report.status);
  const nextStep = STATUS_FLOW[currentIdx + 1];
  const Icon = catIcon[report.category] ?? RoadHorizon;
  const color = catColor[report.category] ?? "var(--accent)";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Back to dashboard
      </button>

      {/* Header */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, alignItems: "flex-start" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={26} color={color} weight="fill" />
        </div>
        <div>
          <h1 className="display-md" style={{ fontSize: "1.5rem", marginBottom: 6 }}>{report.title}</h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{report.location}</span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span className={`badge badge-${report.status.replace(/_/g, "-")}`}>{STATUS_LABELS[report.status]}</span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>
              <Users size={12} style={{ marginRight: 4 }} />
              {report.confirmationCount.toLocaleString()} confirmations
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Description */}
          <div className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</h2>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-secondary)" }}>{report.description}</p>
          </div>

          {/* AI extraction */}
          {report.aiExtracted && (
            <div className="card" style={{ padding: "20px", background: "var(--accent-gov-dim)", border: "1px solid rgba(79,142,247,0.15)" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-gov)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI summary</h2>
              <p style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>{report.aiExtracted.problem}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, padding: "3px 8px", borderRadius: "var(--radius-full)", background: "var(--surface)", color: "var(--text-secondary)" }}>
                  Severity: {report.aiExtracted.severity}
                </span>
              </div>
            </div>
          )}

          {/* Authority */}
          {authority && (
            <div className="card" style={{ padding: "20px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Authority</h2>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>{authority.name}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{authority.type}</p>
            </div>
          )}
        </div>

        {/* Right col — status + actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Timeline */}
          <div className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status timeline</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STATUS_FLOW.map((s, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s.value} style={{ display: "flex", gap: 12, paddingBottom: i < STATUS_FLOW.length - 1 ? 14 : 0, position: "relative" }}>
                    {i < STATUS_FLOW.length - 1 && (
                      <div style={{ position: "absolute", left: 10, top: 20, bottom: 0, width: 2, background: done && i < currentIdx ? "var(--accent-gov)" : "var(--border)" }} />
                    )}
                    <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: done ? "var(--accent-gov)" : "var(--surface-2)", border: `2px solid ${done ? "var(--accent-gov)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                      {done ? <CheckCircle size={12} color="#fff" weight="fill" /> : <Circle size={12} color="var(--text-muted)" />}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: done ? "var(--text-primary)" : "var(--text-muted)", paddingTop: 2 }}>{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {nextStep && (
            <div className="card" style={{ padding: "20px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Update status</h2>

              {success && (
                <div style={{ background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--accent)", fontSize: 13, marginBottom: 14 }}>
                  {success}
                </div>
              )}

              <div>
                <label className="input-label" htmlFor="gov-note">Add a note (optional)</label>
                <textarea
                  id="gov-note"
                  className="input textarea"
                  placeholder="Provide an update for citizens…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ minHeight: 80, marginBottom: 12 }}
                />
              </div>

              <button
                className="btn btn-gov"
                onClick={() => advanceStatus(nextStep.value)}
                disabled={updating}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {updating ? "Updating…" : nextStep.action}
              </button>

              {/* Quick jump to resolved */}
              {currentIdx < STATUS_FLOW.length - 1 && report.status !== "in_progress" && (
                <button
                  className="btn"
                  onClick={() => advanceStatus("resolved")}
                  disabled={updating}
                  style={{ width: "100%", justifyContent: "center", marginTop: 8, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(34,211,165,0.2)" }}
                >
                  Mark Resolved
                </button>
              )}
            </div>
          )}

          {report.status === "resolved" && (
            <div style={{ padding: "20px", borderRadius: "var(--radius-lg)", background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.2)", textAlign: "center" }}>
              <CheckCircle size={28} color="var(--accent)" weight="fill" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 700, color: "var(--accent)" }}>Issue resolved</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

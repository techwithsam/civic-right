"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import {
  subscribeToReport,
  confirmReport,
  hasUserConfirmed,
  getAuthority,
  type Report,
  type Authority,
} from "@/lib/firebase/firestore";
import {
  Users,
  CheckCircle,
  Circle,
  RoadHorizon,
  Lightning,
  Drop,
  ArrowLeft,
  Phone,
  Globe,
} from "@phosphor-icons/react";

const STATUS_STEPS = [
  "reported",
  "community_confirmed",
  "assigned",
  "acknowledged",
  "in_progress",
  "resolved",
] as const;

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  community_confirmed: "Community confirmed",
  assigned: "Assigned",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const catIcon: Record<string, React.ElementType> = {
  roads: RoadHorizon,
  electricity: Lightning,
  waste_flooding: Drop,
};
const catColor: Record<string, string> = {
  roads: "var(--warning)",
  electricity: "var(--accent-gov)",
  waste_flooding: "var(--accent)",
};

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [authority, setAuthority] = useState<Authority | null>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToReport(id, (r) => {
      setReport(r);
      setLoading(false);
      if (r.authorityId) {
        getAuthority(r.authorityId).then(setAuthority);
      }
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (user && id) {
      hasUserConfirmed(id, user.uid).then(setUserConfirmed);
    }
  }, [user, id]);

  const handleConfirm = async () => {
    if (!user || userConfirmed || confirming) return;
    setConfirming(true);
    const { alreadyConfirmed } = await confirmReport(id, user.uid);
    if (!alreadyConfirmed) setUserConfirmed(true);
    setConfirming(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
        <div className="skeleton" style={{ height: 20, width: "60%", marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)", marginBottom: 16 }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Issue not found.</p>
      </div>
    );
  }

  const Icon = catIcon[report.category] ?? RoadHorizon;
  const color = catColor[report.category] ?? "var(--accent)";
  const currentStepIdx = STATUS_STEPS.indexOf(report.status as typeof STATUS_STEPS[number]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "flex-start" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={24} color={color} weight="fill" />
        </div>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: 4 }}>{report.title}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{report.location}</p>
        </div>
      </div>

      {/* Confirmation count + button */}
      <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>
              {report.confirmationCount.toLocaleString()}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={13} /> citizens confirmed this
            </p>
          </div>
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={userConfirmed || confirming}
            style={{
              background: userConfirmed ? "var(--accent-dim)" : "var(--accent)",
              color: userConfirmed ? "var(--accent)" : "#031A12",
              border: userConfirmed ? "1px solid rgba(34,211,165,0.3)" : "none",
            }}
          >
            <CheckCircle size={16} weight={userConfirmed ? "fill" : "regular"} />
            {userConfirmed ? "Confirmed" : confirming ? "Confirming…" : "Confirm issue"}
          </button>
        </div>
      </div>

      {/* Status timeline */}
      <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Status timeline</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STATUS_STEPS.map((s, i) => {
            const done = i <= currentStepIdx;
            const active = i === currentStepIdx;
            return (
              <div key={s} style={{ display: "flex", gap: 14, paddingBottom: i < STATUS_STEPS.length - 1 ? 18 : 0, position: "relative" }}>
                {/* Line */}
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", left: 11, top: 22, bottom: 0, width: 2,
                    background: done && i < currentStepIdx ? "var(--accent)" : "var(--border)",
                  }} />
                )}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: done ? "var(--accent)" : "var(--surface-2)",
                  border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1,
                }}>
                  {done ? <CheckCircle size={14} color="#031A12" weight="fill" /> : <Circle size={14} color="var(--text-muted)" />}
                </div>
                <div>
                  <p style={{
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    color: done ? "var(--text-primary)" : "var(--text-muted)",
                  }}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Description</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{report.description}</p>
      </div>

      {/* Responsible authority */}
      {authority && (
        <div className="card" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Responsible authority</h2>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>{authority.name}</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>{authority.type} · {authority.state}</p>
          <div style={{ display: "flex", gap: 10 }}>
            {authority.contact && (
              <a href={`tel:${authority.contact}`} className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 14px" }}>
                <Phone size={14} /> {authority.contact}
              </a>
            )}
            {authority.website && (
              <a href={authority.website} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 14px" }}>
                <Globe size={14} /> Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

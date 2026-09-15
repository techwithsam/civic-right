"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import {
  createReport,
  findNearbyReports,
  confirmReport,
  type ReportCategory,
  type Report,
} from "@/lib/firebase/firestore";
import {
  RoadHorizon,
  Lightning,
  Drop,
  MapPin,
  CheckCircle,
  Warning,
  SpinnerGap,
  ArrowRight,
} from "@phosphor-icons/react";

const CATEGORIES: { value: ReportCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: "roads", label: "Roads & Infrastructure", icon: RoadHorizon, color: "var(--warning)" },
  { value: "electricity", label: "Electricity", icon: Lightning, color: "var(--accent-gov)" },
  { value: "waste_flooding", label: "Waste / Flooding", icon: Drop, color: "var(--accent)" },
];

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000";

type Step = "describe" | "classifying" | "existing" | "form" | "done";

export default function ReportPage() {
  const { civicUser, user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>("roads");
  const [location, setLocation] = useState(civicUser?.lga ? `${civicUser.lga}, ${civicUser.state}` : "");
  const [aiResult, setAiResult] = useState<{ title: string; problem: string; severity: string } | null>(null);
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [confirmedExisting, setConfirmedExisting] = useState<string | null>(null);

  const classify = async () => {
    if (!description.trim()) return;
    setStep("classifying");

    try {
      const res = await fetch(`${API_URL}/classify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          user_location: location || `${civicUser?.lga}, ${civicUser?.state}`,
        }),
      });
      const data = await res.json();
      setCategory(data.category as ReportCategory);
      if (data.location) setLocation(data.location);
      setAiResult({ title: data.title, problem: data.problem, severity: data.severity });

      // Search for nearby existing reports
      const nearby = await findNearbyReports(
        data.category,
        data.location || civicUser?.lga || "",
        civicUser?.state || ""
      );
      setNearbyReports(nearby);
      setStep(nearby.length > 0 ? "existing" : "form");
    } catch {
      // Fallback: show form without AI
      setStep("form");
    }
  };

  const confirmExisting = async (reportId: string) => {
    if (!user) return;
    setSubmitting(true);
    await confirmReport(reportId, user.uid);
    setConfirmedExisting(reportId);
    setSubmitting(false);
    setStep("done");
  };

  const submitNewReport = async () => {
    if (!user || !civicUser) return;
    setSubmitting(true);
    try {
      const id = await createReport({
        title: aiResult?.title || description.slice(0, 60),
        description,
        category,
        state: civicUser.state,
        lga: civicUser.lga,
        location,
        latitude: null,
        longitude: null,
        evidence: [],
        reportedBy: user.uid,
        authorityId: null,
        aiExtracted: {
          problem: aiResult?.problem || description,
          severity: aiResult?.severity || "medium",
        },
      });
      setCreatedId(id);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  const cat = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px" }}>
      <h1 className="heading-lg" style={{ marginBottom: 6 }}>Report an issue</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
        Describe what&apos;s happening and we&apos;ll identify the right authority.
      </p>

      {/* ─── Step: Describe ─── */}
      {step === "describe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="input-label" htmlFor="description">What&apos;s happening?</label>
            <textarea
              id="description"
              className="input textarea"
              placeholder="Describe the issue in your own words… e.g. The road around Elebu has been destroyed. Large potholes everywhere, causing accidents daily."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: 140 }}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="location">Location</label>
            <div style={{ position: "relative" }}>
              <MapPin size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="location"
                className="input"
                placeholder="e.g. Elebu, Ibadan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={classify}
            disabled={!description.trim()}
            style={{ alignSelf: "flex-start" }}
          >
            Continue
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* ─── Step: Classifying ─── */}
      {step === "classifying" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
          <SpinnerGap size={32} color="var(--accent)" style={{ animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "var(--text-secondary)" }}>Analysing your report…</p>
        </div>
      )}

      {/* ─── Step: Existing reports ─── */}
      {step === "existing" && nearbyReports.length > 0 && (
        <div>
          <div style={{
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: "var(--radius-md)", padding: "14px 16px", marginBottom: 24,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <Warning size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 14, color: "var(--warning)" }}>
              We found existing reports nearby. Confirming an existing one increases its priority.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {nearbyReports.map((r) => (
              <div key={r.id} className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.title}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.location}</p>
                  </div>
                  <span className={`badge badge-${r.status.replace("_", "-")}`}>{r.status.replace(/_/g, " ")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--accent)" }}>{r.confirmationCount.toLocaleString()}</strong> confirmations
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={() => confirmExisting(r.id)}
                    disabled={submitting}
                    style={{ padding: "8px 16px", fontSize: 13 }}
                  >
                    <CheckCircle size={15} weight="fill" />
                    Confirm this issue
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" onClick={() => setStep("form")}>
            Report a different issue
          </button>
        </div>
      )}

      {/* ─── Step: New report form ─── */}
      {step === "form" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {aiResult && (
            <div style={{
              background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.2)",
              borderRadius: "var(--radius-md)", padding: "14px 16px",
            }}>
              <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI extracted</p>
              <p style={{ fontSize: 14, color: "var(--text-primary)" }}>{aiResult.problem}</p>
            </div>
          )}

          <div>
            <p className="input-label">Category</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  className={`chip ${category === c.value ? `chip-${c.value === "roads" ? "roads" : c.value === "electricity" ? "electricity" : "waste"}` : "chip-inactive"}`}
                  onClick={() => setCategory(c.value)}
                >
                  <c.icon size={14} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="loc-confirm">Confirm location</label>
            <div style={{ position: "relative" }}>
              <MapPin size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input id="loc-confirm" className="input" value={location} onChange={(e) => setLocation(e.target.value)} style={{ paddingLeft: 34 }} />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={submitNewReport}
            disabled={submitting}
            style={{ alignSelf: "flex-start" }}
          >
            {submitting ? <><SpinnerGap size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Submitting…</> : <>Submit report <ArrowRight size={16} weight="bold" /></>}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ─── Step: Done ─── */}
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <CheckCircle size={32} color="var(--accent)" weight="fill" />
          </div>
          <h2 className="heading-lg" style={{ marginBottom: 8 }}>
            {confirmedExisting ? "Issue confirmed!" : "Report submitted!"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, maxWidth: 320, margin: "0 auto 28px" }}>
            {confirmedExisting
              ? "Your confirmation has been counted. The community signal is now stronger."
              : "Your report has been received. We'll notify you when there's an update."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {(confirmedExisting || createdId) && (
              <button className="btn btn-primary" onClick={() => router.push(`/issues/${confirmedExisting ?? createdId}`)}>
                View issue <ArrowRight size={16} weight="bold" />
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => router.push("/issues")}>
              See all issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import {
  createReport,
  findNearbyReports,
  confirmReport,
  findAuthority,
  getAuthority,
  type ReportCategory,
  type Report,
  type Authority,
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
  Buildings,
  Phone,
  Globe,
  Tag,
} from "@phosphor-icons/react";

const CATEGORIES: { value: ReportCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: "roads", label: "Roads & Infrastructure", icon: RoadHorizon, color: "var(--warning)" },
  { value: "electricity", label: "Electricity", icon: Lightning, color: "var(--accent-gov)" },
  { value: "waste_flooding", label: "Waste / Flooding", icon: Drop, color: "var(--accent)" },
];

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "/api/ai";

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
  const [assignedAuth, setAssignedAuth] = useState<Authority | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [confirmedExisting, setConfirmedExisting] = useState<string | null>(null);

  // Update preview authority when category or user state changes
  useEffect(() => {
    const state = civicUser?.state || "Oyo";
    findAuthority(state, category).then(setAssignedAuth);
  }, [category, civicUser?.state]);

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

      if (!res.ok) throw new Error("API classification error");

      const data = await res.json();
      const cat = data.category as ReportCategory;
      setCategory(cat);
      if (data.location) setLocation(data.location);
      setAiResult({ title: data.title, problem: data.problem, severity: data.severity });

      // Search for nearby existing reports
      const nearby = await findNearbyReports(
        cat,
        data.location || civicUser?.lga || "",
        civicUser?.state || ""
      );
      setNearbyReports(nearby);
      setStep(nearby.length > 0 ? "existing" : "form");
    } catch {
      // Robust client-side keyword heuristic fallback
      const descLower = description.toLowerCase();
      let cat: ReportCategory = "roads";
      if (
        descLower.includes("power") ||
        descLower.includes("light") ||
        descLower.includes("electricity") ||
        descLower.includes("transformer") ||
        descLower.includes("blackout") ||
        descLower.includes("nepa") ||
        descLower.includes("ibedc")
      ) {
        cat = "electricity";
      } else if (
        descLower.includes("flood") ||
        descLower.includes("flooding") ||
        descLower.includes("drain") ||
        descLower.includes("gutter") ||
        descLower.includes("waste") ||
        descLower.includes("refuse") ||
        descLower.includes("trash")
      ) {
        cat = "waste_flooding";
      }

      setCategory(cat);
      const isHigh =
        descLower.includes("urgent") ||
        descLower.includes("danger") ||
        descLower.includes("accident") ||
        descLower.includes("severe") ||
        descLower.includes("hazard");

      const firstWords = description.split(/\s+/).slice(0, 8).join(" ");
      setAiResult({
        title: firstWords || "Civic Infrastructure Issue",
        problem: description.slice(0, 200),
        severity: isHigh ? "high" : "medium",
      });

      const nearby = await findNearbyReports(
        cat,
        location || civicUser?.lga || "",
        civicUser?.state || ""
      );
      setNearbyReports(nearby);
      setStep(nearby.length > 0 ? "existing" : "form");
    }
  };

  const confirmExisting = async (reportId: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await confirmReport(reportId, user.uid);
      const existingRep = nearbyReports.find((r) => r.id === reportId);
      if (existingRep?.authorityId) {
        const auth = await getAuthority(existingRep.authorityId);
        setAssignedAuth(auth);
      } else {
        const auth = await findAuthority(civicUser?.state || "Oyo", category);
        setAssignedAuth(auth);
      }
      setConfirmedExisting(reportId);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewReport = async () => {
    if (!user || !civicUser) return;
    setSubmitting(true);
    try {
      const auth = await findAuthority(civicUser.state, category);
      setAssignedAuth(auth);

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
        authorityId: auth?.id || null,
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

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px" }}>
      <h1 className="heading-lg" style={{ marginBottom: 6 }}>Report an issue</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
        Describe what&apos;s happening and we&apos;ll automatically identify the issue, check duplicates, and route it to the responsible authority.
      </p>

      {/* ─── Step: Describe ─── */}
      {step === "describe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="input-label" htmlFor="description">What&apos;s happening?</label>
            <textarea
              id="description"
              className="input textarea"
              placeholder="Describe the issue in your own words… e.g. The road around Elebu market has been completely damaged by rain. Large potholes causing accidents daily."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: 140 }}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="location">Location / Area</label>
            <div style={{ position: "relative" }}>
              <MapPin size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="location"
                className="input"
                placeholder="e.g. Elebu, Ibadan North"
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
          <SpinnerGap size={36} color="var(--accent)" style={{ animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>Analysing report…</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              Categorising infrastructure issue and checking for existing community reports.
            </p>
          </div>
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
            <Warning size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: "var(--warning)", fontSize: 14 }}>Matching Community Issue Found</strong>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                Someone has already reported an issue nearby. Confirming it strengthens the community signal and elevates it on the Government Priority Dashboard.
              </p>
            </div>
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
            Report a different / new issue <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ─── Step: New report form ─── */}
      {step === "form" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Extracted Banner */}
          {aiResult && (
            <div style={{
              background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.25)",
              borderRadius: "var(--radius-md)", padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Tag size={14} color="var(--accent)" weight="bold" />
                <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  AI Classified · Severity: {aiResult.severity.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>{aiResult.title}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{aiResult.problem}</p>
            </div>
          )}

          {/* Category selection */}
          <div>
            <p className="input-label">Category</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`chip ${category === c.value ? `chip-${c.value === "roads" ? "roads" : c.value === "electricity" ? "electricity" : "waste"}` : "chip-inactive"}`}
                  onClick={() => setCategory(c.value)}
                >
                  <c.icon size={14} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responsible Authority preview */}
          {assignedAuth && (
            <div style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(79,142,247,0.08)",
              border: "1px solid rgba(79,142,247,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
            }}>
              <Buildings size={20} color="var(--accent-gov)" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Responsible Authority:
                </span>
                <p style={{ fontWeight: 600, color: "var(--accent-gov)", margin: "2px 0 0" }}>
                  {assignedAuth.name}
                </p>
              </div>
            </div>
          )}

          {/* Location confirm */}
          <div>
            <label className="input-label" htmlFor="loc-confirm">Location (City, Area, LGA)</label>
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
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--accent-dim)", border: "1px solid rgba(34,211,165,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <CheckCircle size={36} color="var(--accent)" weight="fill" />
          </div>

          <h2 className="heading-lg" style={{ marginBottom: 6 }}>
            {confirmedExisting ? "Issue Confirmed!" : "Report Submitted Successfully!"}
          </h2>

          {(createdId || confirmedExisting) && (
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--surface-2)",
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--text-secondary)",
              marginBottom: 16,
              border: "1px solid var(--border)",
            }}>
              ID: #REP-{(createdId || confirmedExisting || "").slice(0, 8).toUpperCase()}
            </div>
          )}

          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
            {confirmedExisting
              ? "Your confirmation has strengthened the community signal. The issue is now elevated on the Government Priority Dashboard."
              : "Your report has been logged and forwarded to the government department dashboard for assessment and action."}
          </p>

          {/* Responsible authority summary card */}
          {assignedAuth && (
            <div className="card" style={{ padding: "18px 20px", textAlign: "left", marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Buildings size={20} color="var(--accent-gov)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-gov)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Assigned Authority
                </span>
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{assignedAuth.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{assignedAuth.type} · {assignedAuth.state}</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {assignedAuth.contact && (
                  <a href={`tel:${assignedAuth.contact}`} className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>
                    <Phone size={13} /> {assignedAuth.contact}
                  </a>
                )}
                {assignedAuth.website && (
                  <a href={assignedAuth.website} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>
                    <Globe size={13} /> Official Website
                  </a>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {(confirmedExisting || createdId) && (
              <button className="btn btn-primary" onClick={() => router.push(`/issues/${confirmedExisting ?? createdId}`)}>
                Track Live Timeline <ArrowRight size={16} weight="bold" />
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => router.push("/issues")}>
              View Community Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

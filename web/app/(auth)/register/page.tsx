"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { Buildings, ArrowRight, WarningCircle } from "@phosphor-icons/react";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

function getFriendlyErrorMessage(err: unknown): string {
  if (!err) return "Registration failed. Please try again.";
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code || "";

  if (code === "auth/invalid-api-key" || msg.includes("auth/invalid-api-key")) {
    return "Firebase API key is missing or invalid. Please check NEXT_PUBLIC_FIREBASE_API_KEY in web/.env.local.";
  }
  if (code === "auth/operation-not-allowed" || msg.includes("operation-not-allowed")) {
    return "Email/Password sign-in is disabled in your Firebase console. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.";
  }
  if (code === "auth/email-already-in-use" || msg.includes("email-already-in-use")) {
    return "This email address is already registered. Please sign in instead.";
  }
  if (code === "auth/weak-password" || msg.includes("weak-password")) {
    return "Password is too weak. Please use at least 8 characters.";
  }
  if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code === "auth/network-request-failed" || msg.includes("network-request-failed")) {
    return "Network connection failed. Please check your internet connection.";
  }
  if (code === "permission-denied" || msg.includes("permission-denied")) {
    return "Firestore permission error: Unable to create user profile. Please verify your firestore.rules.";
  }
  return msg || "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isConfigMissing =
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "" ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "AIzaSyDummyKeyForBuildPurposeOnly000";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isConfigMissing) {
      setError(
        "Firebase is not yet configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY to web/.env.local from your Firebase Console."
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // Public registration is strictly for Citizens
      await signUp(email, password, name, "citizen", state, lga);
      router.replace("/");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 460 }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7V18H17V7L10 2Z" stroke="#031A12" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="7.5" y="12" width="5" height="6" rx="1" stroke="#031A12" strokeWidth="1.5"/>
              <circle cx="10" cy="9" r="1.5" fill="#031A12"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Civic Right</span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Create your citizen account</p>
      </div>

      {isConfigMissing && (
        <div style={{
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          marginBottom: 20,
          color: "#FBBF24",
          fontSize: 13,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <WarningCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Firebase setup required:</strong>
            <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.4, color: "var(--text-secondary)" }}>
              Missing <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> in <code>web/.env.local</code>. Copy your web app config from Firebase Console.
            </p>
          </div>
        </div>
      )}

      <div className="card-bezel">
        <div className="card-bezel-inner" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="input-label" htmlFor="name">Full name</label>
              <input id="name" className="input" type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="input-label" htmlFor="reg-email">Email address</label>
              <input id="reg-email" className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="input-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" className="input" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="input-label" htmlFor="state">State</label>
                <select id="state" className="input" value={state} onChange={(e) => setState(e.target.value)} required style={{ cursor: "pointer" }}>
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label" htmlFor="lga">LGA</label>
                <input id="lga" className="input" type="text" placeholder="e.g. Ibadan North" value={lga} onChange={(e) => setLga(e.target.value)} required />
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--danger)", fontSize: 13, lineHeight: 1.4 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {loading ? "Creating account…" : "Create citizen account"}
              {!loading && <ArrowRight size={16} weight="bold" />}
            </button>
          </form>
        </div>
      </div>

      {/* Internal government account notice */}
      <div style={{
        marginTop: 20,
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "rgba(79,142,247,0.08)",
        border: "1px solid rgba(79,142,247,0.18)",
        fontSize: 13,
        color: "var(--text-secondary)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        <Buildings size={22} color="var(--accent-gov)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 600, color: "var(--accent-gov)" }}>Government official?</div>
          <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: 1.45, color: "var(--text-secondary)" }}>
            Official accounts are provisioned internally by department administrators.
            Please <Link href="/login" style={{ color: "var(--accent-gov)", textDecoration: "underline", fontWeight: 600 }}>sign in with your credentials</Link>.
          </p>
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
      </p>
    </div>
  );
}

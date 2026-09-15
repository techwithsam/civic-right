"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type UserRole } from "@/lib/firebase/auth";
import { User, Buildings, ArrowRight } from "@phosphor-icons/react";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await signUp(email, password, name, role, state, lga);
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setError(msg.includes("email-already-in-use") ? "This email is already registered." : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 460 }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
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
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Create your account</p>
      </div>

      {/* Role selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {(["citizen", "government"] as UserRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${role === r ? (r === "citizen" ? "var(--accent)" : "var(--accent-gov)") : "var(--border)"}`,
              background: role === r ? (r === "citizen" ? "var(--accent-dim)" : "var(--accent-gov-dim)") : "var(--surface)",
              color: role === r ? (r === "citizen" ? "var(--accent)" : "var(--accent-gov)") : "var(--text-secondary)",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              fontWeight: 600, fontSize: 13,
              transition: "all 0.18s ease",
            }}
          >
            {r === "citizen" ? <User size={22} weight={role === r ? "fill" : "regular"} /> : <Buildings size={22} weight={role === r ? "fill" : "regular"} />}
            {r === "citizen" ? "Citizen" : "Government"}
          </button>
        ))}
      </div>

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
              <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--danger)", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className={`btn ${role === "citizen" ? "btn-primary" : "btn-gov"}`} disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight size={16} weight="bold" />}
            </button>
          </form>
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
      </p>
    </div>
  );
}

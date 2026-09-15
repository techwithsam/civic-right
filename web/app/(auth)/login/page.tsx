"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { Eye, EyeSlash, ArrowRight } from "@phosphor-icons/react";

export default function LoginPage() {
  const { signIn, civicUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isConfigMissing =
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "" ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "AIzaSyDummyKeyForBuildPurposeOnly000";

  const getFriendlyLoginErrorMessage = (err: unknown): string => {
    if (!err) return "Invalid email or password. Please try again.";
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string })?.code || "";

    if (code === "auth/invalid-api-key" || msg.includes("auth/invalid-api-key")) {
      return "Firebase API key is missing or invalid. Please check NEXT_PUBLIC_FIREBASE_API_KEY in web/.env.local.";
    }
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "Incorrect email or password. Please check your credentials.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many failed attempts. Please wait a few moments before trying again.";
    }
    if (code === "auth/network-request-failed") {
      return "Network connection failed. Please check your internet connection.";
    }
    return msg || "Invalid email or password. Please try again.";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isConfigMissing) {
      setError(
        "Firebase is not yet configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY to web/.env.local from your Firebase Console."
      );
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // redirect happens via root page after auth state updates
      router.replace("/");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setError(getFriendlyLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          marginBottom: 8,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--accent)", display: "flex", alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7V18H17V7L10 2Z" stroke="#031A12" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="7.5" y="12" width="5" height="6" rx="1" stroke="#031A12" strokeWidth="1.5"/>
              <circle cx="10" cy="9" r="1.5" fill="#031A12"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Civic Right
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Sign in to your account
        </p>
      </div>

      {/* Card */}
      <div className="card-bezel">
        <div className="card-bezel-inner" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label className="input-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  className="input"
                  type={showPw ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", color: "var(--text-muted)",
                    display: "flex",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px",
                color: "var(--danger)", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={16} weight="bold" />}
            </button>
          </form>
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        New citizen?{" "}
        <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          Create citizen account
        </Link>
      </p>
      <p style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
        Government officials: Sign in above with your assigned department credentials.
      </p>
    </div>
  );
}

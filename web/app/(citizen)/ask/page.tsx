"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { PaperPlaneTilt, SpinnerGap, BookOpen, ArrowSquareOut } from "@phosphor-icons/react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; organization: string; url: string }[];
}

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000";

const SUGGESTED = [
  "What does the tax reform mean for my small business?",
  "How does the new electricity tariff work?",
  "What is the government doing about flooding in Ibadan?",
  "Can NERC disconnect my electricity without notice?",
];

export default function AskPage() {
  const { civicUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't reach the AI service right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", height: "calc(100dvh - 64px - 80px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <h1 className="heading-lg" style={{ marginBottom: 4 }}>Ask about a policy</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Answers come only from official government sources. Always cited.
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {messages.length === 0 && (
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>Try asking:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => ask(s)} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", padding: "12px 16px",
                  color: "var(--text-secondary)", fontSize: 14, cursor: "pointer",
                  textAlign: "left", transition: "all 0.18s ease",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "var(--radius-lg) var(--radius-lg) 6px var(--radius-lg)" : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 6px",
              background: msg.role === "user" ? "var(--accent)" : "var(--surface)",
              color: msg.role === "user" ? "#031A12" : "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.65,
              border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>

            {/* Sources */}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ maxWidth: "85%", marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Sources
                </p>
                {msg.sources.map((src, j) => (
                  <a key={j} href={src.url || "#"} target="_blank" rel="noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)", textDecoration: "none",
                    transition: "all 0.18s ease",
                  }}>
                    <BookOpen size={14} color="var(--accent-gov)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{src.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{src.organization}</div>
                    </div>
                    {src.url && <ArrowSquareOut size={13} color="var(--text-muted)" />}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
            <SpinnerGap size={16} style={{ animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Searching official sources…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a government policy…"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-gov" disabled={loading || !input.trim()} style={{ flexShrink: 0, padding: "10px 18px" }}>
            <PaperPlaneTilt size={16} weight="fill" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

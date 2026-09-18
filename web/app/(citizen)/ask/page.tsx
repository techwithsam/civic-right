"use client";
import { useState, useRef, useEffect } from "react";
import {
  PaperPlaneTilt,
  SpinnerGap,
  BookOpen,
  ArrowSquareOut,
  Lightning,
  Buildings,
  CurrencyNgn,
  CheckCircle,
  X,
  ShieldCheck,
  CalendarBlank,
  FileText,
} from "@phosphor-icons/react";

interface SourceItem {
  id?: string;
  title: string;
  organization: string;
  url: string;
  topic?: string;
  source_type?: string;
  published_date?: string;
  last_checked?: string;
}

interface SourceDetail extends SourceItem {
  content?: string;
}

interface AssistantMessage {
  role: "assistant";
  answer: string;
  summary: string;
  what_to_do: string | string[];
  sources: SourceItem[];
}

interface UserMessage {
  role: "user";
  content: string;
}

type Message = UserMessage | AssistantMessage;

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000";

const TOPICS = [
  { id: null, label: "All Topics", icon: null },
  { id: "tax", label: "Tax Reform", icon: CurrencyNgn },
  { id: "electricity", label: "Electricity (NERC)", icon: Lightning },
  { id: "infrastructure", label: "Infrastructure", icon: Buildings },
] as const;

const SUGGESTED: { question: string; topic: string | null }[] = [
  { question: "What does the new tax reform mean for my small business?", topic: "tax" },
  { question: "How do NERC electricity tariff bands work?", topic: "electricity" },
  { question: "Can IBEDC disconnect my power without notice?", topic: "electricity" },
  { question: "How do I get a dangerous pothole on my street repaired?", topic: "infrastructure" },
  { question: "Is there VAT on food and solar energy in Nigeria?", topic: "tax" },
  { question: "What are my rights if my electricity meter is faulty?", topic: "electricity" },
];

function WhatToDoList({ items }: { items: string | string[] }) {
  const list = Array.isArray(items)
    ? items
    : items
        .split("\n")
        .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);
  return (
    <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
      {list.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
          <CheckCircle size={15} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SourceCard({
  src,
  onOpenDoc,
}: {
  src: SourceItem;
  onOpenDoc: (src: SourceItem) => void;
}) {
  return (
    <div
      onClick={() => onOpenDoc(src)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
        <BookOpen size={16} color="var(--accent-gov)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#059669",
                background: "rgba(5,150,105,0.12)",
                padding: "2px 6px",
                borderRadius: 4,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: "1px solid rgba(5,150,105,0.25)",
                flexShrink: 0,
              }}
            >
              Official
            </span>
            {src.published_date && (
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{src.published_date}</span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {src.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{src.organization}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Read Text</span>
        {src.url && (
          <a
            href={src.url}
            target="_blank"
            rel="noreferrer"
            title="Open official portal"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              borderRadius: 4,
              color: "var(--text-muted)",
              transition: "color 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowSquareOut size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

function AssistantBubble({
  msg,
  onOpenDoc,
}: {
  msg: AssistantMessage;
  onOpenDoc: (src: SourceItem) => void;
}) {
  return (
    <div style={{ maxWidth: "92%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Summary pill */}
      {msg.summary && (
        <div
          style={{
            background: "rgba(var(--accent-rgb, 34, 197, 94), 0.08)",
            border: "1px solid rgba(var(--accent-rgb, 34, 197, 94), 0.2)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-primary)",
            lineHeight: 1.55,
          }}
        >
          {msg.summary}
        </div>
      )}

      {/* Full answer */}
      {msg.answer && (
        <div
          style={{
            padding: "14px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
          }}
        >
          {msg.answer}
        </div>
      )}

      {/* What to do */}
      {msg.what_to_do &&
        (Array.isArray(msg.what_to_do) ? msg.what_to_do.length > 0 : msg.what_to_do.trim().length > 0) && (
          <div
            style={{
              padding: "12px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              What To Do
            </p>
            <WhatToDoList items={msg.what_to_do} />
          </div>
        )}

      {/* Sources */}
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Official Sources (Click to read text)
          </p>
          {msg.sources.map((src, j) => (
            <SourceCard key={j} src={src} onOpenDoc={onOpenDoc} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceModal({
  source,
  onClose,
}: {
  source: SourceItem;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SourceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDoc() {
      setLoading(true);
      try {
        if (source.id) {
          const res = await fetch(`${API_URL}/ask/sources/${source.id}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setDetail(data);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch full source document:", err);
      }
      if (isMounted) {
        setDetail({
          ...source,
          content: `### ${source.title}\n\n**Issuing Agency**: ${source.organization}\n**Topic**: ${source.topic ?? "Civic Policy"}\n**Official Link**: ${source.url}\n\nVerified official civic document indexed directly by Civic-Right.`,
        });
      }
      if (isMounted) setLoading(false);
    }

    fetchDoc().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [source]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            background: "var(--bg-elevated)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#059669",
                  background: "rgba(5,150,105,0.12)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  border: "1px solid rgba(5,150,105,0.25)",
                }}
              >
                <ShieldCheck size={13} weight="fill" />
                Official Gazette
              </span>
              {source.published_date && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  <CalendarBlank size={12} />
                  Published {source.published_date}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35 }}>
              {source.title}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{source.organization}</p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "var(--text-muted)",
              borderRadius: 6,
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", fontSize: 14, lineHeight: 1.7 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0",
                color: "var(--text-muted)",
                gap: 8,
              }}
            >
              <SpinnerGap size={18} style={{ animation: "spin 0.8s linear infinite" }} />
              Loading verified document text…
            </div>
          ) : (
            <div
              style={{
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
              }}
            >
              {detail?.content}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-elevated)",
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            Verified Nigerian Public Record
          </span>

          <div style={{ display: "flex", gap: 10 }}>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none" }}
              >
                Visit Agency Portal
                <ArrowSquareOut size={13} />
              </a>
            )}
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (question: string, topic?: string | null) => {
    if (!question.trim() || loading) return;
    const userMsg: UserMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, topic: topic ?? activeTopic ?? undefined }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          answer: data.answer ?? "",
          summary: data.summary ?? "",
          what_to_do: data.what_to_do ?? "",
          sources: data.sources ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          answer: "Sorry, I couldn't reach the AI service right now. Please try again.",
          summary: "",
          what_to_do: "",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        height: "calc(100dvh - 64px - 80px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "24px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <h1 className="heading-lg" style={{ marginBottom: 4 }}>
          Ask a Policy Question
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>
          Answers drawn exclusively from verified official Nigerian government sources.
        </p>
        {/* Topic chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TOPICS.map(({ id, label, icon: Icon }) => {
            const active = activeTopic === id;
            return (
              <button
                key={String(id)}
                onClick={() => setActiveTopic(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: active ? "rgba(34,197,94,0.12)" : "var(--surface)",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {Icon && <Icon size={12} weight="bold" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {messages.length === 0 && (
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>Try asking:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTED.filter((s) => activeTopic === null || s.topic === activeTopic || s.topic === null).map(
                (s) => (
                  <button
                    key={s.question}
                    onClick={() => ask(s.question, s.topic)}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontSize: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.18s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {s.question}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "user" ? (
              <div
                style={{
                  maxWidth: "80%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-lg) var(--radius-lg) 6px var(--radius-lg)",
                  background: "var(--accent)",
                  color: "#031A12",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {msg.content}
              </div>
            ) : (
              <AssistantBubble msg={msg} onOpenDoc={(src) => setSelectedSource(src)} />
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          style={{ display: "flex", gap: 10 }}
        >
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a government policy, tax, or service…"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-gov"
            disabled={loading || !input.trim()}
            style={{ flexShrink: 0, padding: "10px 18px" }}
          >
            <PaperPlaneTilt size={16} weight="fill" />
            Ask
          </button>
        </form>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
          Answers grounded in official Nigerian government publications only. Click any official source to read the text.
        </p>
      </div>

      {/* Modal for Reading Official Source */}
      {selectedSource && <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />}
    </div>
  );
}

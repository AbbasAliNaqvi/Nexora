import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import { Spinner } from "../../components/ui/PageShell";
import "./AIAssistant.css";

const IcSend = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IcZap = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IcDoc = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IcHealth = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const WELCOME = {
  role: "assistant",
  content: `Hey — I'm **Nexora AI**, your API co-pilot.\n\nI can help you:\n- 📄 Generate full API docs for any project\n- 🔍 Analyze API health and find issues\n- 💬 Answer any question about your APIs\n\nSelect a project above and ask me anything.`,
};

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`([^`]+)`/g,
      '<code style="font-family:var(--font-mono);font-size:.8em;background:rgba(16,185,129,.1);color:var(--brand);padding:1px 5px;border-radius:3px">$1</code>',
    )
    .replace(/\n/g, "<br/>");
}

function HealthReport({ report }) {
  const SC = (s) =>
    s >= 80 ? "var(--brand)" : s >= 50 ? "var(--amber)" : "var(--red)";
  const SV = { high: "red", medium: "amber", low: "gray" };
  return (
    <div className="health-wrap">
      <div className="health-score-row">
        <div
          className="health-circle"
          style={{ borderColor: SC(report.healthScore) }}
        >
          <span
            style={{
              color: SC(report.healthScore),
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {report.healthScore}
          </span>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              marginBottom: ".25rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--off-white)",
                textTransform: "capitalize",
              }}
            >
              {report.status}
            </span>
            <span
              className={`ui-badge ui-badge-${SV[report.status === "healthy" ? "low" : report.status === "warning" ? "medium" : "high"]}`}
            >
              {report.status}
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: ".82rem",
              color: "var(--text-2)",
              lineHeight: 1.5,
            }}
          >
            {report.summary}
          </p>
        </div>
      </div>
      {report.highlights?.length > 0 && (
        <div className="health-highlights">
          {report.highlights.map((h, i) => (
            <div key={i} className="health-highlight">
              <span className="hl-label">{h.label}</span>
              <span className="hl-val">{h.value}</span>
            </div>
          ))}
        </div>
      )}
      {report.issues?.length > 0 && (
        <div>
          <div className="health-sec-label">
            Issues ({report.issues.length})
          </div>
          {report.issues.map((issue, i) => (
            <div key={i} className="health-item">
              <span className={`ui-badge ui-badge-${SV[issue.severity]}`}>
                {issue.severity}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: ".82rem",
                    color: "var(--text-1)",
                    marginBottom: ".2rem",
                  }}
                >
                  {issue.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: ".75rem",
                    color: "var(--text-3)",
                  }}
                >
                  {issue.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {report.recommendations?.length > 0 && (
        <div>
          <div className="health-sec-label">Recommendations</div>
          {report.recommendations.map((rec, i) => (
            <div key={i} className="health-item">
              <span className={`ui-badge ui-badge-${SV[rec.priority]}`}>
                {rec.priority}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: ".82rem",
                    color: "var(--text-1)",
                    marginBottom: ".2rem",
                  }}
                >
                  {rec.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: ".75rem",
                    color: "var(--text-3)",
                  }}
                >
                  {rec.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIAssistant() {
  const [projects, setProj] = useState([]);
  const [selected, setSel] = useState("");
  const [messages, setMsgs] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoad] = useState(false);
  const [actionLoad, setActLoad] = useState("");
  const [tab, setTab] = useState("chat");
  const [docOut, setDocOut] = useState("");
  const [healthRep, setHealthRep] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      setProj(data.projects);
      if (data.projects.length > 0) setSel(data.projects[0]._id);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const history = [...messages.filter((m) => m !== WELCOME), userMsg];
    setMsgs(history);
    setInput("");
    setLoad(true);
    try {
      const { data } = await api.post("/ai/chat", {
        messages: history.map(({ role, content }) => ({ role, content })),
        projectId: selected || undefined,
      });
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoad(false);
      inputRef.current?.focus();
    }
  };

  const genDocs = async () => {
    if (!selected) return alert("Select a project first.");
    setActLoad("docs");
    setTab("docs");
    try {
      const { data } = await api.post(`/ai/generate-docs/${selected}`);
      setDocOut(data.markdown);
    } catch (err) {
      alert(err.response?.data?.message || "Doc generation failed.");
      setTab("chat");
    } finally {
      setActLoad("");
    }
  };

  const genHealth = async () => {
    if (!selected) return alert("Select a project first.");
    setActLoad("health");
    setTab("health");
    try {
      const { data } = await api.post(`/ai/analyze-health/${selected}`);
      setHealthRep(data.report);
    } catch (err) {
      alert(err.response?.data?.message || "Health analysis failed.");
      setTab("chat");
    } finally {
      setActLoad("");
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-logo">{IcZap}</div>
          <div>
            <div className="ai-header-title">AI Assistant</div>
            <div className="ai-header-sub">Groq · LLaMA 3.3 70B</div>
          </div>
        </div>
        <div className="ai-header-right">
          {projects.length > 0 && (
            <select
              className="form-input form-select ai-proj-sel"
              value={selected}
              onChange={(e) => setSel(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn-ghost ai-action-btn"
            onClick={genDocs}
            disabled={!!actionLoad}
          >
            {actionLoad === "docs" ? <Spinner size={13} /> : IcDoc} Docs
          </button>
          <button
            className="btn btn-ghost ai-action-btn"
            onClick={genHealth}
            disabled={!!actionLoad}
          >
            {actionLoad === "health" ? <Spinner size={13} /> : IcHealth} Health
          </button>
        </div>
      </div>

      <div className="ai-tabs">
        {["chat", "docs", "health"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`ai-tab ${tab === t ? "ai-tab-active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ai-body">
        {tab === "chat" && (
          <>
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                  {msg.role === "assistant" && (
                    <div className="chat-avatar">{IcZap}</div>
                  )}
                  <div
                    className="chat-bubble"
                    dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
                  />
                </div>
              ))}
              {loading && (
                <div className="chat-msg chat-msg-assistant">
                  <div className="chat-avatar">{IcZap}</div>
                  <div className="chat-bubble chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input
                ref={inputRef}
                className="form-input chat-input"
                placeholder="Ask anything about your APIs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                className="btn btn-primary chat-send"
                onClick={send}
                disabled={loading || !input.trim()}
              >
                {IcSend}
              </button>
            </div>
          </>
        )}

        {tab === "docs" && (
          <div className="ai-pane">
            {actionLoad === "docs" ? (
              <div className="ai-loading">
                <Spinner size={28} />
                <span>Generating documentation...</span>
              </div>
            ) : docOut ? (
              <pre className="doc-out">{docOut}</pre>
            ) : (
              <div className="ai-empty">
                {IcDoc}
                <p>
                  Click "Docs" above to generate API documentation for the
                  selected project.
                </p>
                <button className="btn btn-outline-brand" onClick={genDocs}>
                  Generate docs
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "health" && (
          <div className="ai-pane">
            {actionLoad === "health" ? (
              <div className="ai-loading">
                <Spinner size={28} />
                <span>Analyzing API health...</span>
              </div>
            ) : healthRep ? (
              <HealthReport report={healthRep} />
            ) : (
              <div className="ai-empty">
                {IcHealth}
                <p>
                  Click "Health" above to run an AI analysis of your API usage
                  patterns.
                </p>
                <button className="btn btn-outline-brand" onClick={genHealth}>
                  Analyze health
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

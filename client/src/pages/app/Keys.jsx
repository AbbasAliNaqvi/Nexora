import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import {
  PageShell,
  PageHeader,
  Badge,
  EmptyState,
  Modal,
  FormField,
  Input,
  Select,
  Spinner,
  Toast,
  IconBtn,
  BackLink,
} from "../../components/ui/PageShell";
import { useToast } from "../../hooks/useToast";
import "./Keys.css";

const IcKey = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);
const IcTrash = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
const IcRotate = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);
const IcCopy = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const IcCheck = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--brand)"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcWarn = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TIER_VARIANT = { free: "gray", pro: "blue", enterprise: "green" };
const TIER_LIMIT = { free: 100, pro: 10000, enterprise: Infinity };

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <IconBtn onClick={copy} title="Copy">
      {copied ? IcCheck : IcCopy}
    </IconBtn>
  );
}

function RevealModal({ rawKey, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
      >
        <div className="modal-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
              color: "#f59e0b",
            }}
          >
            {IcWarn}
            <h2 className="modal-title">Save this key now</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: ".82rem",
              color: "var(--text-2)",
              lineHeight: 1.6,
            }}
          >
            This is the only time you will see this key. Store it securely — it
            cannot be recovered.
          </p>
          <div className="reveal-box">
            <code className="reveal-key">{rawKey}</code>
            <CopyBtn text={rawKey} />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onClose}
          >
            I've saved it safely
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateKeyModal({ open, onClose, onCreate, projectId }) {
  const [form, setForm] = useState({ name: "Default Key", tier: "free" });
  const [loading, setLoad] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoad(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/keys`, form);
      onCreate(data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create key.");
    } finally {
      setLoad(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate API key">
      <form onSubmit={submit}>
        <FormField label="Key name">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </FormField>
        <FormField label="Tier">
          <Select
            value={form.tier}
            onChange={(e) => set("tier", e.target.value)}
          >
            <option value="free">Free — 100 req/day</option>
            <option value="pro">Pro — 10,000 req/day</option>
            <option value="enterprise">Enterprise — Unlimited</option>
          </Select>
        </FormField>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner size={14} dark /> Generating...
              </>
            ) : (
              "Generate key"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Keys() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loading, setLoad] = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [revealKey, setReveal] = useState(null);
  const { toasts, success, error: toastErr } = useToast();

  useEffect(() => {
    Promise.all([api.get(`/projects/${id}`), api.get(`/projects/${id}/keys`)])
      .then(([pR, kR]) => {
        setProject(pR.data.project);
        setKeys(kR.data.keys);
      })
      .catch(() => toastErr("Failed to load"))
      .finally(() => setLoad(false));
  }, [id]);

  const handleCreate = (data) => {
    setKeys((k) => [data.key, ...k]);
    setReveal(data.rawKey);
    success("Key generated!");
  };

  const handleRevoke = async (keyId) => {
    if (!confirm("Revoke this key? It will stop working immediately.")) return;
    try {
      await api.delete(`/keys/${keyId}`);
      setKeys((k) =>
        k.map((x) => (x._id === keyId ? { ...x, isActive: false } : x)),
      );
      success("Key revoked.");
    } catch {
      toastErr("Failed to revoke.");
    }
  };

  const handleRotate = async (keyId) => {
    if (!confirm("Rotate this key? The current key stops working immediately."))
      return;
    try {
      const { data } = await api.post(`/keys/${keyId}/rotate`);
      setKeys((k) => k.map((x) => (x._id === keyId ? data.key : x)));
      setReveal(data.rawKey);
      success("Key rotated!");
    } catch {
      toastErr("Failed to rotate.");
    }
  };

  return (
    <PageShell>
      <Toast toasts={toasts} />
      <BackLink to={`/projects/${id}`} label={project?.name || "Project"} />
      <PageHeader
        title="API Keys"
        subtitle={`${keys.filter((k) => k.isActive).length} active`}
        action={
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            + Generate key
          </button>
        }
      />

      {project && (
        <div className="key-hint">
          <code className="key-hint-code">X-Api-Key: nxr_live_...</code>
          <span className="key-hint-arrow">→</span>
          <span className="key-hint-path">
            /gateway/{project.slug}/your-path
          </span>
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4rem 0",
          }}
        >
          <Spinner size={28} />
        </div>
      ) : keys.length === 0 ? (
        <EmptyState
          icon={IcKey}
          title="No API keys"
          desc="Generate a key to start making authenticated requests to your gateway."
          action={
            <button className="btn btn-primary" onClick={() => setCreate(true)}>
              Generate first key
            </button>
          }
        />
      ) : (
        <div className="key-list">
          {keys.map((k) => {
            const limit = TIER_LIMIT[k.tier];
            const pct =
              limit === Infinity
                ? 0
                : Math.min((k.requestCount / limit) * 100, 100);
            const warn = pct > 80;
            return (
              <div
                key={k._id}
                className={`key-card ${!k.isActive ? "key-card-revoked" : ""}`}
              >
                <div className="key-card-top">
                  <div
                    className="key-card-icon"
                    style={{ opacity: k.isActive ? 1 : 0.35 }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </div>
                  <div className="key-card-info">
                    <div className="key-card-name-row">
                      <span className="key-card-name">{k.name}</span>
                      <Badge variant={TIER_VARIANT[k.tier]}>{k.tier}</Badge>
                      {!k.isActive && <Badge variant="red">revoked</Badge>}
                    </div>
                    <code className="key-card-prefix">{k.keyPrefix}</code>
                  </div>
                  <div className="key-card-usage">
                    <span
                      className="key-usage-num"
                      style={{ color: warn ? "var(--amber)" : "" }}
                    >
                      {k.requestCount.toLocaleString()} /{" "}
                      {limit === Infinity ? "∞" : limit.toLocaleString()}
                    </span>
                    <span className="key-usage-label">today</span>
                  </div>
                  {k.isActive && (
                    <div className="key-card-actions">
                      <CopyBtn text={k.keyPrefix} />
                      <IconBtn
                        onClick={() => handleRotate(k._id)}
                        title="Rotate"
                      >
                        {IcRotate}
                      </IconBtn>
                      <IconBtn
                        danger
                        onClick={() => handleRevoke(k._id)}
                        title="Revoke"
                      >
                        {IcTrash}
                      </IconBtn>
                    </div>
                  )}
                </div>
                {k.isActive && limit !== Infinity && (
                  <div className="key-progress-wrap">
                    <div
                      className="key-progress-bar"
                      style={{
                        width: `${pct}%`,
                        background: warn ? "var(--amber)" : "var(--brand)",
                      }}
                    />
                  </div>
                )}
                {k.lastUsedAt && (
                  <div className="key-last-used">
                    Last used: {new Date(k.lastUsedAt).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateKeyModal
        open={showCreate}
        onClose={() => setCreate(false)}
        onCreate={handleCreate}
        projectId={id}
      />
      {revealKey && (
        <RevealModal rawKey={revealKey} onClose={() => setReveal(null)} />
      )}
    </PageShell>
  );
}

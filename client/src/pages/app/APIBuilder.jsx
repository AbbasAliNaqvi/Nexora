import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../lib/api";
import {
  PageShell,
  PageHeader,
  MethodBadge,
  EmptyState,
  Modal,
  FormField,
  Input,
  Textarea,
  Select,
  Spinner,
  Toast,
  IconBtn,
  BackLink,
} from "../../components/ui/PageShell";
import { useToast } from "../../hooks/useToast";
import "./APIBuilder.css";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const BLANK = {
  method: "GET",
  path: "",
  description: "",
  mockResponse: '{\n  "message": "OK",\n  "data": null\n}',
  mockStatusCode: 200,
  tags: "",
};

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
const IcEdit = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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
const IcPlug = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M18.36 6.64a9 9 0 11-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
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

function EndpointModal({ open, onClose, initial, onSave, saving }) {
  const [form, setForm] = useState(BLANK);
  const [jsonErr, setJErr] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              ...initial,
              mockResponse: JSON.stringify(initial.mockResponse, null, 2),
              tags: (initial.tags || []).join(", "),
            }
          : BLANK,
      );
      setJErr("");
    }
  }, [open, initial]);

  const validate = (v) => {
    try {
      JSON.parse(v);
      setJErr("");
    } catch {
      setJErr("Invalid JSON");
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (jsonErr) return;
    try {
      const parsed = JSON.parse(form.mockResponse);
      onSave({
        ...form,
        mockResponse: parsed,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch {
      setJErr("Fix JSON before saving.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit endpoint" : "New endpoint"}
    >
      <form onSubmit={submit}>
        <div className="form-row">
          <FormField label="Method *">
            <Select
              value={form.method}
              onChange={(e) => set("method", e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Path *">
            <Input
              placeholder="/users/:id"
              value={form.path}
              onChange={(e) => set("path", e.target.value)}
              required
            />
          </FormField>
        </div>
        <FormField label="Description">
          <Input
            placeholder="Returns a user by ID"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FormField>
        <div className="form-row">
          <FormField label="Status code">
            <Input
              type="number"
              value={form.mockStatusCode}
              onChange={(e) => set("mockStatusCode", parseInt(e.target.value))}
              min={100}
              max={599}
            />
          </FormField>
          <FormField label="Tags">
            <Input
              placeholder="auth, users"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </FormField>
        </div>
        <FormField
          label={
            jsonErr ? `Mock response — ${jsonErr}` : "Mock response (JSON)"
          }
        >
          <Textarea
            style={{
              minHeight: 120,
              fontFamily: "var(--font-mono)",
              fontSize: ".78rem",
              borderColor: jsonErr ? "rgba(239,68,68,.4)" : "",
            }}
            value={form.mockResponse}
            onChange={(e) => {
              set("mockResponse", e.target.value);
              validate(e.target.value);
            }}
          />
        </FormField>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !!jsonErr}
          >
            {saving ? (
              <>
                <Spinner size={14} dark /> Saving...
              </>
            ) : (
              "Save endpoint"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconBtn
      title="Copy gateway URL"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? IcCheck : IcCopy}
    </IconBtn>
  );
}

export default function APIBuilder() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [endpoints, setEps] = useState([]);
  const [loading, setLoad] = useState(true);
  const [modalOpen, setModal] = useState(false);
  const [editTarget, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const { toasts, success, error: toastErr } = useToast();

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/endpoints`),
    ])
      .then(([pR, eR]) => {
        setProject(pR.data.project);
        setEps(eR.data.endpoints);
      })
      .catch(() => toastErr("Failed to load"))
      .finally(() => setLoad(false));
  }, [id]);

  const openNew = () => {
    setEdit(null);
    setModal(true);
  };
  const openEdit = (ep) => {
    setEdit(ep);
    setModal(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(
          `/endpoints/${editTarget._id}`,
          formData,
        );
        setEps((eps) =>
          eps.map((e) => (e._id === editTarget._id ? data.endpoint : e)),
        );
        success("Endpoint updated.");
      } else {
        const { data } = await api.post(`/projects/${id}/endpoints`, formData);
        setEps((eps) => [data.endpoint, ...eps]);
        success("Endpoint created.");
      }
      setModal(false);
    } catch (err) {
      toastErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (epId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this endpoint?")) return;
    try {
      await api.delete(`/endpoints/${epId}`);
      setEps((eps) => eps.filter((e) => e._id !== epId));
      success("Deleted.");
    } catch {
      toastErr("Delete failed.");
    }
  };

  const toggleActive = async (ep, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.put(`/endpoints/${ep._id}`, {
        ...ep,
        isActive: !ep.isActive,
      });
      setEps((prev) => prev.map((x) => (x._id === ep._id ? data.endpoint : x)));
    } catch {
      toastErr("Update failed.");
    }
  };

  return (
    <PageShell>
      <Toast toasts={toasts} />
      <BackLink to={`/projects/${id}`} label={project?.name || "Project"} />
      <PageHeader
        title="API Builder"
        subtitle={`${endpoints.length} endpoint${endpoints.length !== 1 ? "s" : ""} registered`}
        action={
          <button className="btn btn-primary" onClick={openNew}>
            + Add endpoint
          </button>
        }
      />

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
      ) : endpoints.length === 0 ? (
        <EmptyState
          icon={IcPlug}
          title="No endpoints yet"
          desc="Define your first endpoint and Nexora will route it through the gateway automatically."
          action={
            <button className="btn btn-primary" onClick={openNew}>
              Add first endpoint
            </button>
          }
        />
      ) : (
        <div className="ep-list">
          {endpoints.map((ep) => (
            <div
              key={ep._id}
              className={`ep-row ${expanded === ep._id ? "ep-row-open" : ""}`}
            >
              <div
                className="ep-row-head"
                onClick={() => setExpanded(expanded === ep._id ? null : ep._id)}
              >
                <MethodBadge method={ep.method} />
                <code className="ep-path">{ep.path}</code>
                <span className="ep-desc">{ep.description || "—"}</span>

                <div
                  className="ep-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CopyBtn
                    text={`${window.location.origin}/gateway/${project?.slug}${ep.path}`}
                  />
                  <button
                    className="ep-toggle"
                    onClick={(e) => toggleActive(ep, e)}
                    title={ep.isActive ? "Disable" : "Enable"}
                    style={{
                      borderColor: ep.isActive ? "var(--brand-border)" : "",
                    }}
                  >
                    <span
                      className="ep-toggle-knob"
                      style={{
                        transform: ep.isActive ? "translateX(14px)" : "none",
                        background: ep.isActive ? "var(--brand)" : "",
                      }}
                    />
                  </button>
                  <IconBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(ep);
                    }}
                    title="Edit"
                  >
                    {IcEdit}
                  </IconBtn>
                  <IconBtn
                    danger
                    onClick={(e) => handleDelete(ep._id, e)}
                    title="Delete"
                  >
                    {IcTrash}
                  </IconBtn>
                </div>

                <svg
                  className="ep-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <polyline
                    points={
                      expanded === ep._id ? "18 15 12 9 6 15" : "6 9 12 15 18 9"
                    }
                  />
                </svg>
              </div>

              {expanded === ep._id && (
                <div className="ep-detail">
                  <div className="ep-detail-row">
                    <div>
                      <div className="ep-detail-label">Gateway URL</div>
                      <code className="ep-detail-code">
                        /gateway/{project?.slug}
                        {ep.path}
                      </code>
                    </div>
                    <div>
                      <div className="ep-detail-label">Status code</div>
                      <code className="ep-detail-code">
                        {ep.mockStatusCode}
                      </code>
                    </div>
                    {ep.tags?.length > 0 && (
                      <div>
                        <div className="ep-detail-label">Tags</div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexWrap: "wrap",
                            marginTop: 4,
                          }}
                        >
                          {ep.tags.map((t) => (
                            <span key={t} className="proj-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="ep-detail-label">Mock response</div>
                    <pre className="ep-detail-json">
                      {JSON.stringify(ep.mockResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <EndpointModal
        open={modalOpen}
        onClose={() => setModal(false)}
        initial={editTarget}
        onSave={handleSave}
        saving={saving}
      />
    </PageShell>
  );
}

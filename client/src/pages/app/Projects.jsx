import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import {
  PageShell,
  PageHeader,
  EmptyState,
  Modal,
  FormField,
  Input,
  Textarea,
  Spinner,
  Toast,
} from "../../components/ui/PageShell";
import { useToast } from "../../hooks/useToast";
import "./Projects.css";

const IcFolder = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
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
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
const IcArrow = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcWrench = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
);
const IcKey = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

function CreateModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "", tags: "" });
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }
    setLoad(true);
    try {
      const { data } = await api.post("/projects", {
        name: form.name,
        description: form.description,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      });
      onCreate(data.project);
      setForm({ name: "", description: "", tags: "" });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setLoad(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={submit}>
        {error && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: ".78rem",
              color: "var(--red)",
            }}
          >
            {error}
          </div>
        )}
        <FormField label="Project name *">
          <Input
            placeholder="My Awesome API"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            placeholder="What does this API do?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FormField>
        <FormField label="Tags (comma separated)">
          <Input
            placeholder="api, v2, backend"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
        </FormField>
        <div className="form-actions" style={{ marginTop: ".5rem" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner size={14} dark /> Creating...
              </>
            ) : (
              "Create project →"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoad] = useState(true);
  const [showCreate, setCreate] = useState(false);
  const { toasts, success, error: toastErr } = useToast();

  useEffect(() => {
    api
      .get("/projects")
      .then(({ data }) => setProjects(data.projects))
      .catch(() => toastErr("Failed to load projects."))
      .finally(() => setLoad(false));
  }, []);

  const handleDelete = async (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This removes all endpoints and keys.`))
      return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((p) => p.filter((x) => x._id !== id));
      success("Project deleted.");
    } catch {
      toastErr("Failed to delete.");
    }
  };

  return (
    <PageShell>
      <Toast toasts={toasts} />
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        action={
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            + New project
          </button>
        }
      />

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "5rem 0",
          }}
        >
          <Spinner size={28} />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={IcFolder}
          title="No projects yet"
          desc="Create your first project to start building and exposing APIs."
          action={
            <button className="btn btn-primary" onClick={() => setCreate(true)}>
              Create first project
            </button>
          }
        />
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="proj-card">
              <div className="proj-card-top">
                <div className="proj-card-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <button
                  className="proj-card-del"
                  title="Delete"
                  onClick={(e) => handleDelete(p._id, p.name, e)}
                >
                  {IcTrash}
                </button>
              </div>
              <div className="proj-card-body">
                <h3 className="proj-card-name">{p.name}</h3>
                <p className="proj-card-desc">
                  {p.description || "No description"}
                </p>
              </div>
              <div className="proj-card-foot">
                <code className="proj-card-slug">/{p.slug}</code>
                <span className="proj-card-open">{IcArrow}</span>
              </div>
              <div
                className="proj-card-links"
                onClick={(e) => e.preventDefault()}
              >
                <Link to={`/projects/${p._id}/builder`} className="proj-link">
                  {IcWrench} Builder
                </Link>
                <Link to={`/projects/${p._id}/keys`} className="proj-link">
                  {IcKey} Keys
                </Link>
              </div>
              {p.tags?.length > 0 && (
                <div className="proj-card-tags">
                  {p.tags.slice(0, 3).map((t) => (
                    <span key={t} className="proj-tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
          <button
            className="proj-card proj-card-new"
            onClick={() => setCreate(true)}
          >
            <span className="proj-new-plus">+</span>
            <span className="proj-new-label">New project</span>
          </button>
        </div>
      )}

      <CreateModal
        open={showCreate}
        onClose={() => setCreate(false)}
        onCreate={(p) => setProjects((prev) => [p, ...prev])}
      />
    </PageShell>
  );
}

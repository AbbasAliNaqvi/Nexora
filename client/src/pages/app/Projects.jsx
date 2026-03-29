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
      setError("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setLoad(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create project">
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
            placeholder="Payments API"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            placeholder="What is this API for?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FormField>
        <FormField label="Tags">
          <Input
            placeholder="payments, internal, v1"
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
              "Create project"
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
    if (!confirm(`Delete "${name}"? This removes all endpoints and keys.`)) {
      return;
    }
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
        subtitle="Your API products, organized as clean workspaces."
        action={
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            New project
          </button>
        }
      />

      {loading ? (
        <div className="projects-loading">
          <Spinner size={28} />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={IcFolder}
          title="No projects yet"
          desc="Create a workspace first, then define endpoints, generate keys, and ship your API from one place."
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
                <div className="proj-card-icon">{IcFolder}</div>
                <button
                  className="proj-card-del"
                  onClick={(e) => handleDelete(p._id, p.name, e)}
                  title="Delete project"
                >
                  {IcTrash}
                </button>
              </div>

              <div className="proj-card-body">
                <div className="proj-card-name-row">
                  <h3 className="proj-card-name">{p.name}</h3>
                  <span className={`proj-status ${p.isActive ? "on" : "off"}`}>
                    {p.isActive ? "Live" : "Paused"}
                  </span>
                </div>
                <p className="proj-card-desc">
                  {p.description || "No description yet. Open the workspace to define endpoints and keys."}
                </p>
              </div>

              <div className="proj-card-meta">
                <span className="proj-card-slug">/{p.slug}</span>
                {p.tags?.length > 0 && (
                  <div className="proj-card-tags">
                    {p.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="proj-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="proj-card-actions">
                <span className="proj-link">Open workspace</span>
                <span className="proj-link">Manage API</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateModal
        open={showCreate}
        onClose={() => setCreate(false)}
        onCreate={(project) => setProjects((prev) => [project, ...prev])}
      />
    </PageShell>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../lib/api";
import {
  PageShell,
  PageHeader,
  StatCard,
  Card,
  Badge,
  Spinner,
  Toast,
  FormField,
  Input,
  Textarea,
} from "../../components/ui/PageShell";
import { useToast } from "../../hooks/useToast";
import "./ProjectWorkspace.css";

function toLocal(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectWorkspace() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [meta, setMeta] = useState({ endpointCount: 0, keyCount: 0 });
  const [endpoints, setEndpoints] = useState([]);
  const [keys, setKeys] = useState([]);
  const [usage, setUsage] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    baseUrl: "",
    databaseUri: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toasts, success, error: toastErr } = useToast();

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/endpoints`),
      api.get(`/projects/${id}/keys`),
      api.get(`/usage/project/${id}?days=7`),
    ])
      .then(([projectRes, endpointRes, keyRes, usageRes]) => {
        const nextProject = projectRes.data.project;
        setProject(nextProject);
        setMeta(projectRes.data.meta || { endpointCount: 0, keyCount: 0 });
        setEndpoints(endpointRes.data.endpoints || []);
        setKeys(keyRes.data.keys || []);
        setUsage(usageRes.data.dailyStats || []);
        setForm({
          name: nextProject.name || "",
          description: nextProject.description || "",
          baseUrl: nextProject.baseUrl || "",
          databaseUri: nextProject.databaseUri || "",
          tags: (nextProject.tags || []).join(", "),
        });
      })
      .catch(() => toastErr("Failed to load project workspace."))
      .finally(() => setLoading(false));
  }, [id]);

  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        baseUrl: form.baseUrl || null,
        databaseUri: form.databaseUri || null,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        isActive: project?.isActive ?? true,
      };
      const { data } = await api.put(`/projects/${id}`, payload);
      setProject(data.project);
      success("Project updated.");
    } catch (err) {
      toastErr(err.response?.data?.message || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const toggleProject = async () => {
    try {
      const { data } = await api.put(`/projects/${id}`, {
        name: project.name,
        description: project.description,
        baseUrl: project.baseUrl,
        databaseUri: project.databaseUri,
        tags: project.tags || [],
        isActive: !project.isActive,
      });
      setProject(data.project);
      success(data.project.isActive ? "Project resumed." : "Project paused.");
    } catch {
      toastErr("Failed to update project status.");
    }
  };

  const totalRequests = usage.reduce((sum, day) => sum + day.requests, 0);

  return (
    <PageShell>
      <Toast toasts={toasts} />
      {loading ? (
        <div className="workspace-loading">
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <PageHeader
            title={project?.name || "Project"}
            subtitle="One workspace for endpoints, keys, gateway access, and settings."
            action={
              <div className="workspace-header-actions">
                <button className="btn btn-ghost" onClick={toggleProject}>
                  {project?.isActive ? "Pause project" : "Resume project"}
                </button>
                <Link to={`/projects/${id}/builder`} className="btn btn-primary">
                  Open builder
                </Link>
              </div>
            }
          />

          <section className="workspace-hero">
            <div className="workspace-hero-main">
              <div className="workspace-title-row">
                <span className="workspace-slug">/{project.slug}</span>
                <Badge variant={project.isActive ? "green" : "gray"}>
                  {project.isActive ? "Live" : "Paused"}
                </Badge>
              </div>
              <p className="workspace-description">
                {project.description ||
                  "Add a short description so your team knows what this API is for."}
              </p>
              <div className="workspace-tags">
                {(project.tags || []).length > 0 ? (
                  project.tags.map((tag) => <span key={tag}>{tag}</span>)
                ) : (
                  <span>No tags yet</span>
                )}
              </div>
            </div>
            <div className="workspace-hero-side">
              <span className="workspace-side-label">Gateway</span>
              <code className="workspace-gateway">
                {window.location.origin}/gateway/{project.slug}
              </code>
              <p className="workspace-side-copy">
                Issue a key, hit this base path, and Nexora handles the gateway layer.
              </p>
            </div>
          </section>

          <div className="workspace-stats">
            <StatCard
              label="Endpoints"
              value={meta.endpointCount}
              sub="Active routes in this workspace"
            />
            <StatCard
              label="Keys"
              value={meta.keyCount}
              sub="Live credentials available"
            />
            <StatCard
              label="7 day traffic"
              value={totalRequests}
              sub="Gateway requests last week"
            />
            <StatCard
              label="Created"
              value={toLocal(project.createdAt)}
              sub="Workspace launch date"
            />
          </div>

          <div className="workspace-grid">
            <Card className="workspace-panel">
              <div className="workspace-panel-head">
                <div>
                  <span className="workspace-panel-label">Quick actions</span>
                  <h3 className="workspace-panel-title">Build and ship</h3>
                </div>
              </div>
              <div className="workspace-actions">
                <Link to={`/projects/${id}/builder`} className="workspace-action">
                  <span className="workspace-action-title">Manage endpoints</span>
                  <span className="workspace-action-copy">
                    Create routes, define methods, and control mock responses.
                  </span>
                </Link>
                <Link to={`/projects/${id}/keys`} className="workspace-action">
                  <span className="workspace-action-title">Manage API keys</span>
                  <span className="workspace-action-copy">
                    Generate, rotate, and revoke keys for this project.
                  </span>
                </Link>
                <Link to="/usage" className="workspace-action">
                  <span className="workspace-action-title">Inspect usage</span>
                  <span className="workspace-action-copy">
                    Review traffic, latency, and project-wide errors.
                  </span>
                </Link>
              </div>
            </Card>

            <Card className="workspace-panel">
              <div className="workspace-panel-head">
                <div>
                  <span className="workspace-panel-label">Project settings</span>
                  <h3 className="workspace-panel-title">Keep the workspace clean</h3>
                </div>
              </div>
              <form className="workspace-form" onSubmit={handleSave}>
                <FormField label="Project name">
                  <Input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </FormField>
                <FormField label="Description">
                  <Textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </FormField>
                <FormField label="Origin URL">
                  <Input
                    placeholder="https://api.example.com"
                    value={form.baseUrl}
                    onChange={(e) => setField("baseUrl", e.target.value)}
                  />
                </FormField>
                <FormField label="Database URI">
                  <Input
                    placeholder="mongodb+srv://..."
                    value={form.databaseUri}
                    onChange={(e) => setField("databaseUri", e.target.value)}
                  />
                </FormField>
                <FormField label="Tags">
                  <Input
                    placeholder="payments, internal, v1"
                    value={form.tags}
                    onChange={(e) => setField("tags", e.target.value)}
                  />
                </FormField>
                <div className="workspace-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size={14} dark /> Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            </Card>

            <Card className="workspace-panel">
              <div className="workspace-panel-head">
                <div>
                  <span className="workspace-panel-label">Endpoints</span>
                  <h3 className="workspace-panel-title">Recent routes</h3>
                </div>
                <Link to={`/projects/${id}/builder`} className="workspace-inline-link">
                  Open builder
                </Link>
              </div>
              <div className="workspace-list">
                {endpoints.length > 0 ? (
                  endpoints.slice(0, 5).map((endpoint) => (
                    <div key={endpoint._id} className="workspace-list-row">
                      <div className="workspace-list-main">
                        <span className="workspace-method">{endpoint.method}</span>
                        <code className="workspace-route">{endpoint.path}</code>
                      </div>
                      <span className="workspace-route-state">
                        {endpoint.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="workspace-empty-copy">
                    No endpoints yet. Start with the API builder.
                  </p>
                )}
              </div>
            </Card>

            <Card className="workspace-panel">
              <div className="workspace-panel-head">
                <div>
                  <span className="workspace-panel-label">Keys</span>
                  <h3 className="workspace-panel-title">Access control</h3>
                </div>
                <Link to={`/projects/${id}/keys`} className="workspace-inline-link">
                  Manage keys
                </Link>
              </div>
              <div className="workspace-list">
                {keys.length > 0 ? (
                  keys.slice(0, 5).map((key) => (
                    <div key={key._id} className="workspace-list-row">
                      <div className="workspace-list-main workspace-list-stack">
                        <span className="workspace-key-name">{key.name}</span>
                        <code className="workspace-route">{key.keyPrefix}</code>
                      </div>
                      <div className="workspace-key-meta">
                        <Badge
                          variant={
                            key.tier === "enterprise"
                              ? "green"
                              : key.tier === "pro"
                                ? "blue"
                                : "gray"
                          }
                        >
                          {key.tier}
                        </Badge>
                        {!key.isActive && <Badge variant="red">Revoked</Badge>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="workspace-empty-copy">
                    No keys generated yet. Create one to start calling the gateway.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}

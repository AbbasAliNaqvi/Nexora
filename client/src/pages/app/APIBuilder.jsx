import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
  StatCard,
  Card,
} from "../../components/ui/PageShell";
import { useToast } from "../../hooks/useToast";
import "./APIBuilder.css";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const FIELD_TYPES = ["text", "email", "password", "number", "boolean"];
const STARTERS = [
  {
    name: "Login",
    method: "POST",
    path: "/auth/login",
    description: "Authenticate a user and return an access token.",
    fields: [
      {
        key: "email",
        type: "email",
        placeholder: "user@example.com",
        defaultValue: "",
        required: true,
      },
      {
        key: "password",
        type: "password",
        placeholder: "Enter password",
        defaultValue: "",
        required: true,
      },
    ],
    mockResponse:
      '{\n  "token": "jwt_token_here",\n  "user": {\n    "id": "usr_001",\n    "email": "user@example.com"\n  }\n}',
    tags: "auth, login",
  },
  {
    name: "Register",
    method: "POST",
    path: "/auth/register",
    description: "Create a new user account.",
    fields: [
      {
        key: "name",
        type: "text",
        placeholder: "Alex Carter",
        defaultValue: "",
        required: true,
      },
      {
        key: "email",
        type: "email",
        placeholder: "user@example.com",
        defaultValue: "",
        required: true,
      },
      {
        key: "password",
        type: "password",
        placeholder: "Create password",
        defaultValue: "",
        required: true,
      },
    ],
    mockResponse:
      '{\n  "success": true,\n  "message": "Account created"\n}',
    tags: "auth, register",
  },
  {
    name: "List data",
    method: "GET",
    path: "/items",
    description: "Return a paginated collection.",
    fields: [
      {
        key: "page",
        type: "number",
        placeholder: "1",
        defaultValue: "1",
        required: false,
      },
      {
        key: "limit",
        type: "number",
        placeholder: "10",
        defaultValue: "10",
        required: false,
      },
    ],
    mockResponse:
      '{\n  "items": [],\n  "page": 1,\n  "total": 0\n}',
    tags: "collection, list",
  },
];
const RESPONSE_PRESETS = [
  {
    name: "Success",
    value: '{\n  "success": true,\n  "message": "Request completed"\n}',
  },
  {
    name: "Auth",
    value:
      '{\n  "token": "jwt_token_here",\n  "user": {\n    "id": "usr_001",\n    "email": "user@example.com"\n  }\n}',
  },
  {
    name: "List",
    value:
      '{\n  "items": [],\n  "page": 1,\n  "total": 0\n}',
  },
];

const BLANK = {
  method: "GET",
  path: "",
  description: "",
  mockResponse: '{\n  "message": "OK",\n  "data": null\n}',
  mockStatusCode: 200,
  tags: "",
  fields: [
    {
      key: "id",
      type: "text",
      placeholder: "usr_001",
      defaultValue: "",
      required: false,
    },
  ],
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

  const inferFieldType = (key, value) => {
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (key.toLowerCase().includes("email")) return "email";
    if (key.toLowerCase().includes("password")) return "password";
    return "text";
  };

  const buildFieldsFromSchema = (requestSchema) => {
    const body = requestSchema?.body || requestSchema || {};
    const existing = requestSchema?.fields;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    const entries = Object.entries(body);
    if (entries.length === 0) {
      return [
        {
          key: "id",
          type: "text",
          placeholder: "usr_001",
          defaultValue: "",
          required: false,
        },
      ];
    }
    return entries.map(([key, value]) => ({
      key,
      type: inferFieldType(key, value),
      placeholder: typeof value === "string" ? value : "",
      defaultValue: value === null || value === undefined ? "" : String(value),
      required: key.toLowerCase().includes("password") || key.toLowerCase().includes("email"),
    }));
  };

  const updateField = (index, key, value) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field,
      ),
    }));
  };

  const addField = () => {
    setForm((current) => ({
      ...current,
      fields: [
        ...current.fields,
        {
          key: "",
          type: "text",
          placeholder: "",
          defaultValue: "",
          required: false,
        },
      ],
    }));
  };

  const removeField = (index) => {
    setForm((current) => ({
      ...current,
      fields:
        current.fields.length === 1
          ? current.fields
          : current.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }));
  };

  const applyStarter = (starter) => {
    setForm((current) => ({
      ...current,
      method: starter.method,
      path: starter.path,
      description: starter.description,
      fields: starter.fields,
      mockResponse: starter.mockResponse,
      tags: starter.tags,
    }));
    setJErr("");
  };

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            ...BLANK,
            ...initial,
            mockResponse: JSON.stringify(initial.mockResponse, null, 2),
            tags: (initial.tags || []).join(", "),
            fields: buildFieldsFromSchema(initial.requestSchema),
          }
        : BLANK,
    );
    setJErr("");
  }, [open, initial]);

  const validate = (value) => {
    try {
      JSON.parse(value);
      setJErr("");
    } catch {
      setJErr("Invalid JSON");
    }
  };

  const submit = (e) => {
    e.preventDefault();
    try {
      const parsedResponse = JSON.parse(form.mockResponse);
      const fields = form.fields
        .map((field) => ({
          ...field,
          key: field.key.trim(),
          placeholder: field.placeholder.trim(),
        }))
        .filter((field) => field.key);
      const body = fields.reduce((acc, field) => {
        if (field.type === "number") {
          acc[field.key] =
            field.defaultValue === "" ? 0 : Number(field.defaultValue);
        } else if (field.type === "boolean") {
          acc[field.key] = field.defaultValue === "true";
        } else {
          acc[field.key] = field.defaultValue || field.placeholder || "";
        }
        return acc;
      }, {});
      onSave({
        method: form.method,
        path: form.path,
        description: form.description,
        mockResponse: parsedResponse,
        requestSchema: { body, fields },
        mockStatusCode: form.mockStatusCode,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    } catch {
      setJErr("Fix the JSON fields before saving.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit endpoint" : "Create endpoint"}
      className="builder-modal"
      maxWidth={1080}
    >
      <form onSubmit={submit}>
        <div className="builder-composer">
          <div className="builder-composer-main">
            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Starter</span>
                <h3 className="builder-section-title">Choose a starting point</h3>
              </div>
              <div className="builder-starter-row">
                {STARTERS.map((starter) => (
                  <button
                    key={starter.name}
                    type="button"
                    className="builder-starter-chip"
                    onClick={() => applyStarter(starter)}
                  >
                    {starter.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Route</span>
                <h3 className="builder-section-title">Define the endpoint</h3>
              </div>
              {jsonErr && <div className="builder-json-error">{jsonErr}</div>}
              <div className="form-row">
                <FormField label="Method *">
                  <Select
                    value={form.method}
                    onChange={(e) => set("method", e.target.value)}
                  >
                    {METHODS.map((method) => (
                      <option key={method}>{method}</option>
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
                    placeholder="users, auth"
                    value={form.tags}
                    onChange={(e) => set("tags", e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Inputs</span>
                <h3 className="builder-section-title">Build the request form</h3>
              </div>
              <div className="builder-field-list">
                {form.fields.map((field, index) => (
                  <div key={`${field.key}-${index}`} className="builder-field-card">
                    <div className="builder-field-grid">
                      <Input
                        placeholder="field name"
                        value={field.key}
                        onChange={(e) => updateField(index, "key", e.target.value)}
                      />
                      <Select
                        value={field.type}
                        onChange={(e) => updateField(index, "type", e.target.value)}
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Select>
                      <Input
                        placeholder="placeholder"
                        value={field.placeholder}
                        onChange={(e) =>
                          updateField(index, "placeholder", e.target.value)
                        }
                      />
                      <Input
                        placeholder="default value"
                        value={field.defaultValue}
                        onChange={(e) =>
                          updateField(index, "defaultValue", e.target.value)
                        }
                      />
                    </div>
                    <div className="builder-field-actions">
                      <label className="builder-field-check">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, "required", e.target.checked)
                          }
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        className="builder-field-remove"
                        onClick={() => removeField(index)}
                      >
                        Remove field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-ghost builder-add-field"
                onClick={addField}
              >
                Add field
              </button>
            </div>

            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Response</span>
                <h3 className="builder-section-title">Mock the output</h3>
              </div>
              <div className="builder-response-presets">
                {RESPONSE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="builder-response-chip"
                    onClick={() => {
                      set("mockResponse", preset.value);
                      validate(preset.value);
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <Textarea
                className="builder-code-field"
                value={form.mockResponse}
                onChange={(e) => {
                  set("mockResponse", e.target.value);
                  validate(e.target.value);
                }}
              />
            </div>

            <div className="form-actions builder-composer-actions">
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
          </div>

          <aside className="builder-composer-side">
            <div className="builder-preview-card">
              <span className="builder-section-kicker">Preview</span>
              <div className="builder-preview-route">
                <MethodBadge method={form.method} />
                <code>{form.path || "/your-route"}</code>
              </div>
              <p className="builder-preview-copy">
                {form.description || "Describe what this endpoint does for developers."}
              </p>
              <div className="builder-preview-meta">
                <div>
                  <span>Status</span>
                  <strong>{form.mockStatusCode}</strong>
                </div>
                <div>
                  <span>Fields</span>
                  <strong>{form.fields.filter((field) => field.key.trim()).length}</strong>
                </div>
              </div>
            </div>

            <div className="builder-preview-card">
              <span className="builder-section-kicker">Generated test form</span>
              <div className="builder-preview-fields">
                {form.fields.filter((field) => field.key.trim()).length > 0 ? (
                  form.fields
                    .filter((field) => field.key.trim())
                    .map((field) => (
                      <div key={field.key} className="builder-preview-field">
                        <span>{field.key}</span>
                        <small>{field.type}</small>
                      </div>
                    ))
                ) : (
                  <div className="builder-preview-empty">
                    Add request fields and the tester will build the form automatically.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </form>
    </Modal>
  );
}

function CopyBtn({ text, title = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconBtn
      title={title}
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

function buildCurl(project, endpoint) {
  return [
    `curl -X ${endpoint.method} \\`,
    `  "${window.location.origin}/gateway/${project.slug}${endpoint.path}" \\`,
    '  -H "Content-Type: application/json" \\',
    '  -H "X-Api-Key: nxr_live_your_key"',
  ].join("\n");
}

function getRequestExample(endpoint) {
  return endpoint.requestSchema?.body || endpoint.requestSchema || {};
}

function getRequestFields(endpoint) {
  const fields = endpoint.requestSchema?.fields;
  if (Array.isArray(fields) && fields.length > 0) return fields;
  return Object.entries(getRequestExample(endpoint)).map(([key, value]) => ({
    key,
    type: typeof value === "number" ? "number" : "text",
    placeholder: "",
    defaultValue: value === undefined || value === null ? "" : String(value),
    required: false,
  }));
}

function EndpointTester({ endpoint }) {
  const [fields, setFields] = useState(getRequestFields(endpoint));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setFields(getRequestFields(endpoint));
    setResult("");
    setError("");
    setRunning(false);
  }, [endpoint]);

  const updateField = (index, value) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, value } : field,
      ),
    );
  };

  const runTest = () => {
    setRunning(true);
    setError("");
    try {
      const missing = fields.find(
        (field) => field.required && !(field.value ?? field.defaultValue ?? ""),
      );
      if (missing) {
        throw new Error(`"${missing.key}" is required.`);
      }
      setTimeout(() => {
        setResult(JSON.stringify(endpoint.mockResponse, null, 2));
        setRunning(false);
      }, 350);
    } catch (err) {
      setError(err.message || "Unable to run the test.");
      setRunning(false);
    }
  };

  return (
    <div className="ep-test-grid">
      <div className="ep-detail-block">
        <div className="ep-detail-label">Test request</div>
        <div className="ep-test-form">
          {fields.length > 0 ? (
            fields.map((field, index) => (
              <label key={`${field.key}-${index}`} className="ep-test-field">
                <span className="ep-test-field-label">
                  {field.key}
                  {field.required ? " *" : ""}
                </span>
                {field.type === "boolean" ? (
                  <select
                    className="form-input"
                    value={field.value ?? field.defaultValue ?? "false"}
                    onChange={(e) => updateField(index, e.target.value)}
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : (
                  <input
                    className="form-input"
                    type={field.type === "number" ? "number" : field.type}
                    placeholder={field.placeholder || field.key}
                    value={field.value ?? field.defaultValue ?? ""}
                    onChange={(e) => updateField(index, e.target.value)}
                  />
                )}
              </label>
            ))
          ) : (
            <div className="ep-empty-test">No request body fields defined.</div>
          )}
        </div>
      </div>
      <div className="ep-detail-block">
        <div className="ep-curl-head">
          <div className="ep-detail-label" style={{ marginBottom: 0 }}>
            Test result
          </div>
          <button className="btn btn-primary ep-test-run" onClick={runTest} type="button">
            {running ? (
              <>
                <Spinner size={14} dark /> Running...
              </>
            ) : (
              "Run test"
            )}
          </button>
        </div>
        {error ? (
          <div className="builder-json-error">{error}</div>
        ) : (
          <pre className="ep-detail-json ep-test-output">
            {result || "Run a test to preview the mocked response for this endpoint."}
          </pre>
        )}
      </div>
    </div>
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
  const [query, setQuery] = useState("");
  const { toasts, success, error: toastErr } = useToast();

  useEffect(() => {
    Promise.all([api.get(`/projects/${id}`), api.get(`/projects/${id}/endpoints`)])
      .then(([projectRes, endpointRes]) => {
        setProject(projectRes.data.project);
        setEps(endpointRes.data.endpoints);
      })
      .catch(() => toastErr("Failed to load builder."))
      .finally(() => setLoad(false));
  }, [id]);

  const filteredEndpoints = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return endpoints;
    return endpoints.filter((endpoint) =>
      [endpoint.method, endpoint.path, endpoint.description, ...(endpoint.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [endpoints, query]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/endpoints/${editTarget._id}`, formData);
        setEps((current) =>
          current.map((endpoint) =>
            endpoint._id === editTarget._id ? data.endpoint : endpoint,
          ),
        );
        success("Endpoint updated.");
      } else {
        const { data } = await api.post(`/projects/${id}/endpoints`, formData);
        setEps((current) => [data.endpoint, ...current]);
        success("Endpoint created.");
      }
      setModal(false);
      setEdit(null);
    } catch (err) {
      toastErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (endpointId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this endpoint?")) return;
    try {
      await api.delete(`/endpoints/${endpointId}`);
      setEps((current) => current.filter((endpoint) => endpoint._id !== endpointId));
      success("Endpoint deleted.");
    } catch {
      toastErr("Delete failed.");
    }
  };

  const toggleActive = async (endpoint, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.put(`/endpoints/${endpoint._id}`, {
        ...endpoint,
        isActive: !endpoint.isActive,
      });
      setEps((current) =>
        current.map((item) => (item._id === endpoint._id ? data.endpoint : item)),
      );
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
        subtitle="Create endpoints fast, then test the mocked response before shipping."
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            Add endpoint
          </button>
        }
      />

      {loading ? (
        <div className="builder-loading">
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <div className="builder-workbench">
            <div>
              <span className="builder-panel-label">Endpoint studio</span>
              <h2 className="builder-studio-title">
                Build routes with a cleaner API workflow.
              </h2>
            </div>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              New endpoint
            </button>
          </div>

          <div className="builder-top">
            <div className="builder-stats">
              <StatCard
                label="Registered"
                value={endpoints.length}
                sub="Total endpoints in this project"
              />
              <StatCard
                label="Live"
                value={endpoints.filter((endpoint) => endpoint.isActive).length}
                sub="Enabled routes"
              />
              <StatCard
                label="Ready to test"
                value={endpoints.length}
                sub="Each route includes a mock test panel"
              />
            </div>

            <Card className="builder-panel">
              <div className="builder-panel-head">
                <div>
                  <span className="builder-panel-label">How it works</span>
                  <h3 className="builder-panel-title">Keep endpoint creation simple</h3>
                </div>
              </div>
              <div className="builder-guide">
                <div className="builder-guide-item">1. Choose method and path.</div>
                <div className="builder-guide-item">2. Add an example request body.</div>
                <div className="builder-guide-item">3. Define the mocked response and test it instantly.</div>
              </div>
            </Card>
          </div>

          <Card className="builder-toolbar">
            <div className="builder-toolbar-left">
              <span className="builder-panel-label">Search endpoints</span>
              <Input
                placeholder="Search by method, path, description, or tag"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </Card>

          {filteredEndpoints.length === 0 ? (
            <EmptyState
              icon={IcPlug}
              title={endpoints.length === 0 ? "No endpoints yet" : "No endpoints match"}
              desc={
                endpoints.length === 0
                  ? "Create your first endpoint and start testing the mocked response."
                  : "Try a different search term or create a new endpoint."
              }
              action={
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  Add endpoint
                </button>
              }
            />
          ) : (
            <div className="ep-list">
              {filteredEndpoints.map((endpoint) => (
                <div
                  key={endpoint._id}
                  className={`ep-row ${expanded === endpoint._id ? "ep-row-open" : ""}`}
                >
                  <div
                    className="ep-row-head"
                    onClick={() =>
                      setExpanded(expanded === endpoint._id ? null : endpoint._id)
                    }
                  >
                    <div className="ep-head-main">
                      <MethodBadge method={endpoint.method} />
                      <code className="ep-path">{endpoint.path}</code>
                    </div>
                    <span className="ep-desc">
                      {endpoint.description || "No description"}
                    </span>

                    <div className="ep-actions" onClick={(e) => e.stopPropagation()}>
                      <CopyBtn
                        text={`${window.location.origin}/gateway/${project?.slug}${endpoint.path}`}
                        title="Copy gateway URL"
                      />
                      <button
                        className="ep-toggle"
                        onClick={(e) => toggleActive(endpoint, e)}
                        title={endpoint.isActive ? "Disable" : "Enable"}
                        type="button"
                      >
                        <span
                          className="ep-toggle-knob"
                          style={{
                            transform: endpoint.isActive ? "translateX(18px)" : "none",
                          }}
                        />
                      </button>
                      <IconBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          setEdit(endpoint);
                          setModal(true);
                        }}
                        title="Edit"
                      >
                        {IcEdit}
                      </IconBtn>
                      <IconBtn
                        danger
                        onClick={(e) => handleDelete(endpoint._id, e)}
                        title="Delete"
                      >
                        {IcTrash}
                      </IconBtn>
                    </div>
                  </div>

                  {expanded === endpoint._id && (
                    <div className="ep-detail">
                      <div className="ep-detail-grid">
                        <div className="ep-detail-card">
                          <div className="ep-detail-label">Gateway URL</div>
                          <code className="ep-detail-code">
                            {window.location.origin}/gateway/{project?.slug}
                            {endpoint.path}
                          </code>
                        </div>
                        <div className="ep-detail-card">
                          <div className="ep-detail-label">Status code</div>
                          <code className="ep-detail-code">{endpoint.mockStatusCode}</code>
                        </div>
                        <div className="ep-detail-card">
                          <div className="ep-detail-label">Tags</div>
                          <div className="ep-tag-row">
                            {(endpoint.tags || []).length > 0 ? (
                              endpoint.tags.map((tag) => (
                                <span key={tag} className="ep-tag">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="ep-tag muted">none</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ep-detail-columns">
                        <div className="ep-detail-block">
                          <div className="ep-detail-label">Example request body</div>
                          <pre className="ep-detail-json">
                            {JSON.stringify(getRequestExample(endpoint), null, 2)}
                          </pre>
                        </div>
                        <div className="ep-detail-block">
                          <div className="ep-detail-label">Mock response</div>
                          <pre className="ep-detail-json">
                            {JSON.stringify(endpoint.mockResponse, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <EndpointTester endpoint={endpoint} />

                      <div className="ep-detail-block">
                        <div className="ep-curl-head">
                          <div className="ep-detail-label" style={{ marginBottom: 0 }}>
                            cURL preview
                          </div>
                          <CopyBtn
                            text={buildCurl(project, endpoint)}
                            title="Copy cURL command"
                          />
                        </div>
                        <pre className="ep-detail-json">{buildCurl(project, endpoint)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <EndpointModal
        open={modalOpen}
        onClose={() => {
          setModal(false);
          setEdit(null);
        }}
        initial={editTarget}
        onSave={handleSave}
        saving={saving}
      />
    </PageShell>
  );
}

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
const CRUD_OPERATIONS = [
  {
    key: "list",
    method: "GET",
    scope: "collection",
    label: "List",
    path: "/resource",
    description: "Fetch all records for this resource.",
  },
  {
    key: "create",
    method: "POST",
    scope: "collection",
    label: "Create",
    path: "/resource",
    description: "Create a new record from request body fields.",
  },
  {
    key: "read",
    method: "GET",
    scope: "item",
    label: "Get by id",
    path: "/resource/:id",
    description: "Fetch a single record by id.",
  },
  {
    key: "update",
    method: "PATCH",
    scope: "item",
    label: "Patch",
    path: "/resource/:id",
    description: "Update an existing record by id.",
  },
  {
    key: "delete",
    method: "DELETE",
    scope: "item",
    label: "Delete",
    path: "/resource/:id",
    description: "Delete a record by id.",
  },
];
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

function normalizeResourceName(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

function normalizeFieldKey(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeFieldType(value = "") {
  return FIELD_TYPES.includes(value) ? value : "text";
}

function normalizeCrudFields(fields = []) {
  return fields
    .map((field) => ({
      key: normalizeFieldKey(field.key || field.name || ""),
      type: normalizeFieldType(field.type),
      required: Boolean(field.required),
    }))
    .filter((field) => field.key);
}

function buildCrudPaths(collection, selectedOperations = CRUD_OPERATIONS.map((item) => item.key)) {
  return CRUD_OPERATIONS.filter((item) => selectedOperations.includes(item.key)).map((item) => ({
    key: item.key,
    method: item.method,
    path:
      item.scope === "collection" ? `/${collection}` : `/${collection}/:id`,
  }));
}

function createCrudPayloads(
  resourceName,
  fields,
  summary = "",
  collectionName = "",
  selectedOperations = CRUD_OPERATIONS.map((item) => item.key),
) {
  const collection = normalizeResourceName(collectionName || resourceName);
  const safeResourceName = resourceName?.trim() || collection;
  const normalizedFields = normalizeCrudFields(fields);
  const exampleBody = normalizedFields.reduce((acc, field) => {
    if (field.type === "number") acc[field.key] = 0;
    else if (field.type === "boolean") acc[field.key] = false;
    else acc[field.key] = "";
    return acc;
  }, {});

  const allPayloads = {
    list: {
      method: "GET",
      path: `/${collection}`,
      description: `List ${collection}. ${summary}`.trim(),
      mode: "crud",
      resource: { collection, fields: normalizedFields },
      requestSchema: { body: {}, fields: [] },
      mockStatusCode: 200,
      mockResponse: { success: true, data: [] },
      tags: ["crud", collection, "list"],
    },
    create: {
      method: "POST",
      path: `/${collection}`,
      description: `Create a ${safeResourceName}. ${summary}`.trim(),
      mode: "crud",
      resource: { collection, fields: normalizedFields },
      requestSchema: { body: exampleBody, fields: normalizedFields },
      mockStatusCode: 201,
      mockResponse: { success: true, data: exampleBody },
      tags: ["crud", collection, "create"],
    },
    read: {
      method: "GET",
      path: `/${collection}/:id`,
      description: `Get a single ${safeResourceName} by id.`,
      mode: "crud",
      resource: { collection, fields: normalizedFields },
      requestSchema: { body: {}, fields: [] },
      mockStatusCode: 200,
      mockResponse: { success: true, data: { _id: "id", ...exampleBody } },
      tags: ["crud", collection, "read"],
    },
    update: {
      method: "PATCH",
      path: `/${collection}/:id`,
      description: `Update a ${safeResourceName} by id.`,
      mode: "crud",
      resource: { collection, fields: normalizedFields },
      requestSchema: { body: exampleBody, fields: normalizedFields },
      mockStatusCode: 200,
      mockResponse: { success: true, data: { _id: "id", ...exampleBody } },
      tags: ["crud", collection, "update"],
    },
    delete: {
      method: "DELETE",
      path: `/${collection}/:id`,
      description: `Delete a ${safeResourceName} by id.`,
      mode: "crud",
      resource: { collection, fields: normalizedFields },
      requestSchema: { body: {}, fields: [] },
      mockStatusCode: 200,
      mockResponse: { success: true, data: { deleted: true } },
      tags: ["crud", collection, "delete"],
    },
  };

  return selectedOperations.map((key) => allPayloads[key]).filter(Boolean);
}

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
  const lines = [
    `curl -X ${endpoint.method} \\`,
    `  "${window.location.origin}/gateway/${project.slug}${endpoint.path}" \\`,
    '  -H "Content-Type: application/json" \\',
    '  -H "X-Api-Key: nxr_live_your_key"',
  ];
  const requestBody = getRequestExample(endpoint);
  if (
    ["POST", "PUT", "PATCH"].includes(endpoint.method) &&
    requestBody &&
    Object.keys(requestBody).length > 0
  ) {
    lines.push(`  -d '${JSON.stringify(requestBody, null, 2)}'`);
  }
  return lines.join("\n");
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

function EndpointTester({ endpoint, project }) {
  const [fields, setFields] = useState(getRequestFields(endpoint));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setFields(getRequestFields(endpoint));
    setResult("");
    setError("");
    setRunning(false);
    setStatus("");
  }, [endpoint]);

  useEffect(() => {
    if (!project?._id) return;
    setApiKey(localStorage.getItem(`nxr_project_key_${project._id}`) || "");
  }, [project?._id]);

  const updateField = (index, value) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, value } : field,
      ),
    );
  };

  const runTest = async () => {
    setRunning(true);
    setError("");
    setStatus("");
    try {
      const missing = fields.find(
        (field) => field.required && !(field.value ?? field.defaultValue ?? ""),
      );
      if (missing) {
        throw new Error(`"${missing.key}" is required.`);
      }

      if (!apiKey.trim()) {
        throw new Error("Add a raw API key to run a real gateway test.");
      }

      const body = fields.reduce((acc, field) => {
        const rawValue = field.value ?? field.defaultValue ?? "";
        if (rawValue === "") return acc;
        if (field.type === "number") acc[field.key] = Number(rawValue);
        else if (field.type === "boolean") acc[field.key] = rawValue === true || rawValue === "true";
        else acc[field.key] = rawValue;
        return acc;
      }, {});

      const response = await fetch(
        `${window.location.origin}/gateway/${project.slug}${endpoint.path}`,
        {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey.trim(),
          },
          body:
            ["POST", "PUT", "PATCH"].includes(endpoint.method)
              ? JSON.stringify(body)
              : undefined,
        },
      );

      const text = await response.text();
      let parsed;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }

      setStatus(`${response.status} ${response.ok ? "Success" : "Error"}`);
      setResult(JSON.stringify(parsed, null, 2));
      localStorage.setItem(`nxr_project_key_${project._id}`, apiKey.trim());
    } catch (err) {
      setError(err.message || "Unable to run the test.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="ep-test-grid">
      <div className="ep-detail-block">
        <div className="ep-detail-label">Test request</div>
        <div className="ep-test-form">
          <label className="ep-test-field">
            <span className="ep-test-field-label">API key *</span>
            <input
              className="form-input"
              type="password"
              placeholder="nxr_live_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
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
          <>
            {status ? <div className="ep-test-status">{status}</div> : null}
            <pre className="ep-detail-json ep-test-output">
              {result || "Run a test to send a real gateway request for this endpoint."}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

function CrudModal({
  open,
  onClose,
  onCreate,
  saving,
  title = "Create CRUD API",
  submitLabel = "Create CRUD API",
  initialPrompt = "",
  initialData = null,
  mode = "manual",
}) {
  const [resourceName, setResourceName] = useState("");
  const [summary, setSummary] = useState(initialPrompt);
  const [fields, setFields] = useState([
    { key: "name", type: "text", required: true },
  ]);
  const [operations, setOperations] = useState(CRUD_OPERATIONS.map((item) => item.key));

  useEffect(() => {
    if (!open) return;
    setResourceName(initialData?.resourceName || "");
    setSummary(initialData?.summary || initialPrompt);
    setFields(
      initialData?.fields?.length
        ? normalizeCrudFields(initialData.fields)
        : [{ key: "name", type: "text", required: true }],
    );
    setOperations(
      initialData?.operations?.length
        ? initialData.operations
        : CRUD_OPERATIONS.map((item) => item.key),
    );
  }, [open, initialPrompt, initialData]);

  const updateField = (index, key, value) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field,
      ),
    );
  };

  const addField = () => {
    setFields((current) => [...current, { key: "", type: "text", required: false }]);
  };

  const removeField = (index) => {
    setFields((current) =>
      current.length === 1 ? current : current.filter((_, fieldIndex) => fieldIndex !== index),
    );
  };

  const submit = (e) => {
    e.preventDefault();
    onCreate({
      resourceName,
      summary,
      fields: normalizeCrudFields(fields),
      operations,
    });
  };

  const toggleOperation = (key) => {
    setOperations((current) => {
      if (current.includes(key)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} className="builder-modal" maxWidth={920}>
      <form onSubmit={submit}>
        <div className="builder-composer">
          <div className="builder-composer-main">
            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Resource</span>
                <h3 className="builder-section-title">
                  {mode === "ai"
                    ? "Review the AI-generated CRUD API"
                    : "Create a deployed CRUD API"}
                </h3>
              </div>
              <FormField label="Resource name">
                <Input
                  placeholder="users"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Summary">
                <Input
                  placeholder="Store and manage user records"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </FormField>
            </div>

            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Operations</span>
                <h3 className="builder-section-title">Choose which CRUD routes to deploy</h3>
              </div>
              <div className="builder-op-grid">
                {CRUD_OPERATIONS.map((operation) => {
                  const active = operations.includes(operation.key);
                  return (
                    <button
                      key={operation.key}
                      type="button"
                      className={`builder-op-card ${active ? "builder-op-card-active" : ""}`}
                      onClick={() => toggleOperation(operation.key)}
                    >
                      <div className="builder-op-card-top">
                        <MethodBadge method={operation.method} />
                        <span className="builder-op-title">{operation.label}</span>
                      </div>
                      <code className="builder-op-path">
                        {operation.path.replace("resource", resourceName || "resource")}
                      </code>
                      <span className="builder-op-copy">{operation.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="builder-section">
              <div className="builder-section-head">
                <span className="builder-section-kicker">Fields</span>
                <h3 className="builder-section-title">Define the resource fields</h3>
              </div>
              <div className="builder-field-list">
                {fields.map((field, index) => (
                  <div key={`${field.key}-${index}`} className="builder-field-card">
                    <div className="builder-field-grid crud-field-grid">
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
              <button type="button" className="btn btn-ghost builder-add-field" onClick={addField}>
                Add field
              </button>
            </div>

            <div className="form-actions builder-composer-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size={14} dark /> Creating...
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </div>
          </div>

          <aside className="builder-composer-side">
            <div className="builder-preview-card">
              <span className="builder-section-kicker">Generated endpoints</span>
              <div className="builder-crud-list">
                {buildCrudPaths(resourceName || "resource", operations).map((item) => (
                  <div key={`${item.method}-${item.path}`} className="builder-preview-field">
                    <span>{`${item.method} ${item.path}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="builder-preview-card">
              <span className="builder-section-kicker">What happens</span>
              <div className="builder-crud-note">
                Nexora will deploy collection routes for this resource and connect them to your
                project database URI.
              </div>
            </div>
          </aside>
        </div>
      </form>
    </Modal>
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
  const [crudSaving, setCrudSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [crudOpen, setCrudOpen] = useState(false);
  const [aiCrudOpen, setAiCrudOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDraft, setAiDraft] = useState(null);
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

  const handleCreateCrud = async ({
    resourceName,
    summary,
    fields,
    collectionName = "",
    operations = CRUD_OPERATIONS.map((item) => item.key),
  }) => {
    if (!project?.databaseUri) {
      toastErr("Add a database URI in project settings before creating CRUD APIs.");
      return;
    }

    const safeResourceName = (resourceName || "").trim();
    const normalizedFields = normalizeCrudFields(fields);
    const collection = normalizeResourceName(collectionName || safeResourceName);

    if (!safeResourceName || !collection) {
      toastErr("Add a valid resource name before creating CRUD APIs.");
      return;
    }

    if (normalizedFields.length === 0) {
      toastErr("Add at least one valid field before creating CRUD APIs.");
      return;
    }

    if (!operations.length) {
      toastErr("Choose at least one CRUD operation.");
      return;
    }

    const nextRoutes = buildCrudPaths(collection, operations);
    const conflicts = nextRoutes.filter((route) =>
      endpoints.some(
        (endpoint) => endpoint.method === route.method && endpoint.path === route.path,
      ),
    );

    if (conflicts.length > 0) {
      toastErr(
        `These routes already exist: ${conflicts
          .map((route) => `${route.method} ${route.path}`)
          .join(", ")}`,
      );
      return;
    }

    setCrudSaving(true);
    try {
      const payloads = createCrudPayloads(
        safeResourceName,
        normalizedFields,
        summary,
        collection,
        operations,
      );
      const created = [];

      for (const payload of payloads) {
        const { data } = await api.post(`/projects/${id}/endpoints`, payload);
        created.push(data.endpoint);
      }

      setEps((current) => [...created, ...current]);
      setCrudOpen(false);
      setAiCrudOpen(false);
      setAiDraft(null);
      setAiPrompt("");
      success(`CRUD API for "${safeResourceName}" created.`);
    } catch (err) {
      let route = null;
      if (err.config?.data) {
        try {
          route = JSON.parse(err.config.data);
        } catch {
          route = null;
        }
      }
      const label = route?.method && route?.path ? `${route.method} ${route.path}` : "route";
      toastErr(err.response?.data?.message || `Failed to create ${label}.`);
    } finally {
      setCrudSaving(false);
    }
  };

  const handleCreateCrudWithAi = async () => {
    if (!aiPrompt.trim()) {
      toastErr("Describe the API you want to create.");
      return;
    }

    setCrudSaving(true);
    try {
      const { data } = await api.post("/ai/crud-plan", { prompt: aiPrompt.trim() });
      const plan = data.plan || {};
      const nextDraft = {
        resourceName: plan.resourceName || plan.collectionName || "",
        collectionName: plan.collectionName || plan.resourceName || "",
        summary: plan.summary || "",
        fields: normalizeCrudFields(plan.fields || []),
        operations: CRUD_OPERATIONS.map((item) => item.key),
      };

      if (!nextDraft.resourceName || nextDraft.fields.length === 0) {
        toastErr("AI returned an incomplete CRUD plan. Try a clearer prompt.");
        return;
      }

      setAiDraft(nextDraft);
      setAiCrudOpen(false);
      setCrudOpen(true);
      success("AI generated a CRUD draft. Review it and create the API.");
    } catch (err) {
      toastErr(err.response?.data?.message || "AI could not generate the CRUD plan.");
    } finally {
      setCrudSaving(false);
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
        subtitle="Create database-backed CRUD APIs or generate them from plain language."
      />

      {loading ? (
        <div className="builder-loading">
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <div className="builder-top builder-top-simple">
            <Card className="builder-option-card builder-option-card-primary">
              <span className="builder-panel-label">CRUD API</span>
              <h2 className="builder-studio-title">Create a resource and deploy full CRUD routes.</h2>
              <p className="builder-option-copy">
                Define the resource name and fields. Nexora creates `GET`, `POST`,
                `GET by id`, `PATCH`, and `DELETE` routes for your project.
              </p>
              <div className="builder-option-route-row">
                {CRUD_OPERATIONS.map((operation) => (
                  <span key={operation.key} className="builder-option-route">
                    {operation.method}
                  </span>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => {
                setAiDraft(null);
                setCrudOpen(true);
              }}>
                Create CRUD API
              </button>
            </Card>

            <Card className="builder-option-card">
              <span className="builder-panel-label">Create with AI</span>
              <h2 className="builder-studio-title">Describe the resource in plain language.</h2>
              <p className="builder-option-copy">
                Type what you want, let AI generate the fields, then review the CRUD draft before deployment.
              </p>
              <button className="btn btn-ghost" onClick={() => setAiCrudOpen(true)}>
                Create with AI
              </button>
            </Card>
          </div>

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
              label="Database"
              value={project?.databaseUri ? "Connected" : "Missing"}
              sub={
                project?.databaseUri
                  ? "CRUD APIs can use your MongoDB URI"
                  : "Add a database URI in project settings"
              }
            />
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
                  ? "Create your first CRUD API or generate one from AI."
                  : "Try a different search term or create a new CRUD API."
              }
              action={
                <button className="btn btn-primary" onClick={() => {
                  setAiDraft(null);
                  setCrudOpen(true);
                }}>
                  Create CRUD API
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

                      <EndpointTester endpoint={endpoint} project={project} />

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
      <CrudModal
        open={crudOpen}
        onClose={() => setCrudOpen(false)}
        onCreate={handleCreateCrud}
        saving={crudSaving}
        initialData={aiDraft}
        mode={aiDraft ? "ai" : "manual"}
      />
      <Modal
        open={aiCrudOpen}
        onClose={() => setAiCrudOpen(false)}
        title="Create CRUD API with AI"
        className="builder-modal"
        maxWidth={820}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateCrudWithAi();
          }}
        >
          <div className="builder-section">
            <div className="builder-section-head">
              <span className="builder-section-kicker">Prompt</span>
              <h3 className="builder-section-title">Describe what you need</h3>
            </div>
            <Textarea
              className="builder-code-field"
              placeholder="Example: I need a users API with name, email, age and role. Create full CRUD routes."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="builder-ai-tip">
              Example: "Create a users API with name, email, age and role. I need full CRUD."
            </div>
          </div>
          <div className="form-actions builder-composer-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setAiCrudOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={crudSaving || !aiPrompt.trim()}>
              {crudSaving ? (
                <>
                  <Spinner size={14} dark /> Generating...
                </>
              ) : (
                "Generate CRUD API"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

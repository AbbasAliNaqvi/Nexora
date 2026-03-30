import { Link } from "react-router-dom";
import "./PageShell.css";

export function PageShell({ children }) {
  return <div className="page-shell">{children}</div>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, className = "", onClick, style }) {
  return (
    <div
      className={`card ${onClick ? "card-hover" : ""} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={accent ? { color: accent } : {}}>
        {value}
      </div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export function Badge({ children, variant = "gray" }) {
  return <span className={`ui-badge ui-badge-${variant}`}>{children}</span>;
}

export function MethodBadge({ method }) {
  const m = (method || "").toUpperCase();
  const map = {
    GET: "get",
    POST: "post",
    PUT: "put",
    PATCH: "patch",
    DELETE: "delete",
  };
  return <span className={`method-badge method-${map[m] || "get"}`}>{m}</span>;
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3 className="empty-title">{title}</h3>
      {desc && <p className="empty-desc">{desc}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 20, dark = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        color: dark ? "#1c1712" : "var(--brand)",
        border: dark
          ? "2px solid rgba(28,23,18,.16)"
          : "2px solid rgba(255,255,255,.1)",
        borderTopColor: "currentColor",
        animation: "spin .6s linear infinite",
      }}
    />
  );
}

export function Modal({ open, onClose, title, children, className = "", maxWidth }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
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
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function FormField({ label, children, error }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Input(props) {
  return <input className="form-input" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="form-input form-select" {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className="form-input form-textarea" {...props} />;
}

export function Toast({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t, i) => (
        <div key={i} className={`toast toast-${t.type || "info"}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function IconBtn({ children, danger, onClick, title }) {
  return (
    <button
      className={`icon-btn ${danger ? "icon-btn-danger" : ""}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function BackLink({ to, label }) {
  const IcBack = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
  return (
    <Link to={to} className="back-link">
      {IcBack} {label}
    </Link>
  );
}

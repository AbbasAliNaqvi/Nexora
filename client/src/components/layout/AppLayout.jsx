import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";

import useAuthStore from "../../../src/store/authStore";
import useThemeStore from "../../store/themeStore";
import logo from "../../assets/Nlogo.png";
import "./AppLayout.css";

const I = {
  dashboard: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  projects: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  usage: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ai: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  theme: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 000 18 9 9 0 010-18z" />
    </svg>
  ),
  logout: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevron: (
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
  ),
};

const NAV = [
  { to: "/dashboard", label: "Overview", icon: "dashboard" },
  { to: "/projects", label: "Projects", icon: "projects" },
  { to: "/usage", label: "Usage", icon: "usage" },
  { to: "/ai", label: "AI Studio", icon: "ai" },
];

const TIER_COLOR = {
  free: "var(--text-3)",
  pro: "var(--blue)",
  enterprise: "var(--brand-dark)",
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setCollapsed(window.innerWidth < 1100);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
          <img src={logo} alt="NEXORA logo" className="logo-img-nex" />
            {!collapsed && (
              <div className="sidebar-logo-copy">
                <span className="sidebar-logo-text">NEXORA</span>
                <span className="sidebar-logo-sub">Developer platform</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            type="button"
          >
            <span
              style={{
                transform: collapsed ? "rotate(180deg)" : "none",
                display: "flex",
                transition: "transform .2s",
              }}
            >
              {I.chevron}
            </span>
          </button>
        </div>

        {!collapsed && (
          <div className="sidebar-intro">
            <span className="sidebar-intro-label">Workspace</span>
            <p className="sidebar-intro-copy">
              Build, test, and ship API products from one calm control surface.
            </p>
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <span className="sidebar-link-icon">{I[icon]}</span>
              {!collapsed && (
                <span className="sidebar-link-label">{label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
<button
  className="sidebar-link"
  onClick={toggleTheme}
  type="button"
>
  <span className="sidebar-link-icon">
    {theme === "dark" ? <FaSun /> : <FaMoon />}
  </span>

  {!collapsed && (
    <span className="sidebar-link-label">
      {theme === "dark" ? "Switch to light" : "Switch to dark"}
    </span>
  )}
</button>

          {!collapsed && user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span
                  className="sidebar-user-tier"
                  style={{ color: TIER_COLOR[user.subscription] }}
                >
                  {user.subscription}
                </span>
              </div>
            </div>
          )}
          <button
            className="sidebar-link sidebar-logout"
            onClick={() => {
              logout();
              navigate("/");
            }}
            title={collapsed ? "Log out" : undefined}
            type="button"
          >
            <span className="sidebar-link-icon">{I.logout}</span>
            {!collapsed && <span className="sidebar-link-label">Log out</span>}
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(({ to, label, icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`mobile-nav-tab ${active ? "mobile-nav-tab-active" : ""}`}
                type="button"
              >
                <span className="mobile-nav-icon">{I[icon]}</span>
                {/* <span className="mobile-nav-label">{label}</span> */}
              </button>
            );
          })}
          <button
            className="mobile-nav-tab"
            onClick={toggleTheme}
            type="button"
          >
            <span className="mobile-nav-icon">
              {theme === "dark" ? <FaMoon size={16} /> : <FaSun size={16} />}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

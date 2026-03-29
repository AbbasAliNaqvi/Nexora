import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import "./Navbar.css";

const IcHome = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IcGrid = () => (
  <svg
    width="18"
    height="18"
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
);
const IcZap = () => (
  <svg
    width="18"
    height="18"
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
const IcUser = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LANDING_TABS = [
  { id: "home", label: "Home", icon: <IcHome />, href: "/" },
  { id: "features", label: "Features", icon: <IcGrid />, href: "#features" },
  { id: "pricing", label: "Pricing", icon: <IcZap />, href: "#pricing" },
  { id: "account", label: "Account", icon: <IcUser />, href: "/login" },
];

const APP_TABS = [
  { id: "dashboard", label: "Dashboard", icon: <IcHome />, href: "/dashboard" },
  { id: "projects", label: "Projects", icon: <IcGrid />, href: "/projects" },
  { id: "ai", label: "AI", icon: <IcZap />, href: "/ai" },
  { id: "profile", label: "Profile", icon: <IcUser />, href: "/usage" },
];

export default function Navbar({ mode = "landing" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(
    mode === "landing" ? "home" : "dashboard",
  );

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (mode === "app") {
      const m = APP_TABS.find((t) => location.pathname.startsWith(t.href));
      if (m) setActiveTab(m.id);
    }
  }, [location.pathname, mode]);

  const tabs = mode === "landing" ? LANDING_TABS : APP_TABS;

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            ⚡ nexora
          </Link>

          <div className="navbar-links hide-mobile">
            {mode === "landing" ? (
              <>
                <a href="#features" className="navbar-link">
                  Features
                </a>
                <a href="#how-it-works" className="navbar-link">
                  How it works
                </a>
                <a href="#pricing" className="navbar-link">
                  Pricing
                </a>
              </>
            ) : (
              APP_TABS.map((t) => (
                <Link
                  key={t.id}
                  to={t.href}
                  className={`navbar-link ${location.pathname.startsWith(t.href) ? "active" : ""}`}
                >
                  {t.label}
                </Link>
              ))
            )}
          </div>

          <div className="navbar-actions hide-mobile">
            {token ? (
              <button
                className="btn btn-ghost navbar-btn"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost navbar-btn">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary navbar-btn">
                  Start free →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="mobile-tabbar hide-desktop">
        <div className="mobile-tabbar-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.href}
                className={`mobile-tab ${isActive ? "mobile-tab-active" : ""}`}
                onClick={(e) => {
                  if (tab.href.startsWith("/")) {
                    e.preventDefault();
                    setActiveTab(tab.id);
                    navigate(tab.href);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
              >
                <span className="mobile-tab-icon">{tab.icon}</span>
                <span className="mobile-tab-label">{tab.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import "./Navbar.css";

const APP_TABS = [
  { id: "dashboard", label: "Overview", href: "/dashboard" },
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "usage", label: "Usage", href: "/usage" },
  { id: "ai", label: "AI", href: "/ai" },
];

export default function Navbar({ mode = "landing" }) {
  const location = useLocation();
  const { token } = useAuthStore();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-mark">NX</span>
          <span className="navbar-logo-text">NEXORA</span>
        </Link>

        <div className="navbar-links hide-mobile">
          {mode === "landing" ? (
            <>
              <a href="#product" className="navbar-link">
                Product
              </a>
              <a href="#workflow" className="navbar-link">
                Workflow
              </a>
              <a href="#pricing" className="navbar-link">
                Pricing
              </a>
            </>
          ) : (
            APP_TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
                className={`navbar-link ${location.pathname.startsWith(tab.href) ? "active" : ""}`}
              >
                {tab.label}
              </Link>
            ))
          )}
        </div>

        <div className="navbar-actions hide-mobile">
          {token ? (
            <Link to="/dashboard" className="btn btn-primary navbar-btn">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost navbar-btn">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary navbar-btn">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden />
      <header className="auth-header">
        <Link to="/" className="auth-logo">
          NEXORA
        </Link>
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">!</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="form-field">
              <label className="form-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="login-pw">
                Password
              </label>
              <div className="form-input-wrap">
                <input
                  id="login-pw"
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="form-eye"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(0,0,0,.2)",
                      borderTopColor: "#000",
                      borderRadius: "50%",
                      animation: "spin .6s linear infinite",
                    }}
                  />{" "}
                  Signing in...
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <p className="auth-switch">
            No account?{" "}
            <Link to="/register" className="auth-link">
              Create one free
            </Link>
          </p>
        </div>

        <div className="auth-aside">
          <div className="auth-quote">
            <p className="auth-quote-text">
              "We went from raw Node.js service to a monetizable SaaS API in one
              afternoon."
            </p>
            <span className="auth-quote-author">
              — A developer using Nexora
            </span>
          </div>
          <div className="auth-feature-list">
            {[
              "End-to-end API key management",
              "Real-time usage analytics",
              "AI-powered documentation",
              "Groq-powered health analysis",
            ].map((f) => (
              <div key={f} className="auth-feature">
                <span className="auth-feature-check">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

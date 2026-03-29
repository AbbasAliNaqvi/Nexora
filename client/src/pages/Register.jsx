import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../src/store/authStore";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const strength = !form.password
    ? 0
    : form.password.length < 6
      ? 1
      : form.password.length < 10
        ? 2
        : 3;
  const strengthColors = ["", "#ef4444", "#f59e0b", "var(--brand-dark)"];

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
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Free plan · No credit card needed</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">!</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            {[
              { k: "name", label: "Full name", type: "text", ph: "John Doe" },
              {
                k: "email",
                label: "Email",
                type: "email",
                ph: "you@example.com",
              },
              {
                k: "password",
                label: "Password",
                type: "password",
                ph: "Min. 6 characters",
              },
            ].map(({ k, label, type, ph }) => (
              <div className="form-field" key={k}>
                <label className="form-label">{label}</label>
                <input
                  className="form-input"
                  type={type}
                  placeholder={ph}
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                  required
                />
                {k === "password" && form.password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            background:
                              i <= strength
                                ? strengthColors[strength]
                                : "var(--border-bright)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: ".68rem",
                        color: strengthColors[strength],
                      }}
                    >
                      {["", "Weak", "Good", "Strong"][strength]}
                    </span>
                  </div>
                )}
              </div>
            ))}

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
                  Creating...
                </>
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          <div className="auth-plan-pills">
            {["2 projects free", "3 API keys", "100 req/day"].map((f) => (
              <span key={f} className="auth-plan-pill">
                ✓ {f}
              </span>
            ))}
          </div>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>

        <div className="auth-aside">
          <div className="auth-quote">
            <p className="auth-quote-text">
              "Nexora gave us a complete SaaS API layer. Keys, rate limiting,
              analytics — all done."
            </p>
            <span className="auth-quote-author">— Backend developer</span>
          </div>
          <div className="auth-feature-list">
            {[
              "Live API gateway in minutes",
              "Secure hashed key storage",
              "Tier-based rate limiting",
              "Real-time usage dashboard",
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

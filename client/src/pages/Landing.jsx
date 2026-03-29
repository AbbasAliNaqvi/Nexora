import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import "./Landing.css";

const TICKER = [
  "API GATEWAY",
  "RATE LIMITING",
  "KEY ROTATION",
  "USAGE ANALYTICS",
  "AI DOCUMENTATION",
  "HEALTH ANALYSIS",
  "MOCK RESPONSES",
  "GROQ POWERED",
];

const FEATURES = [
  {
    num: "01",
    title: "API Builder",
    desc: "Define endpoints, set mock responses, and watch your API come alive. No boilerplate. No ceremony.",
    size: "large",
    visual: "builder",
  },
  {
    num: "02",
    title: "Key Management",
    desc: "Generate hashed API keys. Rotate, revoke, and tier them to Free, Pro, or Enterprise in seconds.",
    size: "small",
    visual: "key",
  },
  {
    num: "03",
    title: "Rate Limiting",
    desc: "Per-key daily quotas enforced at the gateway. Daily resets, automatic 429s, zero config.",
    size: "small",
    visual: "rate",
  },
  {
    num: "04",
    title: "AI Assistant",
    desc: "Groq-powered intelligence. Auto-generate docs, run health analysis, and get answers about your APIs.",
    size: "large",
    visual: "ai",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Define your endpoints",
    desc: "Use the API Builder to register endpoints. Set method, path, mock response, and status code.",
    code: "POST /api/projects/:id/endpoints",
  },
  {
    num: "2",
    title: "Generate an API key",
    desc: "Keys are hashed server-side and shown once. Assign tiers and per-key rate limits instantly.",
    code: "nxr_live_xxxxxxxxxxxxxxxxxxxxxxxx...",
  },
  {
    num: "3",
    title: "Hit your gateway",
    desc: "Point any client at your Nexora gateway. Track usage, errors, and latency in real time.",
    code: "X-Api-Key: nxr_live_...",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    cta: "Get started",
    href: "/register",
    features: [
      "2 projects",
      "3 API keys",
      "100 req/day",
      "Basic AI features",
      "7-day logs",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    highlight: true,
    cta: "Start free trial",
    href: "/register",
    features: [
      "10 projects",
      "20 API keys",
      "10,000 req/day",
      "Full AI suite",
      "30-day logs",
      "Key rotation",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    highlight: false,
    cta: "Contact us",
    href: "mailto:hello@nexora.dev",
    features: [
      "Unlimited projects",
      "Unlimited keys",
      "Unlimited requests",
      "Dedicated AI",
      "90-day logs",
      "Priority support",
    ],
  },
];

export default function Landing() {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const fn = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty(
        "--mx",
        `${((e.clientX - r.left) / r.width - 0.5) * 12}px`,
      );
      el.style.setProperty(
        "--my",
        `${((e.clientY - r.top) / r.height - 0.5) * 12}px`,
      );
    };
    el.addEventListener("mousemove", fn);
    return () => el.removeEventListener("mousemove", fn);
  }, []);

  return (
    <div className="landing">
      <Navbar mode="landing" />

      {/* ── HERO ── */}
      <section
        className="hero"
        ref={heroRef}
        style={{ "--mx": "0px", "--my": "0px" }}
      >
        <div className="hero-grid" aria-hidden />
        <div className="container">
          <div className="hero-badge-row">
            <span className="badge badge-green">
              <span className="dot dot-green dot-pulse" />
              Build 1.0 — Now in Beta
            </span>
          </div>

          <div className="hero-layout">
            <div className="hero-left">
              <h1 className="hero-title">NEXORA</h1>
              <div className="hero-rule" aria-hidden />
              <p className="hero-tagline">
                Turn your project into
                <br />a production&#8209;ready SaaS API.
              </p>
              <p className="hero-sub">
                Define endpoints. Generate keys. Ship to production.
                <br />
                The infrastructure layer developers have been missing.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary hero-cta">
                  Start building →
                </Link>
                <a href="#how-it-works" className="btn btn-ghost">
                  See how it works
                </a>
              </div>
            </div>

            <div className="hero-right">
              <div
                className="terminal"
                style={{
                  transform: "translate(calc(var(--mx)*.5),calc(var(--my)*.5))",
                  transition: "transform .4s var(--ease-out)",
                }}
              >
                <div className="term-bar">
                  <div className="term-dots" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="term-url">gateway.nexora.dev</span>
                </div>
                <div className="term-body">
                  <div className="term-req">
                    <span className="t-method t-get">GET</span>
                    <span className="t-path">/gateway/my-api/users</span>
                  </div>
                  <div className="t-header">
                    <span className="t-key-text">X-Api-Key:</span>
                    <span className="t-val-text"> nxr_live_aB3xK9...</span>
                  </div>
                  <div className="t-header">
                    <span className="t-key-text">Accept:</span>
                    <span className="t-val-text"> application/json</span>
                  </div>
                  <div className="term-div" />
                  <div className="term-status-row">
                    <span className="t-status">200 OK</span>
                    <span className="t-latency">· 18ms</span>
                  </div>
                  <pre className="term-json">{`{
  "users": [
    { "id": "u_01", "name": "Abbas" },
    { "id": "u_02", "name": "Das Gajraj" }
  ],
  "count": 2
}`}</pre>
                </div>
                <div className="term-footer">
                  <span className="t-key-badge">nxr_live_aB3x...</span>
                  <span className="t-usage">47 / 10,000 req today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-stats">
            {[
              ["100K+", "Daily requests"],
              ["< 20ms", "Gateway latency"],
              ["3", "Plan tiers"],
              ["6", "AI features"],
            ].map(([n, l]) => (
              <div className="hero-stat" key={l}>
                <span className="hero-stat-num">{n}</span>
                <span className="hero-stat-label">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="marquee-wrap" aria-hidden>
        <div className="marquee-track">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Features</span>
            <h2 className="section-title">
              Everything the infrastructure layer needs.
            </h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.num} className={`feat-card feat-${f.size}`}>
                <div className="feat-top">
                  <span className="feat-num">{f.num}</span>
                  {f.size === "large" && (
                    <div>
                      {f.visual === "builder" && (
                        <div className="deco-builder">
                          {[
                            ["GET", "/users", "get"],
                            ["POST", "/auth", "post"],
                            ["DELETE", "/key", "del"],
                          ].map(([m, p, c], i) => (
                            <div
                              key={i}
                              className="deco-row"
                              style={{ opacity: 1 - i * 0.25 }}
                            >
                              <span className={`deco-method ${c}`}>{m}</span>
                              <span className="deco-path">{p}</span>
                              <span className="deco-dot" />
                            </div>
                          ))}
                        </div>
                      )}
                      {f.visual === "ai" && (
                        <div className="deco-ai">
                          <div className="deco-chat deco-chat-user">
                            What are my top endpoints?
                          </div>
                          <div className="deco-chat deco-chat-ai">
                            <span className="deco-ai-pulse" />
                            Analyzing last 7 days...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="feat-title">{f.title}</h3>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="section-label">How it works</span>
            <h2 className="section-title">
              From project to SaaS in three steps.
            </h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="step-card">
                <span className="step-num">{s.num}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                <code className="step-code">{s.code}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Pricing</span>
            <h2 className="section-title">Simple, transparent pricing.</h2>
            <p className="section-sub">
              Start free. Scale when you're ready. No hidden fees.
            </p>
          </div>
          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`plan-card ${plan.highlight ? "plan-highlight" : ""}`}
              >
                {plan.highlight && (
                  <div className="plan-badge">Most popular</div>
                )}
                <div>
                  <span className="plan-name">{plan.name}</span>
                  <div className="plan-price-row">
                    <span className="plan-price">{plan.price}</span>
                    {plan.period && (
                      <span className="plan-period">{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="plan-feats">
                  {plan.features.map((f) => (
                    <li key={f} className="plan-feat">
                      <span className="plan-check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`btn plan-cta ${plan.highlight ? "btn-primary" : "btn-ghost"}`}
                >
                  {plan.cta} {plan.highlight && "→"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner">
            <p className="cta-label">Ready to ship?</p>
            <h2 className="cta-title">
              Your API is one
              <br />
              <span className="cta-title-green">commit away.</span>
            </h2>
            <Link to="/register" className="btn btn-primary cta-btn">
              Start building for free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <span className="footer-logo">⚡ nexora</span>
              <p className="footer-desc">
                The infrastructure layer for developer SaaS products.
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <span className="footer-col-title">Product</span>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#how-it-works">How it works</a>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">Account</span>
                <Link to="/login">Log in</Link>
                <Link to="/register">Register</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Nexora. All rights reserved.</span>
            <span>MongoDB · Express · React · Node.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
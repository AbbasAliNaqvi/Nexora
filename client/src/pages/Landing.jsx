import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import "./Landing.css";

const FEATURE_PANELS = [
  {
    eyebrow: "Workspace",
    title: "One project view instead of dead-end pages.",
    body: "Every API gets its own workspace with endpoints, keys, gateway access, and settings in one place.",
  },
  {
    eyebrow: "Builder",
    title: "Define routes fast.",
    body: "Create GET, POST, PUT, PATCH, and DELETE endpoints with mock responses and deployment-ready gateway paths.",
  },
  {
    eyebrow: "Access",
    title: "Issue keys cleanly.",
    body: "Generate project keys, rotate them, revoke them, and keep plan tiers visible for your team.",
  },
  {
    eyebrow: "Analytics",
    title: "Stay close to real traffic.",
    body: "Watch request volume, latency, and errors across projects without leaving the app shell.",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Create a workspace",
    copy: "Start with a project. Give it a name, description, base URL, and tags so the team knows what it owns.",
  },
  {
    step: "02",
    title: "Design your API",
    copy: "Open the builder to add routes, methods, statuses, and response payloads with a clean editing flow.",
  },
  {
    step: "03",
    title: "Ship through the gateway",
    copy: "Generate keys, hit the gateway path, and monitor usage once real traffic starts landing.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    detail: "For single developers validating an API idea.",
    items: ["2 projects", "3 API keys", "100 req/day", "Core analytics"],
  },
  {
    name: "Pro",
    price: "$29",
    detail: "For teams turning APIs into a product.",
    items: ["10 projects", "20 API keys", "10,000 req/day", "Full workspace tools"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    detail: "For companies managing multiple API surfaces.",
    items: ["Unlimited projects", "Unlimited keys", "Priority support", "Custom rollout"],
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <Navbar mode="landing" />

      <section className="hero">
        <div className="hero-noise" aria-hidden />
        <div className="container hero-wrap">
          <div className="hero-copy">
            <span className="hero-kicker">Developer-first API SaaS platform</span>
            <h1 className="hero-title">NEXORA</h1>
            <p className="hero-tagline">
              Turn one project into a real API product with a proper workspace,
              a usable builder, and clean developer UX.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Start building
              </Link>
              <Link to="/dashboard" className="btn btn-ghost">
                Preview the app
              </Link>
            </div>
          </div>

          <div className="hero-stage">
            <div className="hero-stage-window">
              <div className="hero-stage-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="hero-stage-body">
                <div className="stage-topline">
                  <span className="stage-chip">workspace</span>
                  <span className="stage-chip muted">payments-api</span>
                </div>
                <div className="stage-panel light">
                  <span className="stage-label">Project workspace</span>
                  <strong>Endpoints, keys, and settings in one view.</strong>
                </div>
                <div className="stage-grid">
                  <div className="stage-card">
                    <span className="stage-label">Gateway</span>
                    <code>/gateway/payments-api</code>
                  </div>
                  <div className="stage-card">
                    <span className="stage-label">Traffic</span>
                    <strong>12,482</strong>
                  </div>
                  <div className="stage-card full">
                    <span className="stage-label">Routes</span>
                    <div className="stage-routes">
                      <div>
                        <b>GET</b>
                        <code>/customers</code>
                      </div>
                      <div>
                        <b>POST</b>
                        <code>/payments</code>
                      </div>
                      <div>
                        <b>PATCH</b>
                        <code>/subscriptions/:id</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Product</span>
          </div>

          <div className="feature-grid">
            {FEATURE_PANELS.map((item) => (
              <article key={item.title} className="feature-card">
                <span className="feature-eyebrow">{item.eyebrow}</span>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-body">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Workflow</span>
          </div>

          <div className="workflow-grid">
            {WORKFLOW.map((item) => (
              <article key={item.step} className="workflow-card">
                <span className="workflow-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-label">Pricing</span>
          </div>

          <div className="pricing-grid">
            {PRICING.map((plan) => (
              <article
                key={plan.name}
                className={`pricing-card ${plan.featured ? "featured" : ""}`}
              >
                <div>
                  <span className="pricing-name">{plan.name}</span>
                  <div className="pricing-price">{plan.price}</div>
                  <p className="pricing-detail">{plan.detail}</p>
                </div>
                <div className="pricing-list">
                  {plan.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <Link to="/register" className="btn btn-primary pricing-btn">
                  Start with {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
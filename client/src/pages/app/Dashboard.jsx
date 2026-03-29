import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import api from "../../lib/api";
import {
  PageShell,
  PageHeader,
  StatCard,
  Card,
  EmptyState,
  Spinner,
} from "../../components/ui/PageShell";
import "./Dashboard.css";

function MiniChart({ data = [] }) {
  if (data.length < 2) {
    return <div className="chart-empty">No traffic data yet.</div>;
  }

  const W = 600;
  const H = 80;
  const p = 6;
  const max = Math.max(...data.map((d) => d.requests), 1);
  const pts = data.map((d, i) => ({
    x: p + (i / (data.length - 1)) * (W - p * 2),
    y: H - p - (d.requests / max) * (H - p * 2),
  }));
  const line = pts.map((pt) => `${pt.x},${pt.y}`).join(" ");
  const area =
    `M${pts[0].x},${H - p} ` +
    pts.map((pt) => `L${pt.x},${pt.y}`).join(" ") +
    ` L${pts[pts.length - 1].x},${H - p} Z`;
  const errPts = data.map((d, i) => ({
    x: p + (i / (data.length - 1)) * (W - p * 2),
    y:
      H -
      p -
      (d.errors / Math.max(...data.map((x) => x.errors), 1)) * (H - p * 2),
  }));
  const errLine = errPts.map((pt) => `${pt.x},${pt.y}`).join(" ");

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", height: 80 }}
    >
      <defs>
        <linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity=".2" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dashboard-area)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--brand-dark)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={errLine}
        fill="none"
        stroke="var(--red)"
        strokeWidth="1"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [overview, setOv] = useState(null);
  const [projects, setProj] = useState([]);
  const [chart, setChart] = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, pRes] = await Promise.all([
          api.get("/usage/overview"),
          api.get("/projects"),
        ]);
        setOv(ovRes.data.overview);
        setProj(pRes.data.projects.slice(0, 4));
        if (pRes.data.projects.length > 0) {
          const cRes = await api.get(
            `/usage/project/${pRes.data.projects[0]._id}?days=7`,
          );
          setChart(cRes.data.dailyStats || []);
        }
      } finally {
        setLoad(false);
      }
    };

    load();
  }, []);

  const stats = overview
    ? [
        { label: "Requests today", value: overview.totalToday, accent: "" },
        { label: "This week", value: overview.totalWeek, accent: "" },
        {
          label: "Error rate",
          value: `${overview.errorRate}%`,
          accent:
            parseFloat(overview.errorRate) > 5 ? "var(--red)" : "var(--brand-dark)",
        },
        {
          label: "Avg latency",
          value: `${overview.avgLatencyMs}ms`,
          accent: "",
        },
      ]
    : [];

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "developer"}`}
        subtitle="A clean view of your API platform, active workspaces, and traffic."
      />

      {loading ? (
        <div className="dash-loader">
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <section className="dash-hero">
            <div className="dash-hero-copy">
              <span className="dash-hero-kicker">Nexora workspace</span>
              <h2 className="dash-hero-title">
                Build APIs that developers can actually use.
              </h2>
              <p className="dash-hero-text">
                Create a project, define endpoints, issue keys, and monitor live
                traffic without bouncing between dead screens.
              </p>
              <div className="dash-hero-actions">
                <Link to="/projects" className="btn btn-primary">
                  Open projects
                </Link>
                <Link to="/usage" className="btn btn-ghost">
                  View analytics
                </Link>
              </div>
            </div>
            <div className="dash-hero-panel">
              <div className="dash-hero-terminal">
                <span className="dash-hero-label">Launch flow</span>
                <div className="dash-command">1. Create a project workspace</div>
                <div className="dash-command">2. Add endpoints in the builder</div>
                <div className="dash-command">3. Generate keys and hit the gateway</div>
              </div>
            </div>
          </section>

          <div className="stat-grid">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                accent={s.accent}
              />
            ))}
          </div>

          <div className="dash-body">
            <Card className="dash-card-large">
              <div className="chart-head">
                <div>
                  <span className="chart-label">Traffic pulse</span>
                  <h3 className="card-title">Requests in the last 7 days</h3>
                </div>
                <Link to="/usage" className="link-sm">
                  Full analytics
                </Link>
              </div>
              <MiniChart data={chart} />
              {chart.length > 1 && (
                <div className="chart-dates">
                  <span>{chart[0]?.date?.slice(5)}</span>
                  <span>{chart[chart.length - 1]?.date?.slice(5)}</span>
                </div>
              )}
            </Card>

            <div className="dash-right">
              <Card>
                <div className="section-head">
                  <div>
                    <span className="chart-label">Projects</span>
                    <h3 className="card-title">Recent workspaces</h3>
                  </div>
                  <Link to="/projects" className="link-sm">
                    See all
                  </Link>
                </div>
                {projects.length === 0 ? (
                  <EmptyState
                    title="No projects yet"
                    desc="Create your first project and make this dashboard useful."
                    action={
                      <Link to="/projects" className="btn btn-primary">
                        Create project
                      </Link>
                    }
                  />
                ) : (
                  <div className="proj-list">
                    {projects.map((p) => (
                      <Link
                        key={p._id}
                        to={`/projects/${p._id}`}
                        className="proj-row"
                      >
                        <div>
                          <span className="proj-row-name">{p.name}</span>
                          <span className="proj-row-slug">/{p.slug}</span>
                        </div>
                        <span className="proj-row-arrow">Open</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="section-head">
                  <div>
                    <span className="chart-label">Actions</span>
                    <h3 className="card-title">Next steps</h3>
                  </div>
                </div>
                <div className="quick-list">
                  {[
                    {
                      label: "Create a new project",
                      desc: "Start a fresh API workspace",
                      to: "/projects",
                    },
                    {
                      label: "Use the AI assistant",
                      desc: "Generate docs and review API health",
                      to: "/ai",
                    },
                    {
                      label: "Review traffic logs",
                      desc: "Inspect usage and errors",
                      to: "/usage",
                    },
                  ].map((a) => (
                    <Link key={a.to} to={a.to} className="quick-item">
                      <span className="quick-item-label">{a.label}</span>
                      <span className="quick-item-desc">{a.desc}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

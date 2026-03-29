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
  if (data.length < 2)
    return <div className="chart-empty">No traffic data yet.</div>;
  const W = 600,
    H = 80,
    p = 6;
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
      (d.errors / Math.max(...data.map((d) => d.errors), 1)) * (H - p * 2),
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
        <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity=".18" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dg)" />
      <polyline
        points={line}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={errLine}
        fill="none"
        stroke="#ef4444"
        strokeWidth="1"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

const IcArrow = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

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
      } catch {
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
            parseFloat(overview.errorRate) > 5 ? "var(--red)" : "var(--brand)",
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
        title={`Hey, ${user?.name?.split(" ")[0] ?? "developer"} ⚡`}
        subtitle="Here's your API platform overview"
      />

      {loading ? (
        <div className="dash-loader">
          <Spinner size={28} />
        </div>
      ) : (
        <>
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
            <Card>
              <div className="chart-head">
                <span className="chart-label">Requests — last 7 days</span>
                <Link to="/usage" className="link-sm">
                  Full analytics {IcArrow}
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
                  <span className="section-head-title">Recent projects</span>
                  <Link to="/projects" className="link-sm">
                    All {IcArrow}
                  </Link>
                </div>
                {projects.length === 0 ? (
                  <EmptyState
                    title="No projects yet"
                    desc="Create your first project"
                    action={
                      <Link
                        to="/projects"
                        className="btn btn-primary"
                        style={{ fontSize: ".8rem", padding: ".55rem 1.25rem" }}
                      >
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
                        <span className="proj-row-arrow">{IcArrow}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="section-head">
                  <span className="section-head-title">Quick actions</span>
                </div>
                <div className="quick-list">
                  {[
                    {
                      label: "New project",
                      desc: "Create an API namespace",
                      to: "/projects",
                    },
                    {
                      label: "AI Assistant",
                      desc: "Ask Nexora AI anything",
                      to: "/ai",
                    },
                    {
                      label: "View usage",
                      desc: "Full analytics breakdown",
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
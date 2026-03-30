import { useEffect, useState } from "react";
import api from "../../lib/api";
import {
  PageShell,
  PageHeader,
  Card,
  StatCard,
  MethodBadge,
  Spinner,
} from "../../components/ui/PageShell";
import "./Usage.css";

function AreaChart({ data = [] }) {
  if (!data.length)
    return (
      <div className="chart-empty">
        No traffic data yet. Hit the gateway to start.
      </div>
    );
  const totalRequests = data.reduce((sum, item) => sum + item.requests, 0);
  const totalErrors = data.reduce((sum, item) => sum + item.errors, 0);
  const peak = data.reduce(
    (best, item) => (item.requests > best.requests ? item : best),
    data[0],
  );
  const W = 640;
  const H = 210;
  const PAD_X = 22;
  const PAD_Y = 18;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2 - 28;
  const maxValue = Math.max(...data.map((d) => Math.max(d.requests, d.errors)), 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const requestPoints = data.map((d, i) => ({
    x: PAD_X + stepX * i,
    y: PAD_Y + innerH - (d.requests / maxValue) * innerH,
  }));
  const errorPoints = data.map((d, i) => ({
    x: PAD_X + stepX * i,
    y: PAD_Y + innerH - (d.errors / maxValue) * innerH,
  }));
  const area = (points) =>
    `M ${points[0].x} ${PAD_Y + innerH} ` +
    points.map((point) => `L ${point.x} ${point.y}`).join(" ") +
    ` L ${points[points.length - 1].x} ${PAD_Y + innerH} Z`;
  const line = (points) => points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div className="usage-traffic-chart">
      <div className="usage-traffic-summary">
        <div className="usage-traffic-kpi">
          <span>Requests</span>
          <strong>{totalRequests}</strong>
        </div>
        <div className="usage-traffic-kpi">
          <span>Errors</span>
          <strong>{totalErrors}</strong>
        </div>
        <div className="usage-traffic-kpi">
          <span>Peak day</span>
          <strong>{`${formatChartDate(peak.date)} · ${peak.requests}`}</strong>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id="usageLineGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity=".18" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((tick) => {
          const y = PAD_Y + innerH - innerH * tick;
          return (
            <g key={tick}>
              <line
                x1={PAD_X}
                y1={y}
                x2={W - PAD_X}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.7"
              />
              <text
                x={6}
                y={y + 4}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  fill: "var(--text-4)",
                }}
              >
                {Math.round(maxValue * tick)}
              </text>
            </g>
          );
        })}

        <path d={area(requestPoints)} fill="url(#usageLineGlow)" />
        <polyline
          points={line(requestPoints)}
          fill="none"
          stroke="var(--brand-dark)"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={line(errorPoints)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.9"
        />

        {requestPoints.map((point, index) => (
          <circle
            key={`${data[index].date}-point`}
            cx={point.x}
            cy={point.y}
            r="2.75"
            fill="var(--brand-dark)"
          />
        ))}

        {errorPoints.map((point, index) => (
          <circle
            key={`${data[index].date}-error`}
            cx={point.x}
            cy={point.y}
            r="2"
            fill="#ef4444"
          />
        ))}

        {data.map((item, index) => {
          const x = PAD_X + stepX * index;
          return (
            <text
              key={item.date}
              x={x}
              y={H - 4}
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fill: "var(--text-4)",
              }}
              >
              {formatChartDate(item.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label">
            {d._id?.method ? `${d._id.method} ${d._id.endpoint}` : d._id}
          </span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="bar-val">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data = [] }) {
  const C = {
    "2xx": "var(--brand-dark)",
    "3xx": "var(--blue)",
    "4xx": "#f59e0b",
    "5xx": "#ef4444",
  };
  const grouped = {};
  data.forEach((s) => {
    const k = String(s._id)[0] + "xx";
    grouped[k] = (grouped[k] || 0) + s.count;
  });
  const entries = Object.entries(grouped);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (!total) return <div className="chart-empty">No data</div>;
  let offset = 0;
  const R = 38,
    cx = 55,
    cy = 55;
  const p2c = (pct) => {
    const a = pct * 2 * Math.PI - Math.PI / 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  const slices = entries.map(([k, count]) => {
    const pct = count / total,
      s = { k, count, pct, offset, color: C[k] || "#555" };
    offset += pct;
    return s;
  });
  return (
    <div className="donut-wrap">
      <svg width="110" height="110" viewBox="0 0 110 110">
        {slices.map((s) => {
          const start = p2c(s.offset),
            end = p2c(s.offset + s.pct),
            lg = s.pct > 0.5 ? 1 : 0;
          return (
            <path
              key={s.k}
              d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${R} ${R} 0 ${lg} 1 ${end.x} ${end.y} Z`}
              fill={s.color}
              opacity=".85"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="22" fill="var(--bg-card)" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            fill: "var(--text-1)",
            fontWeight: 700,
          }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 11}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 7,
            fill: "var(--text-4)",
          }}
        >
          total
        </text>
      </svg>
      <div className="donut-legend">
        {slices.map((s) => (
          <div key={s.k} className="donut-item">
            <span className="donut-dot" style={{ background: s.color }} />
            <span>{s.k}</span>
            <span style={{ color: "var(--text-3)", marginLeft: "auto" }}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatChartDate(value = "") {
  const [, month = "", day = ""] = value.split("-");
  return `${month}-${day}`;
}

export default function Usage() {
  const [overview, setOv] = useState(null);
  const [projects, setProj] = useState([]);
  const [selected, setSel] = useState("");
  const [chart, setChart] = useState([]);
  const [eps, setEps] = useState([]);
  const [statuses, setStat] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoad] = useState(true);
  const [cLoad, setCLoad] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/usage/overview"), api.get("/projects")])
      .then(([ovR, pR]) => {
        setOv(ovR.data.overview);
        setProj(pR.data.projects);
        if (pR.data.projects.length > 0) setSel(pR.data.projects[0]._id);
      })
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setCLoad(true);
    Promise.all([
      api.get(`/usage/project/${selected}?days=7`),
      api.get(`/usage/logs?projectId=${selected}&limit=20`),
    ])
      .then(([uR, lR]) => {
        setChart(uR.data.dailyStats || []);
        setEps(uR.data.endpointBreakdown || []);
        setStat(uR.data.statusBreakdown || []);
        setLogs(lR.data.logs || []);
      })
      .finally(() => setCLoad(false));
  }, [selected]);

  const stats = overview
    ? [
        { label: "Today", value: overview.totalToday, accent: "" },
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
        title="Usage Analytics"
        subtitle="Gateway traffic across all projects"
      />
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4rem 0",
          }}
        >
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
            {stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                accent={s.accent}
              />
            ))}
          </div>

          {projects.length > 1 && (
            <div className="usage-proj-sel">
              <span className="usage-sel-label">Project</span>
              <select
                className="form-input form-select"
                style={{ maxWidth: 220, padding: ".45rem 2rem .45rem .8rem" }}
                value={selected}
                onChange={(e) => setSel(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {cLoad ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "3rem 0",
              }}
            >
              <Spinner size={24} />
            </div>
          ) : (
            <>
              <div className="usage-charts-row">
                <Card style={{ flex: 2 }}>
                  <div className="chart-head" style={{ marginBottom: "1rem" }}>
                    <span className="chart-label">
                      Requests & errors — 7 days
                    </span>
                    <div className="chart-legend">
                      <span className="legend-item legend-green">requests</span>
                      <span className="legend-item legend-red">errors</span>
                    </div>
                  </div>
                  <AreaChart data={chart} />
                </Card>
                <Card style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <span className="chart-label">Status codes</span>
                  </div>
                  <DonutChart data={statuses} />
                </Card>
              </div>

              {eps.length > 0 && (
                <Card style={{ marginTop: "1rem" }}>
                  <div
                    className="chart-head"
                    style={{ marginBottom: "1.25rem" }}
                  >
                    <span className="chart-label">Top endpoints</span>
                  </div>
                  <BarChart data={eps} />
                </Card>
              )}

              <Card style={{ marginTop: "1rem" }}>
                <div className="chart-head" style={{ marginBottom: "1rem" }}>
                  <span className="chart-label">Recent requests</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: ".7rem",
                      color: "var(--text-4)",
                    }}
                  >
                    {logs.length} entries
                  </span>
                </div>
                {logs.length === 0 ? (
                  <div className="chart-empty">No requests logged yet.</div>
                ) : (
                  <div className="logs-wrap">
                    <table className="logs-table">
                      <thead>
                        <tr>
                          {[
                            "Method",
                            "Endpoint",
                            "Status",
                            "Latency",
                            "Time",
                          ].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log._id}>
                            <td>
                              <MethodBadge method={log.method} />
                            </td>
                            <td>
                              <code className="log-ep">{log.endpoint}</code>
                            </td>
                            <td>
                              <span
                                className={`ui-badge ui-badge-${log.statusCode < 400 ? "green" : log.statusCode < 500 ? "amber" : "red"}`}
                              >
                                {log.statusCode}
                              </span>
                            </td>
                            <td>
                              <span className="log-ms">{log.latencyMs}ms</span>
                            </td>
                            <td>
                              <span className="log-time">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}

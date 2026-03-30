import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import useThemeStore from "./store/themeStore";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/app/Dashboard";
import Projects from "./pages/app/Projects";
import ProjectWorkspace from "./pages/app/ProjectWorkspace";
import APIBuilder from "./pages/app/APIBuilder";
import Keys from "./pages/app/Keys";
import Usage from "./pages/app/Usage";
import AIAssistant from "./pages/app/AIAssistant";

function Protected({ children }) {
  const { token, loading } = useAuthStore();
  if (loading) return <Loader />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Loader() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid rgba(255,255,255,0.1)",
          borderTopColor: "var(--brand)",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span
        style={{
          fontFamily: "DM Mono,monospace",
          fontSize: "0.72rem",
          color: "#333",
          letterSpacing: "0.12em",
        }}
      >
        NEXORA
      </span>
    </div>
  );
}

export default function App() {
  const { fetchMe, token } = useAuthStore();
  const initTheme = useThemeStore((state) => state.initTheme);
  useEffect(() => {
    if (token) fetchMe();
    else useAuthStore.setState({ loading: false });
  }, []);
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectWorkspace />} />
          <Route path="projects/:id/builder" element={<APIBuilder />} />
          <Route path="projects/:id/keys" element={<Keys />} />
          <Route path="usage" element={<Usage />} />
          <Route path="ai" element={<AIAssistant />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

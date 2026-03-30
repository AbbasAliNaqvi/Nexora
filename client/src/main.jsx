import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/globals.css";
import App from "./App.jsx";
import useThemeStore from "./store/themeStore";

useThemeStore.getState().initTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

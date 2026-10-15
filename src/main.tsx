import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { appliquerTheme } from "./ui/theme";
import "./ui/styles.css";

appliquerTheme("clair");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

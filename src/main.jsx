import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ScheduleProvider } from "./context/ScheduleContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ScheduleProvider>
      <App />
    </ScheduleProvider>
  </React.StrictMode>
);

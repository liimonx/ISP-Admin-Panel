import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// Initialize API interceptor and error handlers
import "./utils/apiInterceptor";
import { ErrorNotificationHandler } from "./utils/errorHandler";

// Initialize global error handler for uncaught errors
ErrorNotificationHandler.subscribe((error) => {
  console.error("Global API Error:", error);
  // You can add toast notifications or other error UI here
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

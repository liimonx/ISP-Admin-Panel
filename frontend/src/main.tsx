import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// Initialize security measures
import { initSecurity } from "./utils/security";

// Initialize API interceptor and error handlers
import "./utils/apiInterceptor";
import { ErrorNotificationHandler, ErrorLogger } from "./utils/errorHandler";

// Initialize security
initSecurity();

// Initialize global error handler for uncaught errors
ErrorNotificationHandler.subscribe((error) => {
  ErrorLogger.log(error);
  // You can add toast notifications or other error UI here
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

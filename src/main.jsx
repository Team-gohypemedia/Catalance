import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/shared/context/AuthContext";
import { NotificationProvider } from "@/shared/context/NotificationContext";
import ScrollToTop from "@/components/common/ScrollToTop";

import "./font.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <NotificationProvider>
          <App />
          <Toaster richColors position="bottom-right" />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

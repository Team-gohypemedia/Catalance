import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/shared/context/AuthContext";
import { NotificationProvider } from "@/shared/context/NotificationContext";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ScrollToTop from "@/components/common/ScrollToTop";

import "./font.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider defaultTheme="system" storageKey="catalance-theme">
            <App />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

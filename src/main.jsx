import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/shared/context/AuthContext";
import { NotificationProvider } from "@/shared/context/NotificationContext";
import ScrollToTop from "@/components/common/ScrollToTop";

import "./font.css";

const RootApp = () => (
  <>
    <ScrollToTop />
    <AuthProvider>
      <NotificationProvider>
        <App />
        <Toaster richColors position="top-right" />
      </NotificationProvider>
    </AuthProvider>
  </>
);

const router = createBrowserRouter([
  {
    path: "*",
    element: <RootApp />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

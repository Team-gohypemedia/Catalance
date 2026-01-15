import PropTypes from "prop-types";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/shared/context/AuthContext";
import AdminRoute from "@/components/features/auth/AdminRoute";
import CataButton from "@/components/common/CataButton";

const Home = lazy(() => import("@/components/pages/Home"));
const About = lazy(() => import("@/components/sections/home/About.jsx"));
const Services = lazy(() => import("@/components/sections/home/Services.jsx"));
const Contact = lazy(() => import("@/components/sections/home/Contact.jsx"));
const Client = lazy(() => import("@/components/features/client/Client.jsx"));
const ClientDashboard = lazy(() => import("@/components/features/client/ClientDashboard.jsx"));
const ClientProposal = lazy(() => import("@/components/features/client/ClientProposal.jsx"));
const ProposalDrafts = lazy(() => import("@/components/features/client/ProposalDrafts.jsx"));
const ClientProjects = lazy(() => import("@/components/features/client/ClientProjects.jsx"));
const ClientProjectDetail = lazy(() => import("@/components/features/client/ClientProjectDetail.jsx"));
const ClientChat = lazy(() => import("@/components/features/client/ClientChat.jsx"));
const AIChat = lazy(() => import("@/components/features/ai/AIChat.jsx"));
const ClientProfile = lazy(() => import("@/components/features/client/ClientProfile.jsx"));
const ProjectManagerDashboard = lazy(() =>
  import("@/components/features/project-manager/ProjectManagerDashboard")
);
const ManagerAvailability = lazy(() =>
  import("@/components/features/project-manager/ManagerAvailability")
);
const ManagerAppointments = lazy(() =>
  import("@/components/features/project-manager/ManagerAppointments")
);
const ManagerProjects = lazy(() =>
  import("@/components/features/project-manager/ManagerProjects")
);
const ManagerProjectDetail = lazy(() =>
  import("@/components/features/project-manager/ManagerProjectDetail")
);
const ManagerChat = lazy(() => import("@/components/features/project-manager/ManagerChat"));
const ManagerProfile = lazy(() =>
  import("@/components/features/project-manager/ManagerProfile")
);
const SignupPage = lazy(() => import("@/components/features/auth/forms/Signup"));
const LoginPage = lazy(() => import("@/components/features/auth/forms/Login"));
const ForgotPasswordPage = lazy(() =>
  import("@/components/features/auth/forms/ForgotPassword")
);
const ResetPasswordPage = lazy(() =>
  import("@/components/features/auth/forms/ResetPassword")
);
const PMLogin = lazy(() => import("@/components/features/project-manager/PMLogin"));
const FreelancerDashboard = lazy(() =>
  import("@/components/features/freelancer/FreelancerDashboard")
);
const FreelancerProposal = lazy(() =>
  import("@/components/features/freelancer/FreelancerProposal")
);
const FreelancerProfile = lazy(() =>
  import("@/components/features/freelancer/FreelancerProfile")
);
const FreelancerProjects = lazy(() =>
  import("@/components/features/freelancer/FreelancerProjects")
);
const FreelancerProjectDetail = lazy(() =>
  import("@/components/features/freelancer/FreelancerProjectDetail")
);
const FreelancerChat = lazy(() => import("@/components/features/freelancer/FreelancerChat"));
const FreelancerMultiStepForm = lazy(() =>
  import("@/components/features/freelancer/multi-step-form")
);
const NotepadPage = lazy(() => import("@/components/pages/notepad-page"));
const AdminDashboard = lazy(() => import("@/components/features/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/components/features/admin/AdminUsers"));
const AdminProjects = lazy(() => import("@/components/features/admin/AdminProjects"));
const AdminProjectDetail = lazy(() =>
  import("@/components/features/admin/AdminProjectDetail")
);
const AdminDisputes = lazy(() => import("@/components/features/admin/AdminDisputes"));
const AdminLogin = lazy(() => import("@/components/features/admin/AdminLogin"));
const AdminApprovals = lazy(() => import("@/components/features/admin/AdminApprovals"));
const AdminUserDetails = lazy(() => import("@/components/features/admin/AdminUserDetails"));



const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <span className="loading loading-spinner text-primary" />
  </div>
);

const App = () => {
  return (
    <main>
      <ThemeProvider defaultTheme="dark" storageKey="freelancer-ui-theme-v1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <LayoutWithNavbar>
                  <Home />
                </LayoutWithNavbar>
              }
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/about"
              element={
                <LayoutWithNavbar>
                  <About />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/services"
              element={
                <LayoutWithNavbar>
                  <Services />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/contact"
              element={
                <LayoutWithNavbar>
                  <Contact />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/login"
              element={
                <LayoutWithNavbar>
                  <LoginPage />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <LayoutWithNavbar>
                  <ForgotPasswordPage />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/reset-password"
              element={
                <LayoutWithNavbar>
                  <ResetPasswordPage />
                </LayoutWithNavbar>
              }
            />
            <Route path="/project-manager/login" element={<PMLogin />} />
            <Route
              path="/client"
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/ai-chat"
              element={
                <ProtectedRoute>
                  <AIChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/project"
              element={
                <ProtectedRoute>
                  <ClientProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/project/:projectId"
              element={
                <ProtectedRoute>
                  <ClientProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/proposal"
              element={
                <ProtectedRoute>
                  <ClientProposal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/proposal/drafts"
              element={
                <ProtectedRoute>
                  <ProposalDrafts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/messages"
              element={
                <ProtectedRoute>
                  <ClientChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute>
                  <ClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ProjectManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/availability"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ManagerAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/appointments"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ManagerAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/projects"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ManagerProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/projects/:projectId"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ManagerProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/messages"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ManagerChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/profile"
              element={
                <ProtectedRoute loginPath="/project-manager/login">
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service"
              element={
                <LayoutWithNavbar>
                  <Client />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/freelancer"
              element={
                <ProtectedRoute>
                  <FreelancerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/proposals"
              element={
                <ProtectedRoute>
                  <FreelancerProposal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/proposals/received"
              element={
                <ProtectedRoute>
                  <FreelancerProposal filter="received" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/proposals/accepted"
              element={
                <ProtectedRoute>
                  <FreelancerProposal filter="accepted" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/project"
              element={
                <ProtectedRoute>
                  <FreelancerProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/project/:projectId"
              element={
                <ProtectedRoute>
                  <FreelancerProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/messages"
              element={
                <ProtectedRoute>
                  <FreelancerChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/onboarding"
              element={
                <LayoutWithNavbar>
                  <FreelancerMultiStepForm />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/freelancer/profile"
              element={
                <ProtectedRoute>
                  <FreelancerProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/notepad" element={<NotepadPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <AdminRoute>
                  <AdminUsers roleFilter="CLIENT" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/freelancers"
              element={
                <AdminRoute>
                  <AdminUsers roleFilter="FREELANCER" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/project-managers"
              element={
                <AdminRoute>
                  <AdminDisputes />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <AdminRoute>
                  <AdminProjects />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <AdminRoute>
                  <AdminUserDetails />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/projects/:id"
              element={
                <AdminRoute>
                  <AdminProjectDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <AdminRoute>
                  <AdminApprovals />
                </AdminRoute>
              }
            />
            <Route
              path="*"
              element={
                <LayoutWithNavbar>
                  <NotFound />
                </LayoutWithNavbar>
              }
            />
          </Routes>
        </Suspense>
        <CataButton />
      </ThemeProvider>
    </main>
  );
};

const LayoutWithNavbar = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

LayoutWithNavbar.propTypes = {
  children: PropTypes.node.isRequired,
};

const ProtectedRoute = ({ children, loginPath = "/login" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  loginPath: PropTypes.string,
};

const NotFound = () => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
    <p className="text-sm uppercase tracking-[0.3em] text-emerald-400/80">
      404
    </p>
    <h1 className="text-3xl md:text-4xl font-light">Page not found</h1>
    <p className="text-emerald-50/70 max-w-md">
      The route you are looking for doesn&apos;t exist. Use the main navigation
      to head back home.
    </p>
  </main>
);

export default App;

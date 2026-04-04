import PropTypes from "prop-types";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/shared/context/AuthContext";
import AdminRoute from "@/components/features/auth/AdminRoute";
import CataButton from "@/components/common/CataButton";

const Home = lazy(() => import("@/pages/Home.jsx"));
const Marketplace = lazy(() => import("@/components/pages/Marketplace"));
const About = lazy(() => import("@/components/sections/home/About.jsx"));
const Contact = lazy(() => import("@/components/sections/home/Contact.jsx"));
const ClientDashboard = lazy(
  () => import("@/pages/client/ClientDashboard.jsx"),
);
const ClientProposal = lazy(
  () => import("@/components/features/client/ClientProposal.jsx"),
);
const ProposalDrafts = lazy(
  () => import("@/components/features/client/ProposalDrafts.jsx"),
);
const ClientProjects = lazy(
  () => import("@/components/features/client/ClientProjects.jsx"),
);
const ClientProjectDetail = lazy(
  () => import("@/components/pages/ClientProjectDetailPage.jsx"),
);
const ClientChat = lazy(
  () => import("@/components/features/client/ClientChat.jsx"),
);
const AIChat = lazy(() => import("@/components/features/ai/AIChat.jsx"));
const ClientProfile = lazy(
  () => import("@/components/features/client/ClientProfile.jsx"),
);
const ClientPayments = lazy(
  () => import("@/components/features/client/ClientPayments.jsx"),
);
const ProjectManagerDashboard = lazy(
  () => import("@/modules/project-manager/pages/DashboardPage"),
);
const ManagerAvailability = lazy(
  () => import("@/modules/project-manager/pages/CalendarPage"),
);
const ManagerAppointments = lazy(
  () => import("@/modules/project-manager/pages/CalendarPage"),
);
const ManagerProjects = lazy(
  () => import("@/modules/project-manager/pages/ProjectsPage"),
);
const ManagerProjectDetail = lazy(
  () => import("@/modules/project-manager/pages/ProjectDetailsPage"),
);
const ManagerChat = lazy(
  () => import("@/modules/project-manager/pages/MessagesPage"),
);
const ManagerProfile = lazy(
  () => import("@/modules/project-manager/pages/ProfessionalProfilePage"),
);
const ManagerMarketplace = lazy(
  () => import("@/modules/project-manager/pages/MarketplacePage"),
);
const ManagerReports = lazy(
  () => import("@/modules/project-manager/pages/ReportsPage"),
);
const ManagerProjectSetup = lazy(
  () => import("@/modules/project-manager/pages/ProjectSetupPage"),
);
const SignupPage = lazy(
  () => import("@/components/features/auth/forms/Signup"),
);
const LoginPage = lazy(() => import("@/components/features/auth/forms/Login"));
const ForgotPasswordPage = lazy(
  () => import("@/components/features/auth/forms/ForgotPassword"),
);
const ResetPasswordPage = lazy(
  () => import("@/components/features/auth/forms/ResetPassword"),
);
const PMLogin = lazy(
  () => import("@/components/features/project-manager/PMLogin"),
);
const FreelancerDashboard = lazy(
  () => import("@/pages/freelancer/FreelancerDashboard.jsx"),
);
const FreelancerProposal = lazy(
  () => import("@/components/features/freelancer/FreelancerProposal"),
);
const FreelancerProfile = lazy(
  () => import("@/components/features/freelancer/FreelancerProfile"),
);
const FreelancerProjects = lazy(
  () => import("@/components/features/freelancer/FreelancerProjects"),
);
const FreelancerProjectDetail = lazy(
  () => import("@/components/pages/FreelancerProjectDetailPage.jsx"),
);
const FreelancerChat = lazy(
  () => import("@/components/features/freelancer/FreelancerChat"),
);
const FreelancerPayments = lazy(
  () => import("@/components/features/freelancer/FreelancerPayments"),
);
const FreelancerMultiStepForm = lazy(
  () => import("@/components/features/freelancer/onboarding"),
);
const NotepadPage = lazy(() => import("@/components/pages/notepad-page"));
const AdminDashboard = lazy(
  () => import("@/components/features/admin/AdminDashboard"),
);
const AdminUsers = lazy(() => import("@/components/features/admin/AdminUsers"));
const AdminProjects = lazy(
  () => import("@/components/features/admin/AdminProjects"),
);
const AdminProjectDetail = lazy(
  () => import("@/components/features/admin/AdminProjectDetail"),
);
const AdminDisputes = lazy(
  () => import("@/components/features/admin/AdminDisputes"),
);
const AdminLogin = lazy(() => import("@/components/features/admin/AdminLogin"));
const AdminApprovals = lazy(
  () => import("@/components/features/admin/AdminApprovals"),
);
const AdminUserDetails = lazy(
  () => import("@/components/features/admin/AdminUserDetails"),
);
const AdminServices = lazy(
  () => import("@/components/features/admin/AdminServices"),
);
const AdminServiceQuestions = lazy(
  () => import("@/components/features/admin/AdminServiceQuestions"),
);
const GetStarted = lazy(() => import("@/components/features/auth/GetStarted"));
const BrowseTalent = lazy(() => import("@/components/pages/BrowseTalent"));
const EnterpriseSolutions = lazy(
  () => import("@/components/pages/EnterpriseSolutions"),
);
const Blog = lazy(() => import("@/components/pages/Blog"));
const BlogPost = lazy(() => import("@/components/pages/BlogPost"));
const HelpCenter = lazy(() => import("@/components/pages/HelpCenter"));
const TermsOfService = lazy(() => import("@/components/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/components/pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("@/components/pages/RefundPolicy"));
const FeesPricing = lazy(() => import("@/components/pages/FeesPricing"));
const Security = lazy(() => import("@/components/pages/Security"));
const ContactUs = lazy(() => import("@/components/pages/ContactUs"));
const GuestAIDemo = lazy(() => import("@/components/pages/GuestAIDemo"));
const ServiceDetails = lazy(() => import("@/components/pages/ServiceDetails"));

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
            <Route path="/ai-demo" element={<GuestAIDemo />} />
            <Route
              path="/"
              element={
                <LayoutWithNavbar>
                  <Home />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/marketplace"
              element={
                <LayoutWithNavbar>
                  <Marketplace />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/marketplace/service/:id"
              element={
                <LayoutWithNavbar>
                  <ServiceDetails />
                </LayoutWithNavbar>
              }
            />
            <Route path="/get-started" element={<GetStarted />} />
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
              path="/talent"
              element={
                <LayoutWithNavbar>
                  <BrowseTalent />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/enterprise"
              element={
                <LayoutWithNavbar>
                  <EnterpriseSolutions />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <LayoutWithNavbar>
                  <BlogPost />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/blog"
              element={
                <LayoutWithNavbar>
                  <Blog />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/help"
              element={
                <LayoutWithNavbar>
                  <HelpCenter />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/terms"
              element={
                <LayoutWithNavbar>
                  <TermsOfService />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/privacy"
              element={
                <LayoutWithNavbar>
                  <PrivacyPolicy />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/refund-policy"
              element={
                <LayoutWithNavbar>
                  <RefundPolicy />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/fees-pricing"
              element={
                <LayoutWithNavbar>
                  <FeesPricing />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/security"
              element={
                <LayoutWithNavbar>
                  <Security />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/contact-us"
              element={
                <LayoutWithNavbar>
                  <ContactUs />
                </LayoutWithNavbar>
              }
            />
            <Route
              path="/services"
              element={
                <LayoutWithNavbar>
                  <GuestAIDemo />
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
              path="/client/payments"
              element={
                <ProtectedRoute>
                  <ClientPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ProjectManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/availability"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/appointments"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/projects"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/projects/:projectId"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/messages"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/profile/:id"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/profile"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/marketplace"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerMarketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/reports"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-manager/create-project"
              element={
                <ProtectedRoute
                  loginPath="/project-manager/login"
                  allowedRoles={["PROJECT_MANAGER", "ADMIN"]}
                >
                  <ManagerProjectSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service"
              element={
                <LayoutNavbarOnly>
                  <GuestAIDemo />
                </LayoutNavbarOnly>
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
              path="/freelancer/payments"
              element={
                <ProtectedRoute>
                  <FreelancerPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/onboarding"
              element={
                <ProtectedRoute loginPath="/signup?role=freelancer">
                  <FreelancerMultiStepForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freelancer/verification-pending"
              element={
                <ProtectedRoute>
                  <Navigate to="/freelancer" replace />
                </ProtectedRoute>
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
              path="/admin/services"
              element={
                <AdminRoute>
                  <AdminServices />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/service-questions"
              element={
                <AdminRoute>
                  <AdminServiceQuestions />
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

const LayoutNavbarOnly = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

LayoutNavbarOnly.propTypes = {
  children: PropTypes.node.isRequired,
};

const ProtectedRoute = ({ children, loginPath = "/login", allowedRoles = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = String(user?.role || "").toUpperCase();
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  loginPath: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
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

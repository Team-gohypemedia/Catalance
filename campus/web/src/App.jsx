import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import AppLayout from "@/components/layout/AppLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import { FullPageLoader, GuestOnly, RequireAuth, RequireFlag } from "@/components/layout/guards";

const page = (loader) => lazy(loader);

// Public / marketing
const Landing = page(() => import("@/pages/public/Landing"));
const HowItWorks = page(() => import("@/pages/public/HowItWorks"));
const Tracks = page(() => import("@/pages/public/Tracks"));
const TrackDetail = page(() => import("@/pages/public/TrackDetail"));
const Colleges = page(() => import("@/pages/public/Colleges"));
const ForColleges = page(() => import("@/pages/public/ForColleges"));
const ForCompanies = page(() => import("@/pages/public/ForCompanies"));
const Pricing = page(() => import("@/pages/public/Pricing"));
const About = page(() => import("@/pages/public/About"));
const Aspirants = page(() => import("@/pages/public/Aspirants"));
const VerifyCertificate = page(() => import("@/pages/public/VerifyCertificate"));
const Passport = page(() => import("@/pages/public/Passport"));
const NotFound = page(() => import("@/pages/public/NotFound"));

// Auth
const Login = page(() => import("@/pages/auth/Login"));
const Sso = page(() => import("@/pages/auth/Sso"));
const Signup = page(() => import("@/pages/auth/Signup"));
const ForgotPassword = page(() => import("@/pages/auth/ForgotPassword"));
const Onboarding = page(() => import("@/pages/auth/Onboarding"));

// Student app — learn
const Dashboard = page(() => import("@/pages/app/Dashboard"));
const MyLearning = page(() => import("@/pages/app/MyLearning"));
const Catalog = page(() => import("@/pages/app/Catalog"));
const CourseDetail = page(() => import("@/pages/app/CourseDetail"));
const LessonPlayer = page(() => import("@/pages/app/LessonPlayer"));
const Tutor = page(() => import("@/pages/app/Tutor"));
const Certificates = page(() => import("@/pages/app/Certificates"));
// earn + rank
const Ladder = page(() => import("@/pages/app/Ladder"));
const Gigs = page(() => import("@/pages/app/Gigs"));
const GigDetail = page(() => import("@/pages/app/GigDetail"));
const Wallet = page(() => import("@/pages/app/Wallet"));
const Leaderboard = page(() => import("@/pages/app/Leaderboard"));
const College = page(() => import("@/pages/app/College"));
const Portfolio = page(() => import("@/pages/app/Portfolio"));
// community + account
const Community = page(() => import("@/pages/app/Community"));
const Thread = page(() => import("@/pages/app/Thread"));
const Mentors = page(() => import("@/pages/app/Mentors"));
const MentorDetail = page(() => import("@/pages/app/MentorDetail"));
const Cohorts = page(() => import("@/pages/app/Cohorts"));
const CohortDetail = page(() => import("@/pages/app/CohortDetail"));
const Notifications = page(() => import("@/pages/app/Notifications"));
const Profile = page(() => import("@/pages/app/Profile"));
const Settings = page(() => import("@/pages/app/Settings"));
const MentorStudio = page(() => import("@/pages/app/MentorStudio"));

// Admin
const AdminOverview = page(() => import("@/pages/admin/Overview"));
const AdminCourses = page(() => import("@/pages/admin/Courses"));
const AdminCourseEditor = page(() => import("@/pages/admin/CourseEditor"));
const AdminGigs = page(() => import("@/pages/admin/Gigs"));
const AdminApplications = page(() => import("@/pages/admin/Applications"));
const AdminSubmissions = page(() => import("@/pages/admin/Submissions"));
const AdminStudents = page(() => import("@/pages/admin/Students"));
const AdminColleges = page(() => import("@/pages/admin/Colleges"));
const AdminMentors = page(() => import("@/pages/admin/Mentors"));
const AdminSettings = page(() => import("@/pages/admin/Settings"));

// Spec v1.0 pages (see campus/API_CONTRACT.md "Spec v1.0")
const Assessments = page(() => import("@/pages/app/Assessments"));
const AssessmentDetail = page(() => import("@/pages/app/AssessmentDetail"));
const Skills = page(() => import("@/pages/app/Skills"));
const AdminAssessments = page(() => import("@/pages/admin/Assessments"));
const AdminEvaluations = page(() => import("@/pages/admin/Evaluations"));
const AdminEvaluationDetail = page(() => import("@/pages/admin/EvaluationDetail"));
const AdminVerifications = page(() => import("@/pages/admin/Verifications"));
const VerifySkill = page(() => import("@/pages/public/VerifySkill"));
const Payments = page(() => import("@/pages/app/Payments"));
const AdminPayments = page(() => import("@/pages/admin/Payments"));
const PublicSkills = page(() => import("@/pages/public/Skills"));
const AdminCatalogue = page(() => import("@/pages/admin/Catalogue"));
const Opportunities = page(() => import("@/pages/app/Opportunities"));
const MyProjects = page(() => import("@/pages/app/MyProjects"));
const ProjectDetail = page(() => import("@/pages/app/ProjectDetail"));
const AdminTalent = page(() => import("@/pages/admin/Talent"));
const AdminOffers = page(() => import("@/pages/admin/Offers"));
const AdminOfferEditor = page(() => import("@/pages/admin/OfferEditor"));
const AdminOfferDetail = page(() => import("@/pages/admin/OfferDetail"));
const AdminPayouts = page(() => import("@/pages/admin/Payouts"));
const Help = page(() => import("@/pages/app/Help"));
const TicketDetail = page(() => import("@/pages/app/TicketDetail"));
const Faqs = page(() => import("@/pages/public/Faqs"));
const Contact = page(() => import("@/pages/public/Contact"));
const Legal = page(() => import("@/pages/public/Legal"));
const AdminSupport = page(() => import("@/pages/admin/Support"));
const AdminAudit = page(() => import("@/pages/admin/Audit"));
const AdminReports = page(() => import("@/pages/admin/Reports"));

const STAFF_CONSOLE_ROLES = ["ADMIN", "EVALUATOR", "MENTOR", "PROJECT_MANAGER", "FINANCE"];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          {/* Marketing — open to everyone */}
          <Route element={<PublicLayout />}>
            <Route index element={<Landing />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="tracks" element={<Tracks />} />
            <Route path="tracks/:slug" element={<TrackDetail />} />
            <Route path="colleges" element={<RequireFlag flag="gamification"><Colleges /></RequireFlag>} />
            <Route path="for-colleges" element={<ForColleges />} />
            <Route path="for-companies" element={<ForCompanies />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="about" element={<About />} />
            <Route path="aspirants" element={<RequireFlag flag="aspirants"><Aspirants /></RequireFlag>} />
            <Route path="verify/:code" element={<VerifyCertificate />} />
            <Route path="u/:username" element={<Passport />} />
            <Route path="skills" element={<PublicSkills />} />
            <Route path="faqs" element={<Faqs />} />
            <Route path="contact" element={<Contact />} />
            <Route path="legal/:doc" element={<Legal />} />
            <Route path="verify/skill/:code" element={<VerifySkill />} />
          </Route>

          {/* Auth */}
          {/* Catalance hands its session over here; must work whether or not a Campus session already exists */}
          <Route path="sso" element={<Sso />} />
          <Route element={<GuestOnly />}>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route element={<RequireAuth allowUnonboarded />}>
            <Route path="onboarding" element={<Onboarding />} />
          </Route>

          {/* Student app — login required */}
          <Route path="app" element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="learn" element={<MyLearning />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="courses/:courseId" element={<CourseDetail />} />
              <Route path="courses/:courseId/learn/:lessonId" element={<LessonPlayer />} />
              <Route path="tutor" element={<RequireFlag flag="aiTutor"><Tutor /></RequireFlag>} />
              <Route path="certificates" element={<Certificates />} />
              {/* spec §2: switchable areas (flags in admin Settings); off → Not available, like the API 404 */}
              <Route element={<RequireFlag flag="gigs" />}>
                <Route path="ladder" element={<Ladder />} />
                <Route path="gigs" element={<Gigs />} />
                <Route path="gigs/:gigId" element={<GigDetail />} />
              </Route>
              <Route path="wallet" element={<RequireFlag flag="wallet"><Wallet /></RequireFlag>} />
              <Route path="leaderboard" element={<RequireFlag flag="gamification"><Leaderboard /></RequireFlag>} />
              <Route path="colleges/:collegeId" element={<College />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route element={<RequireFlag flag="community" />}>
                <Route path="community" element={<Community />} />
                <Route path="community/:threadId" element={<Thread />} />
              </Route>
              <Route path="mentors" element={<RequireFlag flag="mentorBooking"><Mentors /></RequireFlag>} />
              <Route path="mentors/:mentorId" element={<MentorDetail />} />
              <Route element={<RequireFlag flag="cohorts" />}>
                <Route path="cohorts" element={<Cohorts />} />
                <Route path="cohorts/:cohortId" element={<CohortDetail />} />
              </Route>
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="mentor" element={<MentorStudio />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="assessments/:courseId" element={<AssessmentDetail />} />
              <Route path="skills" element={<Skills />} />
              <Route path="opportunities" element={<Opportunities />} />
              <Route path="projects" element={<MyProjects />} />
              <Route path="projects/:offerId" element={<ProjectDetail />} />
              <Route path="payments" element={<Payments />} />
              <Route path="help" element={<Help />} />
              <Route path="help/:ticketId" element={<TicketDetail />} />
            </Route>
          </Route>

          {/* Admin — ADMIN role only */}
          {/* Staff console. Every page is guarded by the same roles as its ADMIN_NAV entry (nav-config.js). */}
          <Route path="admin" element={<RequireAuth roles={STAFF_CONSOLE_ROLES} />}>
            <Route element={<AdminLayout />}>
              <Route element={<RequireAuth roles={["ADMIN"]} />}>
                <Route index element={<AdminOverview />} />
                <Route path="catalogue" element={<AdminCatalogue />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="courses/:courseId" element={<AdminCourseEditor />} />
                <Route path="assessments" element={<AdminAssessments />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="audit" element={<AdminAudit />} />
                {/* lesson reviews: /api/admin/submissions is ADMIN-only; mentors review in Mentor Studio (/app/mentor) */}
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route element={<RequireFlag flag="gigs" />}>
                  <Route path="gigs" element={<AdminGigs />} />
                  <Route path="applications" element={<AdminApplications />} />
                </Route>
                <Route path="colleges" element={<AdminColleges />} />
                <Route path="mentors" element={<AdminMentors />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route element={<RequireAuth roles={["ADMIN", "EVALUATOR", "MENTOR"]} />}>
                <Route path="evaluations" element={<AdminEvaluations />} />
                <Route path="evaluations/:attemptId" element={<AdminEvaluationDetail />} />
              </Route>
              <Route element={<RequireAuth roles={["ADMIN", "PROJECT_MANAGER"]} />}>
                <Route path="talent" element={<AdminTalent />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="offers/new" element={<AdminOfferEditor />} />
                <Route path="offers/:offerId" element={<AdminOfferDetail />} />
                <Route path="offers/:offerId/edit" element={<AdminOfferEditor />} />
              </Route>
              <Route element={<RequireAuth roles={["ADMIN", "FINANCE"]} />}>
                <Route path="payments" element={<AdminPayments />} />
                <Route path="payouts" element={<AdminPayouts />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>
              <Route element={<RequireAuth roles={["ADMIN", "PROJECT_MANAGER", "FINANCE"]} />}>
                <Route path="support" element={<AdminSupport />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

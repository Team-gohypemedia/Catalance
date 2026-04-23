import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();
let dashboardModel;

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/ui/suspension-alert", () => ({
  SuspensionAlert: () => null,
}));

vi.mock("@/components/features/freelancer/FreelancerWorkspaceHeader", () => ({
  default: () => <div>Workspace Header</div>,
}));

vi.mock(
  "@/components/features/freelancer/FreelancerOnboardingWelcomeModal.jsx",
  () => ({
    default: ({ open }) => (open ? <div>Onboarding Welcome Modal</div> : null),
  })
);

vi.mock(
  "@/components/freelancer/freelancer-dashboard/FreelancerDashboardContent.jsx",
  () => ({
    DashboardContent: ({ children }) => children(dashboardModel),
  })
);

vi.mock("@/components/freelancer/freelancer-dashboard", () => ({
  ActiveChats: () => <div>Active Chats</div>,
  ActiveProjects: () => <div>Active Projects</div>,
  ClientReviewsPanel: () => <div>Client Reviews</div>,
  CompactEarningsSummary: () => <div>Compact Earnings</div>,
  DeliveryPipeline: () => <div>Delivery Pipeline</div>,
  FreelancerActiveProjectsSkeleton: () => <div>Active Projects Skeleton</div>,
  FreelancerChatsSkeleton: () => <div>Chats Skeleton</div>,
  FreelancerClientReviewsSkeleton: () => <div>Reviews Skeleton</div>,
  FreelancerCompactEarningsSummarySkeleton: () => <div>Earnings Skeleton</div>,
  FreelancerDeliveryPipelineSkeleton: () => <div>Delivery Skeleton</div>,
  FreelancerPendingProposalsSkeleton: () => <div>Pending Proposals Skeleton</div>,
  FreelancerProfileCompletionSkeleton: () => <div>Profile Progress Skeleton</div>,
  FreelancerRecentActivitySkeleton: () => <div>Recent Activity Skeleton</div>,
  HeroGreetingBlock: ({ greeting, firstName }) => (
    <div>{`${greeting}, ${firstName}`}</div>
  ),
  OverviewMetricsGrid: () => <div>Overview Metrics</div>,
  PendingProposals: () => <div>Pending Proposals</div>,
  ProfileCompletionPanel: ({ completionPercent }) => (
    <div>{`Profile Progress ${completionPercent}`}</div>
  ),
  RecentActivity: () => <div>Recent Activity</div>,
}));

import FreelancerDashboard from "../FreelancerDashboard.jsx";

const createDashboardModel = () => ({
  sessionUser: null,
  showSuspensionAlert: false,
  setShowSuspensionAlert: vi.fn(),
  headerProfile: {},
  activeWorkspaceKey: "dashboard",
  handleWorkspaceNav: vi.fn(),
  onOpenProfile: vi.fn(),
  onOpenProposals: vi.fn(),
  notifications: [],
  unreadCount: 0,
  markAllAsRead: vi.fn(),
  handleNotificationClick: vi.fn(),
  hero: {
    greeting: "Good Afternoon",
    firstName: "Mohd",
    dateLabel: "Thursday",
  },
  metricsLoading: false,
  dashboardMetricCards: [],
  shouldShowProfileCompletionPanel: true,
  showProfileCompletionSkeleton: false,
  profileCompletionPercent: 7,
  profileCompletionComplete: false,
  runningProjectCards: [],
  freelancerProjectRedirectCards: [],
  shouldUseProjectCarousel: false,
  setProjectCarouselApi: vi.fn(),
  projectCarouselApi: null,
  canGoToPreviousProjects: false,
  canGoToNextProjects: false,
  projectCarouselSnapCount: 0,
  activeProjectSnap: 0,
  projectCardRefs: { current: [] },
  isMobile: false,
  mobileProjectCardHeight: 0,
  activeProjectCardClassName: "",
  activeProjectRedirectCardClassName: "",
  pendingProposalRows: [],
  activityItems: [],
  onOpenNotificationSheet: vi.fn(),
  previewMessages: [],
  onOpenMessages: vi.fn(),
  clientReviews: [],
  clientReviewsMeta: {},
  clientReviewsLoading: false,
  receivedEarningsLabel: "0",
  pendingEarningsLabel: "0",
  earningsMomentumSummary: { label: "" },
  nextPayoutSummaryLabel: "",
  activeRunningProjectsFilterLabel: "",
  runningProjectFilterOptions: [],
  runningProjectsFilter: "",
  setRunningProjectsFilter: vi.fn(),
  visibleRunningProjects: [],
  showRunningProjectsCarouselControls: false,
  runningProjectsCarouselApi: null,
  setRunningProjectsCarouselApi: vi.fn(),
  canGoToPreviousRunningProjects: false,
  canGoToNextRunningProjects: false,
  runningProjectsCarouselSnapCount: 0,
  activeRunningProjectsSnap: 0,
  selectedRunningProjectId: null,
  setSelectedRunningProjectId: vi.fn(),
  activeScheduleProjectTitle: "",
  activeProposalForSchedule: null,
  scheduleTimelineRows: [],
  schedulePhaseSegments: [],
  activeSchedulePhaseSegmentIndex: 0,
  scheduleMarkerLeftPct: 0,
  scheduleTodayDateLabel: "",
  activeScheduleProgressPct: 0,
  schedulePhases: [],
  activeScheduleDueInDays: 0,
});

describe("FreelancerDashboard profile progress visibility", () => {
  beforeEach(() => {
    dashboardModel = createDashboardModel();
    mockUseAuth.mockReturnValue({
      user: {
        id: "freelancer-1",
        role: "FREELANCER",
        roles: ["FREELANCER"],
        onboardingComplete: false,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hides the profile progress panel until onboarding is complete", () => {
    render(<FreelancerDashboard />);

    expect(screen.getByText("Onboarding Welcome Modal")).toBeTruthy();
    expect(screen.queryByText(/Profile Progress/i)).toBeNull();
  });

  it("shows the profile progress panel after onboarding is complete", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "freelancer-1",
        role: "FREELANCER",
        roles: ["FREELANCER"],
        onboardingComplete: true,
      },
    });

    render(<FreelancerDashboard />);

    expect(screen.queryByText("Onboarding Welcome Modal")).toBeNull();
    expect(screen.getByText("Profile Progress 7")).toBeTruthy();
  });
});

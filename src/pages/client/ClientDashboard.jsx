import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	ActiveChats,
	ActiveProjects,
	DraftedProposals,
	HeroGreetingBlock,
	OverviewMetricsGrid,
	ProjectProgress,
	RecentActivity,
} from "@/components/client/client-dashboard";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import {
	buildProjectCardModel,
	normalizeClientProjects,
} from "@/components/features/client/ClientProjects";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import FreelancerSelectionDialog from "@/components/features/client/dashboard/FreelancerSelectionDialog";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
	getProposalStorageKeys,
	loadSavedProposalsFromStorage,
	persistSavedProposalsToStorage,
	resolveActiveProposalId,
} from "@/shared/lib/client-proposal-storage";
import { formatINR } from "@/shared/lib/currency";
import { listFreelancers } from "@/shared/lib/api-client";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { CLIENT_DASHBOARD_SEND_PROPOSAL_PATH } from "@/shared/lib/proposal-dashboard-intent";
import { getSession } from "@/shared/lib/auth-storage";
import { toast } from "sonner";

const formatDashboardDate = (
	value,
	options = { weekday: "long", month: "short", day: "numeric" },
) => {
	const date = value ? new Date(value) : new Date();
	if (Number.isNaN(date.getTime())) return "Today";
	return new Intl.DateTimeFormat("en-US", options).format(date);
};

const getDashboardGreeting = (value = new Date()) => {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "Hello";

	const hour = date.getHours();
	if (hour < 12) return "Good Morning";
	if (hour < 18) return "Good Afternoon";
	return "Good Evening";
};

const resolveDraftTitle = (proposal = {}) =>
	proposal.projectTitle || proposal.title || proposal.service || "Proposal Draft";

const resolveDraftService = (proposal = {}) =>
	proposal.serviceKey || proposal.service || proposal.serviceName || proposal.category || "General";

const formatDraftBudget = (value) => {
	const rawValue = String(value || "").trim();
	if (!rawValue) return "Not set";

	const numericValue = Number.parseInt(rawValue.replace(/[^0-9]/g, ""), 10);
	if (!Number.isFinite(numericValue) || numericValue <= 0) return rawValue;

	return formatINR(numericValue);
};

const buildDraftProposalPath = (draftId, action = "view") => {
	const params = new URLSearchParams({ tab: "draft", action });
	if (draftId) params.set("draftId", draftId);
	return `/client/proposal?${params.toString()}`;
};

const isProjectCompleted = (project = {}) => {
	const normalizedStatus = String(project?.status || "").toUpperCase();
	if (normalizedStatus === "COMPLETED") return true;
	return project?.paymentPlan?.isFullyPaid === true;
};

const getProjectPaymentSummary = (projects = []) =>
	projects.reduce(
		(summary, project) => {
			const paymentPlan =
				project?.paymentPlan && typeof project.paymentPlan === "object"
					? project.paymentPlan
					: null;

			if (!paymentPlan) return summary;

			summary.totalPaid += Number(paymentPlan.paidAmount) || 0;
			summary.totalPending += Number(paymentPlan.nextDueInstallment?.amount) || 0;

			return summary;
		},
		{ totalPaid: 0, totalPending: 0 },
	);

const getPendingProposalCount = (proposals = []) =>
	proposals.filter((proposal) => {
		const status = String(proposal?.status || "").toLowerCase();
		return status === "pending" || status === "sent";
	}).length;

const isAcceptedProposalStatus = (proposal = {}) =>
	String(proposal?.status || "").toLowerCase() === "accepted";

const resolveProposalProjectKey = (proposal = {}) =>
	String(proposal?.syncedProjectId || proposal?.projectId || "").trim();

const shouldHideDraftProposal = (draft = {}, remoteProposals = []) => {
	const projectKey = resolveProposalProjectKey(draft);
	if (!projectKey) return false;

	return remoteProposals.some(
		(proposal) =>
			resolveProposalProjectKey(proposal) === projectKey &&
			isAcceptedProposalStatus(proposal),
	);
};

const PROPOSAL_BLOCKED_STATUSES = new Set(["pending", "accepted", "sent"]);
const CLOSED_PROJECT_STATUSES = new Set(["completed", "paused"]);
const DRAFT_PROJECT_STATUSES = new Set(["draft", "local_draft"]);

const hasFreelancerRole = (user = {}) => {
	const primaryRole = String(user?.role || "").toUpperCase();
	const roles = Array.isArray(user?.roles)
		? user.roles.map((entry) => String(entry || "").toUpperCase())
		: [];
	return primaryRole === "FREELANCER" || roles.includes("FREELANCER");
};

const normalizeFreelancerCardData = (candidate = {}) => {
	const freelancer = { ...candidate };
	const rawBio = freelancer.bio || freelancer.about;

	if (typeof rawBio === "string" && rawBio.trim().startsWith("{")) {
		try {
			const parsed = JSON.parse(rawBio);
			freelancer.cleanBio =
				parsed.bio ||
				parsed.about ||
				parsed.description ||
				parsed.summary ||
				"No bio available.";
			if ((!freelancer.skills || freelancer.skills.length === 0) && parsed.skills) {
				freelancer.skills = parsed.skills;
			}
			if (!freelancer.rating && parsed.rating) freelancer.rating = parsed.rating;
		} catch {
			freelancer.cleanBio = "Overview available in profile.";
		}
	} else {
		freelancer.cleanBio = rawBio || "No bio available for this freelancer.";
	}

	return freelancer;
};

const formatRating = (value) => {
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric <= 0) return "N/A";
	return numeric.toFixed(1);
};

const collectStringValues = (value) => {
	if (value === null || value === undefined) return [];
	if (Array.isArray(value)) return value.flatMap((entry) => collectStringValues(entry));
	if (typeof value === "object") {
		return Object.values(value).flatMap((entry) => collectStringValues(entry));
	}
	if (typeof value === "string" || typeof value === "number") return [String(value)];
	return [];
};

const normalizeSkillToken = (value = "") =>
	String(value || "")
		.toLowerCase()
		.replace(/[^a-z0-9#+.]/g, "");

const splitSkillValues = (value = "") =>
	String(value || "")
		.split(/,|\/|\||\+|;|&|\band\b/gi)
		.map((entry) => entry.trim())
		.filter(Boolean);

const collectFreelancerSkillTokens = (freelancer = {}) => {
	const tokenSet = new Set();
	const candidates = collectStringValues([
		freelancer?.matchedTechnologies,
		freelancer?.matchHighlights,
		freelancer?.skills,
		freelancer?.services,
		freelancer?.profileDetails?.services,
		freelancer?.profileDetails?.serviceDetails,
		freelancer?.freelancerProjects,
	]);

	candidates.forEach((entry) => {
		splitSkillValues(entry).forEach((part) => {
			const normalized = normalizeSkillToken(part);
			if (normalized) tokenSet.add(normalized);
		});
	});

	return tokenSet;
};

const freelancerMatchesRequiredSkill = (requiredSkill, freelancerSkillTokens) => {
	const required = normalizeSkillToken(requiredSkill);
	if (!required) return false;
	if (freelancerSkillTokens.has(required)) return true;

	for (const token of freelancerSkillTokens) {
		if (!token || token.length < 3 || required.length < 3) continue;
		if (token.includes(required) || required.includes(token)) return true;
	}

	return false;
};

const generateGradient = (id) => {
	if (!id) return "linear-gradient(135deg, #0f172a, #1d4ed8)";

	let hash = 0;
	for (let index = 0; index < String(id).length; index += 1) {
		hash = String(id).charCodeAt(index) + ((hash << 5) - hash);
	}

	const firstHue = Math.abs(hash % 360);
	const secondHue = (firstHue + 44) % 360;
	return `linear-gradient(135deg, hsl(${firstHue}, 78%, 58%), hsl(${secondHue}, 78%, 48%))`;
};

const buildProjectUpsertPayload = (proposal, normalizedBudget) => {
	const payload = {
		title: resolveDraftTitle(proposal),
		description: proposal.summary || proposal.content || "",
		proposalContent:
			proposal.proposalContent || proposal.content || proposal.summary || "",
		budget: normalizedBudget,
		timeline: proposal.timeline || "1 month",
		serviceKey: proposal.serviceKey || resolveDraftService(proposal),
		status: "OPEN",
	};

	if (proposal?.proposalContext && typeof proposal.proposalContext === "object") {
		payload.proposalContext = proposal.proposalContext;
	}

	return payload;
};

const ClientDashboard = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { authFetch, isAuthenticated, user } = useAuth();
	const { unreadCount } = useNotifications();
	const [savedDrafts, setSavedDrafts] = useState([]);
	const [projects, setProjects] = useState([]);
	const [proposals, setProposals] = useState([]);
	const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);
	const [selectedDraftForSend, setSelectedDraftForSend] = useState(null);
	const [suggestedFreelancers, setSuggestedFreelancers] = useState([]);
	const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
	const [sendingProposalId, setSendingProposalId] = useState(null);
	const [sendingFreelancerId, setSendingFreelancerId] = useState(null);
	const [freelancerSearch, setFreelancerSearch] = useState("");
	const [showFreelancerProfile, setShowFreelancerProfile] = useState(false);
	const [viewingFreelancer, setViewingFreelancer] = useState(null);
	const [runningProjectProcessingId, setRunningProjectProcessingId] = useState(null);

	const sessionUser = useMemo(() => getSession()?.user ?? null, []);
	const proposalActionIntent = (searchParams.get("proposalAction") || "").toLowerCase();

	const loadDrafts = useCallback(() => {
		const { proposals } = loadSavedProposalsFromStorage(sessionUser?.id);
		const sortedProposals = [...proposals].sort((left, right) => {
			const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
			const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
			return rightTime - leftTime;
		});

		setSavedDrafts(sortedProposals);
	}, [sessionUser?.id]);

	useEffect(() => {
		loadDrafts();

		const handleStorageChange = (event) => {
			if (event?.key && !event.key.includes("savedProposal")) return;
			loadDrafts();
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [loadDrafts]);

	useEffect(() => {
		if (proposalActionIntent !== "send") return;
		navigate(CLIENT_DASHBOARD_SEND_PROPOSAL_PATH, { replace: true });
	}, [navigate, proposalActionIntent]);

	const loadDashboardData = useCallback(async () => {
		try {
			const [projectsResponse, proposalsResponse] = await Promise.all([
				authFetch("/projects", { skipLogoutOn401: true }),
				authFetch("/proposals?as=owner", { skipLogoutOn401: true }),
			]);

			const [projectsPayload, proposalsPayload] = await Promise.all([
				projectsResponse.json().catch(() => null),
				proposalsResponse.json().catch(() => null),
			]);

			setProjects(
				projectsResponse.ok && Array.isArray(projectsPayload?.data)
					? projectsPayload.data
					: [],
			);
			setProposals(
				proposalsResponse.ok && Array.isArray(proposalsPayload?.data)
					? proposalsPayload.data
					: [],
			);
		} catch (error) {
			console.error("Failed to load client dashboard stats:", error);
			setProjects([]);
			setProposals([]);
		}
	}, [authFetch]);

	useEffect(() => {
		if (!isAuthenticated) {
			setProjects([]);
			setProposals([]);
			return;
		}

		let cancelled = false;

		const loadData = async () => {
			try {
				await loadDashboardData();
			} catch (error) {
				if (!cancelled) {
					console.error("Failed to hydrate client dashboard:", error);
				}
			}
		};

		void loadData();

		return () => {
			cancelled = true;
		};
	}, [isAuthenticated, loadDashboardData]);

	useEffect(() => {
		if (!showFreelancerSelect || !user?.id) return;

		let cancelled = false;

		const loadFreelancers = async () => {
			setIsFreelancersLoading(true);
			try {
				const [activeFreelancers, pendingFreelancers] = await Promise.all([
					listFreelancers({
						onboardingComplete: "true",
						status: "ACTIVE",
					}),
					listFreelancers({
						onboardingComplete: "true",
						status: "PENDING_APPROVAL",
					}),
				]);

				if (cancelled) return;

				const merged = [
					...(Array.isArray(activeFreelancers) ? activeFreelancers : []),
					...(Array.isArray(pendingFreelancers) ? pendingFreelancers : []),
				];
				const uniqueById = merged.filter(
					(freelancer, index, collection) =>
						freelancer?.id &&
						collection.findIndex((item) => item?.id === freelancer.id) === index,
				);

				setSuggestedFreelancers(
					uniqueById
						.filter((freelancer) => freelancer?.id !== user.id && hasFreelancerRole(freelancer))
						.map((freelancer) => normalizeFreelancerCardData(freelancer)),
				);
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to load suggested freelancers:", error);
				setSuggestedFreelancers([]);
			} finally {
				if (!cancelled) setIsFreelancersLoading(false);
			}
		};

		void loadFreelancers();

		return () => {
			cancelled = true;
		};
	}, [showFreelancerSelect, user?.id]);

	useEffect(() => {
		if (!showFreelancerSelect) {
			setFreelancerSearch("");
			setIsFreelancersLoading(false);
		}
	}, [showFreelancerSelect]);

	const profile = useMemo(
		() => ({
			name: sessionUser?.fullName || sessionUser?.name || "Client",
			avatar: sessionUser?.avatar || "",
			initial:
				(sessionUser?.fullName || sessionUser?.name || sessionUser?.email || "C")
					.charAt(0)
					.toUpperCase(),
		}),
		[sessionUser?.avatar, sessionUser?.email, sessionUser?.fullName, sessionUser?.name],
	);

	const hero = useMemo(
		() => ({
			greeting: getDashboardGreeting(),
			firstName: sessionUser?.fullName?.split(" ")[0] || "Client",
			dateLabel: formatDashboardDate(new Date(), {
				weekday: "long",
				month: "short",
				day: "numeric",
			}).toUpperCase(),
		}),
		[sessionUser?.fullName],
	);

	const handleDeleteDraft = useCallback(
		(draftId) => {
			if (!draftId) return;

			const storageKeys = getProposalStorageKeys(sessionUser?.id);
			const { proposals, activeId } = loadSavedProposalsFromStorage(sessionUser?.id);
			const remaining = proposals.filter((proposal) => proposal.id !== draftId);
			const preferredActiveId = activeId === draftId ? null : activeId;
			const nextActiveId = resolveActiveProposalId(
				remaining,
				preferredActiveId,
				null,
			);

			persistSavedProposalsToStorage(remaining, nextActiveId, storageKeys);
			setSavedDrafts(remaining);
		},
		[sessionUser?.id],
	);

	const draftProposalRows = useMemo(
		() =>
			savedDrafts
				.filter((proposal) => !shouldHideDraftProposal(proposal, proposals))
				.map((proposal) => ({
					id: proposal.id,
					title: resolveDraftTitle(proposal),
					tag: resolveDraftService(proposal),
					budget: formatDraftBudget(proposal.budget),
					onSend: () => {
						setSelectedDraftForSend(proposal);
						setShowFreelancerSelect(true);
					},
					onView: () => navigate(buildDraftProposalPath(proposal.id, "view")),
					onDelete: () => handleDeleteDraft(proposal.id),
				})),
		[handleDeleteDraft, navigate, proposals, savedDrafts],
	);

	const sendProposalToFreelancer = useCallback(
		async (freelancer) => {
			const proposal = selectedDraftForSend;
			if (!proposal || !freelancer) return;

			setSendingProposalId(proposal.id);
			setSendingFreelancerId(freelancer.id);

			try {
				const normalizedBudget = Number.parseInt(
					String(proposal.budget || "").replace(/[^0-9]/g, ""),
					10,
				) || 0;
				const sourceProjectId = proposal?.syncedProjectId || proposal?.projectId || null;
				const currentProjectStatus = String(proposal?.projectStatus || "").toLowerCase();

				const hasExistingProposalForFreelancer = proposals.some((entry) => {
					if (!entry?.freelancerId || !entry?.projectId) return false;
					if (String(entry.projectId) !== String(sourceProjectId)) return false;
					if (String(entry.freelancerId) !== String(freelancer.id)) return false;
					return PROPOSAL_BLOCKED_STATUSES.has(String(entry.status || "").toLowerCase());
				});

				if (hasExistingProposalForFreelancer) {
					throw new Error("You already sent this proposal to this freelancer.");
				}

				if (CLOSED_PROJECT_STATUSES.has(currentProjectStatus)) {
					throw new Error("This project is already completed or paused.");
				}

				let project = sourceProjectId
					? { id: sourceProjectId, status: proposal.projectStatus || "OPEN" }
					: null;

				if (sourceProjectId && DRAFT_PROJECT_STATUSES.has(currentProjectStatus)) {
					const projectPayload = buildProjectUpsertPayload(proposal, normalizedBudget);
					const publishRes = await authFetch(`/projects/${sourceProjectId}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(projectPayload),
					});
					const publishPayload = await publishRes.json().catch(() => null);
					if (!publishRes.ok) {
						throw new Error("Failed to publish project before sending proposal.");
					}
					project = publishPayload?.data?.project || publishPayload?.data || project;
				}

				if (!project?.id) {
					const createProjectPayload = buildProjectUpsertPayload(proposal, normalizedBudget);
					const projectRes = await authFetch("/projects", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(createProjectPayload),
					});
					const projectResponsePayload = await projectRes.json().catch(() => null);
					if (!projectRes.ok) {
						throw new Error(projectResponsePayload?.message || "Failed to create project.");
					}
					project =
						projectResponsePayload?.data?.project ||
						projectResponsePayload?.data ||
						project;
				}

				if (!project?.id) {
					throw new Error("Could not resolve project for this proposal.");
				}

				const proposalRes = await authFetch("/proposals", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						projectId: project.id,
						freelancerId: freelancer.id,
						amount: normalizedBudget,
						coverLetter: proposal.summary || proposal.content || "",
					}),
				});
				const proposalPayload = await proposalRes.json().catch(() => null);
				if (!proposalRes.ok) {
					throw new Error(proposalPayload?.message || "Failed to send proposal.");
				}

				const now = new Date().toISOString();
				const storageKeys = getProposalStorageKeys(sessionUser?.id);
				const { proposals: storedDrafts } = loadSavedProposalsFromStorage(sessionUser?.id);
				const updatedDrafts = storedDrafts.map((entry) =>
					entry.id === proposal.id
						? {
							...entry,
							projectId: project.id,
							syncedProjectId: project.id,
							projectStatus: String(project.status || "OPEN").toUpperCase(),
							syncedAt: entry.syncedAt || now,
							updatedAt: now,
						}
						: entry,
				);
				persistSavedProposalsToStorage(updatedDrafts, proposal.id, storageKeys);
				setSavedDrafts(updatedDrafts);

				await loadDashboardData();

				toast.success(`Proposal sent to ${freelancer.fullName || "freelancer"}!`);
				setShowFreelancerSelect(false);
			} catch (error) {
				console.error("Failed to send proposal:", error);
				toast.error(error?.message || "Failed to send proposal. Please try again.");
			} finally {
				setSendingProposalId(null);
				setSendingFreelancerId(null);
			}
		},
		[authFetch, loadDashboardData, proposals, selectedDraftForSend, sessionUser?.id],
	);

	const freelancerSelectionData = useMemo(() => {
		const sourceProjectId =
			selectedDraftForSend?.syncedProjectId || selectedDraftForSend?.projectId || null;
		const alreadyInvitedIds = new Set();

		if (sourceProjectId) {
			proposals.forEach((proposal) => {
				if (String(proposal?.projectId) !== String(sourceProjectId)) return;
				const status = String(proposal?.status || "").toLowerCase();
				if (proposal?.freelancerId && PROPOSAL_BLOCKED_STATUSES.has(status)) {
					alreadyInvitedIds.add(proposal.freelancerId);
				}
			});
		}

		const available = suggestedFreelancers.filter(
			(freelancer) => !alreadyInvitedIds.has(freelancer.id),
		);

		return {
			totalRanked: suggestedFreelancers.length,
			invitedCount: alreadyInvitedIds.size,
			available,
		};
	}, [proposals, selectedDraftForSend, suggestedFreelancers]);

	const filteredFreelancers = useMemo(() => {
		const query = String(freelancerSearch || "").trim().toLowerCase();
		if (!query) return freelancerSelectionData.available;

		return freelancerSelectionData.available.filter((freelancer) => {
			const searchable = [
				freelancer.fullName,
				freelancer.name,
				freelancer.role,
				freelancer.cleanBio,
				...(Array.isArray(freelancer.skills) ? freelancer.skills : []),
				...(Array.isArray(freelancer.matchHighlights) ? freelancer.matchHighlights : []),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return searchable.includes(query);
		});
	}, [freelancerSearch, freelancerSelectionData.available]);

	const normalizedDashboardProjects = useMemo(
		() => normalizeClientProjects(projects),
		[projects],
	);

	const activeProjectCount = useMemo(
		() =>
			normalizedDashboardProjects.filter(
				(project) =>
					!isProjectCompleted({
						status: project.rawStatus,
						paymentPlan: project.paymentPlan,
					}),
			).length,
		[normalizedDashboardProjects],
	);

	const completedProjectCount = useMemo(
		() =>
			normalizedDashboardProjects.filter((project) =>
				isProjectCompleted({
					status: project.rawStatus,
					paymentPlan: project.paymentPlan,
				}),
			).length,
		[normalizedDashboardProjects],
	);

	const pendingProposalCount = useMemo(
		() => getPendingProposalCount(proposals),
		[proposals],
	);

	const paymentSummary = useMemo(
		() => getProjectPaymentSummary(projects),
		[projects],
	);

	const metrics = useMemo(
		() => [
			{
				id: "active-projects",
				title: "ACTIVE PROJECTS",
				value: String(activeProjectCount).padStart(2, "0"),
				iconKey: "projects",
				to: "/client/project?filter=ongoing",
			},
			{
				id: "completed-projects",
				title: "COMPLETED PROJECTS",
				value: String(completedProjectCount).padStart(2, "0"),
				iconKey: "completed",
				to: "/client/project?filter=completed",
			},
			{
				id: "pending-approvals",
				title: "PENDING APPROVALS",
				value: String(pendingProposalCount).padStart(2, "0"),
				iconKey: "proposals",
				to: "/client/proposal?tab=pending",
			},
			{
				id: "payments-summary",
				title: "TOTAL AMOUNT PAID",
				value: formatINR(paymentSummary.totalPaid),
				alternateTitle: "PENDING PAYMENTS",
				alternateValue: formatINR(paymentSummary.totalPending),
				hasValueSwitch: true,
				defaultMode: "alternate",
				iconKey: "payments",
				to: "/client/payments",
			},
		],
		[
			activeProjectCount,
			completedProjectCount,
			paymentSummary.totalPaid,
			paymentSummary.totalPending,
			pendingProposalCount,
		],
	);

	const activeProjectShowcaseItems = useMemo(
		() =>
			normalizedDashboardProjects
				.filter((project) => !isProjectCompleted({ status: project.rawStatus, paymentPlan: project.paymentPlan }))
				.map((project) => buildProjectCardModel(project)),
		[normalizedDashboardProjects],
	);

	const handleSiteNav = (key) => {
		const routes = {
			home: "/",
			marketplace: "/marketplace",
			service: "/service",
			contact: "/contact",
		};

		navigate(routes[key] || "/");
	};

	const handleDashboardNav = (key) => {
		const routes = {
			dashboard: "/client",
			proposals: "/client/proposal",
			projects: "/client/project",
			messages: "/client/messages",
			payments: "/client/payments",
			profile: "/client/profile",
			freelancers: "/marketplace",
		};

		navigate(routes[key] || "/client");
	};

	const handleOpenQuickProject = () => navigate("/service");
	const handleOpenHireFreelancer = () => navigate("/marketplace");
	const handleOpenViewProjects = () => navigate("/client/project");
	const handleOpenMessages = () => navigate("/client/messages");
	const handlePayRunningProject = useCallback(
		async (project) => {
			if (!project?.id) return;

			setRunningProjectProcessingId(project.id);
			try {
				const paymentResult = await processProjectInstallmentPayment({
					authFetch,
					projectId: project.id,
					description: `${project.dueInstallment?.label || "Project payment"} for ${
						project.title || "project"
					}`,
				});
				toast.success(paymentResult?.message || "Payment completed successfully.");
				await loadDashboardData();
			} catch (error) {
				console.error("Project payment failed:", error);
				toast.error(error?.message || "Failed to process payment");
			} finally {
				setRunningProjectProcessingId(null);
			}
		},
		[authFetch, loadDashboardData],
	);

	return (
		<div className="min-h-screen bg-background text-[#f1f5f9]">
			<div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
				<ClientWorkspaceHeader
					profile={profile}
					activeWorkspaceKey="dashboard"
					unreadCount={unreadCount}
					onSiteNav={handleSiteNav}
					onWorkspaceNav={handleDashboardNav}
					primaryActionLabel="New Proposal"
					primaryActionTo="/service"
					onOpenNotifications={handleOpenMessages}
				/>

				<main className="flex-1 pb-12">
					<HeroGreetingBlock hero={hero} />

					<OverviewMetricsGrid metrics={metrics} />

					<ActiveProjects
						showcaseItems={activeProjectShowcaseItems}
						onOpenQuickProject={handleOpenQuickProject}
						onOpenHireFreelancer={handleOpenHireFreelancer}
						onPayRunningProject={handlePayRunningProject}
						runningProjectProcessingId={runningProjectProcessingId}
					/>

					<section className="mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
						<div className="min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7">
							<DraftedProposals
								draftProposalRows={draftProposalRows}
								onOpenQuickProject={handleOpenQuickProject}
							/>

							<RecentActivity
								recentActivities={[]}
								onOpenViewProjects={handleOpenViewProjects}
								onOpenNotifications={handleOpenMessages}
							/>
						</div>

						<div className="grid gap-5 sm:gap-6 xl:gap-7">
							<ActiveChats
								acceptedFreelancers={[]}
								acceptedFreelancersCount={0}
								onOpenMessages={handleOpenMessages}
							/>
						</div>
					</section>

					<ProjectProgress
						progressProjects={[]}
						onOpenQuickProject={handleOpenQuickProject}
					/>
				</main>

				<FreelancerSelectionDialog
					open={showFreelancerSelect}
					onOpenChange={setShowFreelancerSelect}
					savedProposal={selectedDraftForSend}
					isLoadingFreelancers={isFreelancersLoading}
					isSendingProposal={sendingProposalId === (selectedDraftForSend?.id ?? null)}
					sendingFreelancerId={sendingFreelancerId}
					freelancerSearch={freelancerSearch}
					onFreelancerSearchChange={setFreelancerSearch}
					filteredFreelancers={filteredFreelancers}
					freelancerSelectionData={freelancerSelectionData}
					bestMatchFreelancerIds={new Set()}
					projectRequiredSkills={[]}
					onViewFreelancer={(freelancer) => {
						setViewingFreelancer(freelancer);
						setShowFreelancerProfile(true);
					}}
					onSendProposal={sendProposalToFreelancer}
					collectFreelancerSkillTokens={collectFreelancerSkillTokens}
					freelancerMatchesRequiredSkill={freelancerMatchesRequiredSkill}
					generateGradient={generateGradient}
					formatRating={formatRating}
				/>

				<FreelancerProfileDialog
					open={showFreelancerProfile}
					onOpenChange={(open) => {
						setShowFreelancerProfile(open);
						if (!open) {
							setViewingFreelancer(null);
						}
					}}
					viewingFreelancer={viewingFreelancer}
				/>

				<ClientDashboardFooter variant="workspace" />
			</div>
		</div>
	);
};

export default ClientDashboard;

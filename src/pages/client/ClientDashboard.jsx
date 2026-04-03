import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useNotifications } from "@/shared/context/NotificationContext";
import { formatINR } from "@/shared/lib/currency";
import { getSession } from "@/shared/lib/auth-storage";

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

const ClientDashboard = () => {
	const navigate = useNavigate();
	const { unreadCount } = useNotifications();

	const sessionUser = useMemo(() => getSession()?.user ?? null, []);

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

	const metrics = useMemo(
		() => [
			{
				id: "active-projects",
				title: "ACTIVE PROJECTS",
				value: "00",
				iconKey: "projects",
				to: "/client/project?filter=ongoing",
			},
			{
				id: "completed-projects",
				title: "COMPLETED PROJECTS",
				value: "00",
				iconKey: "completed",
				to: "/client/project?filter=completed",
			},
			{
				id: "pending-approvals",
				title: "PENDING APPROVALS",
				value: "00",
				iconKey: "proposals",
				to: "/client/proposal?tab=pending",
			},
			{
				id: "payments-summary",
				title: "TOTAL AMOUNT PAID",
				value: formatINR(0),
				alternateTitle: "PENDING PAYMENTS",
				alternateValue: formatINR(0),
				hasValueSwitch: true,
				defaultMode: "alternate",
				iconKey: "payments",
				to: "/client/payments",
			},
		],
		[],
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
						showcaseItems={[]}
						onOpenQuickProject={handleOpenQuickProject}
						onOpenHireFreelancer={handleOpenHireFreelancer}
					/>

					<section className="mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
						<div className="min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7">
							<DraftedProposals
								draftProposalRows={[]}
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

				<ClientDashboardFooter variant="workspace" />
			</div>
		</div>
	);
};

export default ClientDashboard;

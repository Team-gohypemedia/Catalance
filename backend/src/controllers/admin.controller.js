import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import { sendEmail } from "../lib/email-service.js";

// Get dashboard stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get basic counts - these should always work
    const totalUsers = await prisma.user.count({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    const totalProjects = await prisma.project.count();
    const totalProposals = await prisma.proposal.count();
    
    // Get revenue - sum of actual 'spent' amounts from all projects (actual payments made)
    let totalRevenue = 0;
    try {
      const revenueResult = await prisma.project.aggregate({
        _sum: { spent: true }
      });
      totalRevenue = revenueResult._sum?.spent || 0;
    } catch (e) {
      console.error("Revenue query failed:", e);
    }

    // Get recent users - simple query without ordering
    let recentUsers = [];
    try {
      const allUsers = await prisma.user.findMany({
        take: 50,
        select: { id: true, fullName: true, email: true, role: true, createdAt: true }
      });
      recentUsers = allUsers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    } catch (e) {
      console.error("Recent users query failed:", e);
    }

    // Get recent projects
    let recentProjects = [];
    try {
      const allProjects = await prisma.project.findMany({
        take: 50,
        include: { owner: { select: { fullName: true } } }
      });
      recentProjects = allProjects
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    } catch (e) {
      console.error("Recent projects query failed:", e);
    }

    res.json({
      data: {
        stats: {
          totalUsers,
          totalProjects,
          totalProposals,
          totalRevenue
        },
        recentUsers,
        recentProjects
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats", details: error.message });
  }
});

// Get all users with pagination and filtering
export const getUsers = asyncHandler(async (req, res) => {
  try {
    // Check if prisma client is available
    if (!prisma) {
      console.error("Prisma client is not initialized");
      return res.status(500).json({ error: "Database connection not available" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || undefined;
    const status = req.query.status || undefined;
    const isVerified = req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined;
    const view = req.query.view || undefined;

    console.log("getUsers called with role:", role, "status:", status, "isVerified:", isVerified, "view:", view, "search:", search);

    // Build where clause for Prisma
    let where = {
      role: { not: 'ADMIN' }, // Always exclude admins from general user list
      ...(role && { role }),
      ...(status && { status }),
      ...(isVerified !== undefined && { isVerified }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Special view for approvals page
    if (view === 'approvals') {
      where = {
        role: { not: 'ADMIN' },
        OR: [
          { status: 'PENDING_APPROVAL' },
          { 
            AND: [
              { role: 'FREELANCER' },
              { isVerified: false } // Catch unverified freelancers
            ]
          }
        ],
        ...(search && {
          AND: [
            {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          ]
        })
      };
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const paginatedUsers = users; // Already paginated via Prisma

    console.log("Returning", paginatedUsers.length, "users");

    res.json({
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Admin getUsers error:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Failed to fetch users", details: error.message });
  }
});

// Update user role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["CLIENT", "FREELANCER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true }
  });

  res.json({ data: updatedUser });
});



// Update user status (suspend/activate)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"].includes(status)) {
    throw new Error("Invalid status");
  }

  // Build update data
  const updateData = { status };
  
  // Set or clear suspendedAt based on status
  if (status === "SUSPENDED") {
    updateData.suspendedAt = new Date();
  } else if (status === "ACTIVE") {
    updateData.suspendedAt = null; // Clear suspension date on reactivation
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, status: true, fullName: true, email: true, suspendedAt: true }
  });

  // Notify user about status change
  try {
      let title = "Account Status Updated";
      let message = `Your account status has been updated to ${status}.`;
      
      if (status === "ACTIVE") {
          title = "Account Activated! 🎉";
          message = "Congratulations! Your account has been approved and is now active. You can now access all features.";
      } else if (status === "SUSPENDED") {
          title = "Account Suspended";
          message = "Your account has been suspended. You have 90 days to verify your account, otherwise it will be permanently deleted. Please contact support for more information.";
          
          // Send suspension email
          try {
            await sendEmail({
              to: updatedUser.email,
              subject: "Account Suspended - Action Required",
              title: "Your Account Has Been Suspended",
              html: `
                <p>Dear ${updatedUser.fullName},</p>
                <p>Your Catalance account has been suspended.</p>
                <p><strong>Important:</strong> You have <strong>90 days</strong> to verify your account. If you do not take action within this period, your account and all associated data will be permanently deleted.</p>
                <p>If you believe this was a mistake or would like to appeal this decision, please contact our support team immediately.</p>
                <p>Thank you,<br>The Catalance Team</p>
              `
            });
            console.log(`[Admin] Suspension email sent to ${updatedUser.email}`);
          } catch (emailErr) {
            console.error("[Admin] Failed to send suspension email:", emailErr);
          }
      }

      await sendNotificationToUser(userId, {
          type: "system",
          title,
          message,
          data: { status }
      });
  } catch (e) {
      console.error("Failed to notify user about status change:", e);
  }

  res.json({ data: updatedUser });
});

// Get all projects for admin
export const getProjects = asyncHandler(async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        status: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        proposals: {
          where: { status: "ACCEPTED" },
          take: 1,
          select: {
            id: true,
            freelancer: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { proposals: true }
        },
        progress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to include freelancer at top level for easier frontend access
    const transformedProjects = projects.map(project => ({
      ...project,
      freelancer: project.proposals?.[0]?.freelancer || null,
      proposals: undefined // Remove proposals from response
    }));

    res.json({ data: { projects: transformedProjects } });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get detailed user information
export const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!prisma) {
      return res.status(500).json({ error: "Database connection not available" });
    }

    // Get user with their projects and proposals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        bio: true,
        skills: true,
        hourlyRate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        portfolioProjects: true,
        portfolio: true,
        linkedin: true,
        github: true,
        // For clients: get their owned projects
        ownedProjects: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            spent: true,
            createdAt: true,
            proposals: {
              select: {
                id: true,
                amount: true,
                status: true,
                freelancer: {
                  select: { fullName: true, email: true }
                }
              }
            }
          }
        },
        // For freelancers: get their proposals
        proposals: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                budget: true,
                spent: true,
                owner: {
                  select: { fullName: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate statistics based on role
    let stats = {};

    if (user.role === "CLIENT") {
      const totalProjects = user.ownedProjects.length;
      const activeProjects = user.ownedProjects.filter(p => p.status === "IN_PROGRESS").length;
      const completedProjects = user.ownedProjects.filter(p => p.status === "COMPLETED").length;
      
      // Calculate total spent from actual 'spent' field on each project
      const totalSpent = user.ownedProjects.reduce((sum, project) => sum + (project.spent || 0), 0);

      stats = {
        totalProjects,
        activeProjects,
        completedProjects,
        openProjects: user.ownedProjects.filter(p => p.status === "OPEN").length,
        totalSpent,
        moneyRemaining: user.ownedProjects.reduce((sum, p) => sum + (p.budget || 0), 0) - totalSpent
      };
    } else if (user.role === "FREELANCER") {
      const totalProposals = user.proposals.length;
      const acceptedProposals = user.proposals.filter(p => p.status === "ACCEPTED");
      const pendingProposals = user.proposals.filter(p => p.status === "PENDING");
      const rejectedProposals = user.proposals.filter(p => p.status === "REJECTED");
      
      // Platform fee - freelancer receives 70%
      const PLATFORM_FEE_PERCENTAGE = 0.30;
      const FREELANCER_SHARE = 1 - PLATFORM_FEE_PERCENTAGE;
      
      // Calculate actual earnings from paid amounts (project.spent field)
      // This is the actual money paid to the freelancer
      let grossPaidAmount = 0;
      acceptedProposals.forEach(proposal => {
        const projectSpent = proposal.project?.spent || 0;
        grossPaidAmount += projectSpent;
      });
      const totalEarnings = Math.round(grossPaidAmount * FREELANCER_SHARE);
      
      // Calculate pending amount = (accepted proposal amounts - already paid amounts) * 70%
      // This is money from accepted proposals that hasn't been paid yet
      let grossAcceptedAmount = 0;
      acceptedProposals.forEach(proposal => {
        grossAcceptedAmount += proposal.amount;
      });
      const pendingAmount = Math.round((grossAcceptedAmount - grossPaidAmount) * FREELANCER_SHARE);

      stats = {
        totalProposals,
        acceptedProposals: acceptedProposals.length,
        pendingProposals: pendingProposals.length,
        rejectedProposals: rejectedProposals.length,
        totalEarnings,
        pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
        activeProjects: acceptedProposals.length
      };
    }

    res.json({
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          bio: user.bio,
          skills: user.skills,
          hourlyRate: user.hourlyRate,
          status: user.status || 'ACTIVE',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          portfolioProjects: user.portfolioProjects,
          portfolio: user.portfolio,
          linkedin: user.linkedin,
          github: user.github
        },
        stats,
        projects: user.role === "CLIENT" ? user.ownedProjects : [],
        proposals: user.role === "FREELANCER" ? user.proposals : []
      }
    });
  } catch (error) {
    console.error("getUserDetails error:", error.message);
    res.status(500).json({ error: "Failed to fetch user details", details: error.message });
  }
});

export const getProjectDetails = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        }
      },
      proposals: {
        include: {
          freelancer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      disputes: {
        include: {
          raisedBy: {
            select: { fullName: true }
          },
          manager: {
            select: { fullName: true }
          }
        }
      }
    }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Determine accepted freelancer if any
  const acceptedProposal = project.proposals.find(p => p.status === 'ACCEPTED');
  
  // Fetch conversation associated with the project
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      projectTitle: project.title,
      createdById: project.owner.id
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { fullName: true, role: true }
          }
        }
      }
    }
  });

  const projectWithDetails = {
    ...project,
    freelancer: acceptedProposal ? acceptedProposal.freelancer : null,
    conversation: conversation
  };

  res.json({ data: { project: projectWithDetails } });
});

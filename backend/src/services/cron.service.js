import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { sendEmail } from '../lib/email-service.js';
import { resend } from '../lib/resend.js';
import { reconcileFreelancerOpenToWorkStatuses } from '../lib/freelancer-open-to-work.js';

const CRON_DB_COOLDOWN_MS = 5 * 60 * 1000;
let skipCronUntil = 0;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FIVE_DAYS_MS = 5 * TWENTY_FOUR_HOURS_MS;
const SEVEN_DAYS_MS = 7 * TWENTY_FOUR_HOURS_MS;

const isDatabaseConnectivityError = (error) => {
    const code = error?.code;
    if (code === 'P1001' || code === 'P1017') {
        return true;
    }

    const message = String(error?.message || '').toLowerCase();
    return (
        message.includes("can't reach database server") ||
        message.includes('connection was forcibly closed') ||
        message.includes('error in postgresql connection')
    );
};

const shouldSkipCronRun = (jobName) => {
    const now = Date.now();
    if (now >= skipCronUntil) {
        return false;
    }

    const remainingSeconds = Math.max(1, Math.ceil((skipCronUntil - now) / 1000));
    console.warn(
        `[Cron] Skipping "${jobName}" because database connectivity is in cooldown (${remainingSeconds}s remaining).`
    );
    return true;
};

const handleCronError = (jobName, error) => {
    if (isDatabaseConnectivityError(error)) {
        skipCronUntil = Date.now() + CRON_DB_COOLDOWN_MS;
        console.error(
            `[Cron] Database unavailable during "${jobName}". Pausing cron DB work for ${Math.round(
                CRON_DB_COOLDOWN_MS / 1000
            )}s.`
        );
        return;
    }

    console.error(`[Cron] Error in ${jobName}:`, error);
};

export const startCronJobs = () => {
    console.log('Starting cron jobs...');

    void reconcileFreelancerOpenToWorkStatuses()
        .then((result) => {
            if (result?.updatedCount > 0) {
                console.log(
                    `[Cron] Startup reconciliation adjusted openToWork for ${result.updatedCount}/${result.checkedCount} freelancer profiles.`
                );
            }
        })
        .catch((error) => {
            handleCronError('freelancer availability startup reconciliation', error);
        });

    // Run every minute
    cron.schedule('* * * * *', async () => {
        if (shouldSkipCronRun('meeting reminder cron')) {
            return;
        }

        try {
            const now = new Date();
            // Look for meetings in the upcoming window covering ~10 minutes
            // We'll check for meetings starting between 9 and 11 minutes from now
            // to catch the "10 minutes before" mark.
            const startWindow = new Date(now.getTime() + 9 * 60000);
            const endWindow = new Date(now.getTime() + 11 * 60000);

            const disputes = await prisma.dispute.findMany({
                where: {
                    status: { not: 'RESOLVED' },
                    meetingDate: {
                        gte: startWindow,
                        lte: endWindow
                    },
                    meetingReminderSent: false
                },
                include: {
                    project: {
                        include: {
                            owner: true,
                            proposals: {
                                where: { status: 'ACCEPTED' },
                                include: { freelancer: true }
                            }
                        }
                    },
                    raisedBy: true
                }
            });

            if (disputes.length > 0) {
                console.log(`Found ${disputes.length} disputes for meeting reminders.`);
            }

            for (const dispute of disputes) {
                let link = dispute.meetingLink;

                // Auto-generate Jitsi link if missing
                if (!link) {
                    link = `https://meet.jit.si/Catalance-Dispute-${dispute.id}`;
                    // Save the generated link
                    await prisma.dispute.update({
                        where: { id: dispute.id },
                        data: { meetingLink: link }
                    });
                    console.log(`Generated auto-link for dispute ${dispute.id}: ${link}`);
                }

                // Identify recipients
                const recipients = [];
                // Client (Project Owner)
                if (dispute.project.owner?.email) recipients.push(dispute.project.owner.email);

                // Freelancer (from accepted proposal)
                const freelancer = dispute.project.proposals?.[0]?.freelancer;
                if (freelancer?.email && !recipients.includes(freelancer.email)) {
                    recipients.push(freelancer.email);
                }

                if (recipients.length === 0) {
                    console.log(`No recipients found for dispute ${dispute.id}`);
                    continue;
                }

                // Send email
                if (resend) {
                    await resend.emails.send({
                        from: env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                        to: recipients,
                        subject: `Meeting Reminder: ${dispute.project.title}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2>Meeting Reminder</h2>
                                <p>This is a reminder that your dispute resolution meeting for <strong>${dispute.project.title}</strong> is scheduled to start in approximately 10 minutes.</p>
                                
                                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-weight: bold;">Time: ${new Date(dispute.meetingDate).toLocaleString()}</p>
                                    <p style="margin: 10px 0 0 0;">
                                        <strong>Link:</strong> <a href="${link}" style="color: #2563eb;">Join Meeting</a>
                                    </p>
                                    <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">${link}</p>
                                </div>
                                
                                <p>Please join on time to resolve the issue promptly.</p>
                            </div>
                        `
                    });
                    console.log(`Sent meeting reminder emails to: ${recipients.join(', ')}`);
                } else {
                    console.log(`[Mock Email] To: ${recipients.join(', ')}`);
                    console.log(`Subject: Meeting Reminder: ${dispute.project.title}`);
                    console.log(`Link: ${link}`);
                }

                // Update status to prevent duplicate sending
                await prisma.dispute.update({
                    where: { id: dispute.id },
                    data: { meetingReminderSent: true }
                });
            }
        } catch (error) {
            handleCronError('meeting reminder cron', error);
        }
    }, { noOverlap: true });

    // ============================================================
    // Proposal Follow-up Guidance: Run every hour to notify clients when a proposal
    // has been pending for more than 24 hours but is still within the 5-day window.
    // ============================================================
    cron.schedule('0 * * * *', async () => {
        if (shouldSkipCronRun('proposal follow-up guidance cron')) {
            return;
        }

        try {
            const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
            const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_MS);

            const pendingProposals = await prisma.proposal.findMany({
                where: {
                    status: 'PENDING',
                    followupGuidanceSent: false,
                    createdAt: {
                        lt: twentyFourHoursAgo,
                        gt: fiveDaysAgo
                    }
                },
                include: {
                    project: {
                        include: {
                            owner: true
                        }
                    },
                    freelancer: {
                        select: { fullName: true, email: true }
                    }
                }
            });

            if (pendingProposals.length > 0) {
                console.log(`[Cron] Found ${pendingProposals.length} proposals pending >24hrs for follow-up guidance.`);
            }

            for (const proposal of pendingProposals) {
                const owner = proposal.project?.owner;
                if (!owner?.email) {
                    console.log(`[Cron] No owner email found for proposal ${proposal.id}`);
                    continue;
                }

                const freelancerName = proposal.freelancer?.fullName || 'The freelancer';
                const projectTitle = proposal.project?.title || 'your project';

                console.log(`[Cron] Sending follow-up guidance email to: ${owner.email}`);
                const emailResult = await sendEmail({
                    to: owner.email,
                    subject: `Update on Your Proposal for "${projectTitle}"`,
                    title: 'Your Proposal Needs Attention',
                    html: `
                        <p>Hi ${owner.fullName || 'there'},</p>
                        <p>Your proposal for <strong>"${projectTitle}"</strong> has not been accepted yet. ${freelancerName} may currently be unavailable or busy.</p>

                        <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                            <p style="margin: 0; font-weight: bold;">💡 Recommendation</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px;">
                                We recommend exploring other freelancers to get your work started sooner.
                            </p>
                        </div>
                    `
                });

                if (emailResult) {
                    console.log(`[Cron] ✅ Follow-up guidance email sent successfully to: ${owner.email}`);
                } else {
                    console.log(`[Cron] ⚠️ Follow-up guidance email failed for: ${owner.email}`);
                }

                try {
                    const { sendNotificationToUser } = await import('../lib/notification-util.js');
                    const notifResult = await sendNotificationToUser(owner.id, {
                        audience: 'client',
                        type: 'proposal_followup',
                        title: 'Freelancer May Be Unavailable',
                        message: `Your proposal for "${projectTitle}" has not been accepted yet. The freelancer may currently be unavailable or busy. We recommend exploring other freelancers to get your work started sooner.`,
                        data: {
                            projectId: proposal.projectId,
                            proposalId: proposal.id,
                            followUpStage: '24h'
                        }
                    }, false);
                    console.log(`[Cron] ✅ Follow-up guidance notification sent for proposal ${proposal.id}, result:`, notifResult);
                } catch (notifyErr) {
                    console.error(`[Cron] ❌ Failed to send follow-up guidance notification for proposal ${proposal.id}:`, notifyErr);
                }

                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: { followupGuidanceSent: true }
                });
            }
        } catch (error) {
            handleCronError('proposal follow-up guidance cron', error);
        }
    }, { noOverlap: true });

    // ============================================================
    // Budget Increase Reminder: Run every hour to check for proposals
    // that have been pending for more than 5 days without acceptance
    // ============================================================
    cron.schedule('0 * * * *', async () => {
        if (shouldSkipCronRun('budget reminder cron')) {
            return;
        }

        try {
            const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_MS);

            // Find proposals that are PENDING, older than 5 days, and haven't had a reminder sent
            const pendingProposals = await prisma.proposal.findMany({
                where: {
                    status: 'PENDING',
                    budgetReminderSent: false,
                    createdAt: {
                        lt: fiveDaysAgo
                    }
                },
                include: {
                    project: {
                        include: {
                            owner: true
                        }
                    },
                    freelancer: {
                        select: { fullName: true, email: true }
                    }
                }
            });

            if (pendingProposals.length > 0) {
                console.log(`[Cron] Found ${pendingProposals.length} proposals pending >5d for budget reminder.`);
            }

            for (const proposal of pendingProposals) {
                const owner = proposal.project?.owner;
                if (!owner?.email) {
                    console.log(`[Cron] No owner email found for proposal ${proposal.id}`);
                    continue;
                }

                const freelancerName = proposal.freelancer?.fullName || 'The freelancer';
                const projectTitle = proposal.project?.title || 'your project';

                // Send email notification using centralized email service
                console.log(`[Cron] Sending budget reminder email to: ${owner.email}`);
                const emailResult = await sendEmail({
                    to: owner.email,
                    subject: `Consider Increasing Budget for "${projectTitle}"`,
                    title: 'Your Proposal is Still Pending',
                    html: `
                        <p>Hi ${owner.fullName || 'there'},</p>
                        <p>Your proposal for <strong>"${projectTitle}"</strong> has been pending for over 5 days without acceptance from ${freelancerName}.</p>
                        
                        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <p style="margin: 0; font-weight: bold;">💡 Tip: Consider increasing your budget</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px;">
                                Competitive pricing can help attract freelancers faster. You can increase your budget from the dashboard.
                            </p>
                        </div>
                        
                        <p>Current Budget: <strong>₹${(proposal.project?.budget || 0).toLocaleString()}</strong></p>
                        
                        <p>Visit your dashboard to update the budget or explore other freelancers.</p>
                    `
                });
                if (emailResult) {
                    console.log(`[Cron] ✅ Budget reminder email sent successfully to: ${owner.email}`);
                } else {
                    console.log(`[Cron] ⚠️ Budget reminder email failed for: ${owner.email}`);
                }

                // Send in-app notification (persisted to DB + socket + push)
                try {
                    const { sendNotificationToUser } = await import('../lib/notification-util.js');
                    const notifResult = await sendNotificationToUser(owner.id, {
                        audience: 'client',
                        type: 'budget_suggestion',
                        title: 'Consider Increasing Budget',
                        message: `Your proposal for "${projectTitle}" has still not been accepted after 5 days. Increase your budget to reach more freelancers who are more likely to work within your budget.`,
                        data: {
                            projectId: proposal.projectId,
                            proposalId: proposal.id,
                            currentBudget: proposal.project?.budget || 0
                        }
                    }, false); // Don't send another email (already sent above)
                    console.log(`[Cron] ✅ In-app notification sent for proposal ${proposal.id}, result:`, notifResult);
                } catch (notifyErr) {
                    console.error(`[Cron] ❌ Failed to send in-app notification for proposal ${proposal.id}:`, notifyErr);
                }

                // Mark as sent to prevent duplicate reminders
                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: { budgetReminderSent: true }
                });
            }
        } catch (error) {
            handleCronError('budget reminder cron', error);
        }
    }, { noOverlap: true });

    // ============================================================
    // Auto-Reject Proposals: Run every hour to auto-reject proposals
    // that have been pending for more than 7 days without acceptance
    // ============================================================
    cron.schedule('0 * * * *', async () => {
        if (shouldSkipCronRun('auto-reject proposals cron')) {
            return;
        }

        try {
            const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

            // Find proposals that are PENDING and older than 7 days
            const expiredProposals = await prisma.proposal.findMany({
                where: {
                    status: 'PENDING',
                    createdAt: {
                        lt: sevenDaysAgo
                    }
                },
                include: {
                    project: {
                        include: {
                            owner: true
                        }
                    },
                    freelancer: {
                        select: { fullName: true, email: true }
                    }
                }
            });

            if (expiredProposals.length > 0) {
                console.log(`[Cron] Found ${expiredProposals.length} proposals to auto-reject (>7d).`);
            }

            for (const proposal of expiredProposals) {
                const owner = proposal.project?.owner;
                const freelancerName = proposal.freelancer?.fullName || 'The freelancer';
                const projectTitle = proposal.project?.title || 'your project';

                // Update proposal status to REJECTED
                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: { status: 'REJECTED' }
                });
                console.log(`[Cron] ✅ Auto-rejected proposal ${proposal.id} for project "${projectTitle}"`);

                // Send email notification to client
                if (owner?.email) {
                    await sendEmail({
                        to: owner.email,
                        subject: `Proposal Expired for "${projectTitle}"`,
                        title: 'Proposal Auto-Expired',
                        html: `
                            <p>Hi ${owner.fullName || 'there'},</p>
                            <p>Your proposal to <strong>${freelancerName}</strong> for <strong>"${projectTitle}"</strong> has expired after 7 days without acceptance.</p>
                            
                            <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0; font-weight: bold;">💡 Tip: You can send a new proposal</p>
                                <p style="margin: 10px 0 0 0; font-size: 14px;">
                                    Visit your dashboard to send a proposal to another freelancer or consider increasing your budget.
                                </p>
                            </div>
                            
                            <p>Project Budget: <strong>₹${(proposal.project?.budget || 0).toLocaleString()}</strong></p>
                        `
                    });
                    console.log(`[Cron] ✅ Sent expiry notification email to: ${owner.email}`);
                }

                // Send in-app notification
                if (owner?.id) {
                    try {
                        const { sendNotificationToUser } = await import('../lib/notification-util.js');
                        await sendNotificationToUser(owner.id, {
                            audience: 'client',
                            type: 'proposal_expired',
                            title: 'Proposal Expired',
                            message: `Your proposal to ${freelancerName} for "${projectTitle}" has expired after 7 days. You can now send to another freelancer.`,
                            data: {
                                projectId: proposal.projectId,
                                proposalId: proposal.id
                            }
                        }, false);
                    } catch (notifyErr) {
                        console.error(`[Cron] ❌ Failed to send in-app notification:`, notifyErr);
                    }
                }
            }
        } catch (error) {
            handleCronError('auto-reject proposals cron', error);
        }
    }, { noOverlap: true });

    // ============================================================
    // Freelancer Availability Reconciliation: Run every hour to re-sync
    // openToWork against the current active project count.
    // ============================================================
    cron.schedule('17 * * * *', async () => {
        if (shouldSkipCronRun('freelancer availability reconciliation cron')) {
            return;
        }

        try {
            const result = await reconcileFreelancerOpenToWorkStatuses();
            if (result.updatedCount > 0) {
                console.log(
                    `[Cron] Reconciled openToWork for ${result.updatedCount}/${result.checkedCount} freelancer profiles.`
                );
            }
        } catch (error) {
            handleCronError('freelancer availability reconciliation cron', error);
        }
    }, { noOverlap: true });

    // ============================================================
    // Auto-Delete Rejected Proposals: Run every hour to delete proposals
    // that have been REJECTED for more than 48 hours
    // ============================================================
    cron.schedule('0 * * * *', async () => {
        if (shouldSkipCronRun('auto-delete rejected proposals cron')) {
            return;
        }

        try {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            // Delete proposals that are REJECTED and were last updated >48 hours ago
            const result = await prisma.proposal.deleteMany({
                where: {
                    status: 'REJECTED',
                    updatedAt: {
                        lt: fortyEightHoursAgo
                    }
                }
            });

            if (result.count > 0) {
                 console.log(`[Cron] 🗑️ Permanently deleted ${result.count} rejected proposals older than 48hrs.`);
            }
        } catch (error) {
            handleCronError('auto-delete rejected proposals cron', error);
        }
    }, { noOverlap: true });
};

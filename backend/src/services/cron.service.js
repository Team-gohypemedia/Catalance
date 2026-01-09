import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { sendEmail } from '../lib/email-service.js';
import { resend } from '../lib/resend.js';

export const startCronJobs = () => {
    console.log('Starting cron jobs...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
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
            console.error('Error in meeting reminder cron:', error);
        }
    });

    // ============================================================
    // Budget Increase Reminder: Run every hour to check for proposals
    // that have been pending for more than 24 hours without acceptance
    // ============================================================
    cron.schedule('0 * * * *', async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Find proposals that are PENDING, older than 24hrs, and haven't had a reminder sent
            const pendingProposals = await prisma.proposal.findMany({
                where: {
                    status: 'PENDING',
                    budgetReminderSent: false,
                    createdAt: {
                        lt: twentyFourHoursAgo
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
                console.log(`[Cron] Found ${pendingProposals.length} proposals pending >24hrs for budget reminder.`);
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
                        <p>Your proposal for <strong>"${projectTitle}"</strong> has been pending for over 24 hours without acceptance from ${freelancerName}.</p>
                        
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
                        type: 'budget_suggestion',
                        title: 'Consider Increasing Budget',
                        message: `Your proposal for "${projectTitle}" has been pending for over 24 hours. Consider increasing your budget to attract freelancers.`,
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
            console.error('[Cron] Error in budget reminder cron:', error);
        }
    });

    // ============================================================
    // Auto-Reject Proposals: Run every hour to auto-reject proposals
    // that have been pending for more than 48 hours without acceptance
    // ============================================================
    cron.schedule('0 * * * *', async () => {
        try {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            // Find proposals that are PENDING and older than 48 hours
            const expiredProposals = await prisma.proposal.findMany({
                where: {
                    status: 'PENDING',
                    createdAt: {
                        lt: fortyEightHoursAgo
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
                console.log(`[Cron] Found ${expiredProposals.length} proposals to auto-reject (>48hrs).`);
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
                            <p>Your proposal to <strong>${freelancerName}</strong> for <strong>"${projectTitle}"</strong> has expired after 48 hours without acceptance.</p>
                            
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
                            type: 'proposal_expired',
                            title: 'Proposal Expired',
                            message: `Your proposal to ${freelancerName} for "${projectTitle}" has expired. You can now send to another freelancer.`,
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
            console.error('[Cron] Error in auto-reject proposals cron:', error);
        }
    });

    // ============================================================
    // Auto-Delete Rejected Proposals: Run every hour to delete proposals
    // that have been REJECTED for more than 48 hours
    // ============================================================
    cron.schedule('0 * * * *', async () => {
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
            console.error('[Cron] Error in auto-delete rejected proposals cron:', error);
        }
    });
};

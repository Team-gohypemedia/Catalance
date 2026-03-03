# Catalance: Path to a Production-Ready Managed Marketplace

You have built an incredible foundation. The routing, database, AI logic, and base dashboards are all present. However, to truly compete with Upwork/Fiverr **while** enforcing your unique "Project Manager" (agency) model, there are specific feature gaps in the UI that need to be addressed.

Based on a deep audit of your frontend components across all four roles, here is the exact roadmap of what is currently missing and needs to be built or improved for each page/flow.

---

## 1. Client Dashboard Improvements
*The Client flows are mostly complete for intake, but lack post-payment project oversight.*

### `ClientProjectDetail.jsx`
- **Current State**: Shows project info, status, and assigned freelancer.
- **Improvement Needed (Milestone Tracker)**: Add a visual timeline/progress bar. Clients need to see exactly what phase the project is in (e.g., "Design Phase", "Development", "QA").
- **Improvement Needed (Deliverables Approval)**: A UI section where the client can view files/links submitted by the Freelancer/PM and click "Approve" or "Request Revisions".

### `ClientPayments.jsx` (Missing/Incomplete)
- **Current State**: Payments are handled via popups in the dashboard.
- **Improvement Needed (Billing Hub)**: Create a dedicated Billing page. Clients need to add/manage Credit Cards (via Stripe/Razorpay UI), view a history of all invoices, download PDF receipts for tax purposes, and see funds currently held in Escrow.

### `ClientProfile.jsx`
- **Improvement Needed (Reviews & Ratings)**: Introduce a post-project flow where the client rates both the Freelancer (on execution) and the PM (on communication).

---

## 2. Freelancer Dashboard Improvements
*Freelancers can view projects and chats, but lack advanced delivery and financial tools.*

### `FreelancerProjectDetail.jsx`
- **Current State**: Shows project details and chat.
- **Improvement Needed (Work Submission Flow)**: Add a clear "Submit Milestone for Review" button where freelancers can upload files, GitHub links, or Figma URLs for the Project Manager to review.
- **Improvement Needed (Time Tracking - Optional)**: If you ever transition from fixed-price to hourly work, you will need a manual time-logging UI or a desktop app integration.

### `FreelancerPayments.jsx`
- **Current State**: Likely shows ledger records.
- **Improvement Needed (Withdrawal Flow)**: Freelancers need a UI to connect their bank account (e.g., Stripe Connect Express or PayPal Payouts) and click "Withdraw Available Balance". It must clearly show funds `Pending (in Escrow)` vs `Available to Withdraw`.

### `FreelancerProfile.jsx` & `onboarding/`
- **Improvement Needed (Rich Portfolio)**: The profile needs a visually appealing portfolio section (like Behance) where they can upload image galleries of previous work, rather than just text-based skills.

---

## 3. Project Manager Dashboard Improvements
*The PM is the core differentiator of Catalance. Their dashboard needs to be a high-efficiency command center.*

### `ManagerProjectDetail.jsx`
- **Current State**: Shows project details and chat.
- **Improvement Needed (Kanban Task Board)**: Implement a Kanban board (To Do, In Progress, Review, Done) specifically for the PM to break down the AI Proposal into micro-tasks and assign deadlines to the freelancer.
- **Improvement Needed (Escrow Release Controls)**: When a Freelancer submits work, the PM needs a UI to explicitly click "Approve & Release Funds", which triggers the backend to move money from Escrow to the Freelancer's wallet.
- **Improvement Needed (Freelancer Re-assignment)**: If a freelancer ghosts or underperforms, the PM needs a flow to "Pause Project", "Remove Freelancer", and invite a new one from the talent pool natively from this page.

### `ManagerChat.jsx`
- **Improvement Needed (Tri-party Chat Headers)**: Ensure the chat UI clearly demarcates when the PM is talking to the *Client* vs talking to the *Freelancer*. Often, PMs need a side-channel to talk to the freelancer without the client seeing.

---

## 4. Admin Dashboard Improvements
*Admins need global oversight, financial reporting, and strict moderation tools.*

### `AdminDashboard.jsx` (Analytics)
- **Current State**: Shows basic stats.
- **Improvement Needed (Financial Dashboard)**: Implement detailed charts (using a library like Recharts) showing: Total Gross Volume, Platform Revenue (the 30% cut), Funds Currently locked in Escrow, and active Dispute liabilities.

### `AdminApprovals.jsx`
- **Improvement Needed (KYC / Identity Verification)**: Before a freelancer can withdraw money, they usually need KYC (Know Your Customer) checks. Add a UI for Admins to review uploaded IDs or tax documents.

### `AdminServiceQuestions.jsx`
- **Current State**: Manages the AI question flow.
- **Improvement Needed (Visual Tree Builder)**: Managing `servicesComplete.json` manually is brittle. Build a visual, drag-and-drop flowchart builder (using something like React Flow) so admins can easily add new services, questions, and logic branches for the AI without touching code.

---

## Next Steps Prioritization

If you want to move towards a launch, here is the recommended order of operations:
1. **The Money Flow (Crucial)**: Finalize the absolute payment pipeline. Integrate Stripe Checkout for the Client Upfront Payment, and Stripe Connect for Freelancer Payouts. Ensure the PM "Release Funds" button is wired up.
2. **The Delivery Flow**: Build the "Submit Work" UI for Freelancers and the "Approve Work" UI for PMs/Clients inside the Project Detail pages.
3. **The Portfolio/Profile Polish**: Upgrade the freelancer profiles to look more like visual portfolios to impress clients.

---

## 5. Additional Discovered Page Gaps

### `ClientProfile.jsx`
- **Current State**: Basic text fields for name, email, company, and bio. Allows image upload.
- **Improvement Needed (Billing Section Integration)**: There is zero UI here to manage payment methods or view billing history. A secure connection to Stripe Customer Portal should be initiated from the profile or a dedicated Billing tab.
- **Improvement Needed (Notification Preferences)**: No UI for toggling email/SMS alerts for project updates or messages.

### `FreelancerPayments.jsx`
- **Current State**: Shows "Total Share", "Received", "Pending", and "Active Projects" based on accepted proposals. Displays a table of payment history.
- **Improvement Needed (Actual Withdrawal UI)**: While it shows *what* they earned, there is absolutely no button or flow to actually *withdraw* it. A prominent "Withdraw Funds" flow needs to integrate with a payout provider (like Stripe Connect or PayPal).
- **Improvement Needed (Escrow Visibility)**: The "Pending" amount should clearly state if it is secured in Escrow vs awaiting client deposit.

### `FreelancerProfile.jsx`
- **Current State**: Extremely massive and complex component holding personal info, onboarding snapshots, skills, work experience, and services.
- **Improvement Needed (Refactoring & UX)**: The file is over 3,900 lines long, making maintenance highly error-prone. It needs to be broken down into smaller, focused sub-components.
- **Improvement Needed (Portfolio Media Management)**: The profile needs a robust drag-and-drop gallery for a visual portfolio.

### `ProjectManagerDashboard.jsx`
- **Current State**: Focuses heavily on dispute resolution and upcoming meetings/appointments.
- **Improvement Needed (Proactive Project Tracking)**: The dashboard completely lacks a high-level view of all *healthy* projects. A PM needs to see all active projects, their current phase, deadlines, and a quick health indicator (Green/Yellow/Red) before they turn into disputes.
- **Improvement Needed (Financial Oversight for PMs)**: PMs need visibility into the budget burn rate of a project to ensure profitability vs the freelancer bids.

### `AdminDashboard.jsx`
- **Current State**: Shows total stats, pending freelancer approvals, active disputes for PMs, and active users.
- **Improvement Needed (Platform Financial Health)**: The revenue stat is a single number. Admins need charts showing monthly recurring revenue (MRR), project volume trends, and platform fee collection trends.
- **Improvement Needed (Dispute Resolution Tools)**: While it lists disputes, admins need overriding authority controls from this dashboard (e.g., "Force Refund Client" or "Force Payout Freelancer").

---

## 6. Backend Integration & Infrastructure Gaps
*The backend currently manages database state but lacks true third-party integration for a managed marketplace.*

### `payment.controller.js` & Financial Logic
- **Current State**: Payments are manually created database records. `project.spent` is artificially updated.
- **Improvement Needed (Stripe Integration)**: Need real integration with Stripe (or similar) to generate Checkout Sessions for clients and handle Webhooks for successful payments.
- **Improvement Needed (Escrow System)**: The backend needs explicit logical ledgers for `FUNDS_IN_ESCROW` vs `FUNDS_AVAILABLE_FOR_PAYOUT`. Right now, money is just marked as "spent".
- **Improvement Needed (Freelancer Payouts)**: Integration with Stripe Connect (or PayPal Payouts) to actually disburse funds when a Project Manager clicks "Release Funds".

### `project.controller.js` & Database schema
- **Improvement Needed (Milestone/Deliverable Models)**: The Prisma schema likely needs new models for `Milestone` and `Deliverable` to track specific file submissions and their approval status by PMs/Clients, rather than just a generic `progress` integer.

### `dispute.controller.js`
- **Improvement Needed (Resolution Execution)**: When a dispute is resolved (e.g., refund client 50%, pay freelancer 50%), the backend needs the logic to execute these partial refunds and payouts via the payment gateway API, not just update the text notes.

### KYC & Identity Verification
- **Improvement Needed (Identity Models)**: A robust marketplace needs a way to verify identity for tax and fraud purposes. The backend needs to integrate with a service like Stripe Identity or Persona, and track verification status in the database before allowing withdrawals.

### Email & Notifications
- **Improvement Needed (Transactional Emails)**: While there are websocket/in-app notifications, critical marketplace actions (Invoice generated, Escrow released, Dispute opened) absolutely require robust transactional email templates (using SendGrid, Resend, or AWS SES).

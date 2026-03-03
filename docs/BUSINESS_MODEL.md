# Catalance Business Model & Product Workflows

Catalance is an AI-driven, multi-sided marketplace connecting **Clients** with **Freelancers**, mediated by **Project Managers** and overseen by **Admins**. Its primary differentiator is the **AI-Guided Onboarding and Proposal Generation**, which helps clients scope their projects without needing deep technical knowledge.

## 1. Client Onboarding & The "AI Partner"
Instead of forcing clients to write a traditional job post from scratch, Catalance uses a sophisticated AI agent.
- Clients state a vague idea (e.g., "I need a website").
- The AI cross-references the internal service catalog (`servicesComplete.json`) which contains predefined dynamic questions for services (e.g., "Web Development", "Branding Kit").
- The AI asks targeted questions in a chat interface (e.g., "Do you prefer a coded website or platform-based like Shopify?", "What is your primary objective?").
- The system extracts structured requirements, budgets (handling Indian Rupees and recognizing "k" suffixes), and timelines.
- Finally, it generates a structured **Proposal Draft**.

## 2. Intelligent Freelancer Matching
Once a proposal is shaped, the system dynamically ranks available freelancers.
- It parses the AI-generated proposal to find required skills (e.g., detecting terms like "React.js", "Node.js", "Branding").
- It compares these required skills against freelancer profiles (bio, listed services, parsed profile definitions).
- The client's dashboard presents the top matched freelancers, allowing the client to invite them directly.

## 3. Revenue Model & Upfront Escrow
Catalance monetizes the transactions securely on the platform.
- **Upfront Payments:** When a client decides to proceed with a freelancer, they must pay an upfront fee to lock the contract and begin the project (`IN_PROGRESS`). 
- **Tiered Escrow Logic:**
  - Projects > ₹2,00,000 → 25% upfront
  - Projects ≥ ₹50,000 → 33% upfront
  - Projects < ₹50,000 → 50% upfront
- **Platform Fee:** The platform takes a standard **30% commission** on payments (`PLATFORM_FEE_PERCENTAGE = 0.30`).
- **Milestones:** Money is held in the system. Project managers handle verifying the work before the freelancer is paid their 70% share.

## 4. Operational Execution & Project Management
Catalance operates on a managed marketplace model (like an agency).
- **Auto-Assignment:** When a project shifts from `OPEN` (proposal sent) to `IN_PROGRESS` (upfront paid), the system automatically assigns a **Project Manager**. The assignment logic finds the active PM with the least workload.
- **Oversight:** The PM oversees the delivery, mediating disputes, verifying milestones, and ensuring the freelancer hits the deadlines.

## User Roles & Permissions
The platform serves four distinct user types:
1. **Client**: Can chat with AI, generate proposals, invite matched freelancers, and fund projects.
2. **Freelancer**: Can set up profiles, list skills/rates, communicate with clients, and submit work for milestones.
3. **Project Manager (PM)**: An internal role assigned to active projects to oversee delivery, manage disputes, and approve freelancer payouts.
4. **Admin**: Has full oversight. Can view all users, manage global platform settings, view platform revenue, and handle escalations.

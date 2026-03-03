# Catalance Technical Architecture & Codebase

Catalance is a modern, monolithic web application using a React + Vite frontend and a Node.js/Express backend, backed by PostgreSQL (managed via Prisma). 

## 1. Database Schema (Prisma)
The database structure is robust, containing 15 core models designed to support a multi-role managed marketplace.
- **Core Entities**: `User`, `Project`, `Proposal`, `Payment`, `Dispute`, `Message`, `Conversation`.
- **Role-Based Users**: A single `User` model handles multiple roles (`CLIENT`, `FREELANCER`, `PROJECT_MANAGER`, `ADMIN`) via an enum.
- **Financials**: The `Payment` model tracks amounts, platform fees (30%), status (e.g., `PENDING`, `HELD_IN_ESCROW`, `RELEASED`), and associations with projects and users.
- **Complex Relations**: Projects tie together a Client, a chosen Freelancer, an assigned Project Manager, and multiple Proposals.

## 2. Backend Infrastructure
The backend is located in `backend/src/` and exposes a RESTful API.
- **Controllers (19 total)**: 
  - `project.controller.js`: Handles project lifecycle, PM auto-assignment (based on lowest workload), and upfront payment tiering.
  - `payment.controller.js`: Manages standard 30% platform fees, escrow flow, and admin overrides.
  - `marketplace.controller.js`: Provides filtering, pagination, and sorting for the public freelancer discovery pages.
  - `profile.controller.js`: Sophisticated parsing of freelancer JSON config definitions into normalized database rows.
- **AI Services (`ai.service.js` & `guest.controller.js`)**: 
  - Uses OpenRouter for AI inference. 
  - Contains advanced orchestration to handle conversational flow, enforce budget minimums, matching answers to predefined JSON logic trees (`servicesComplete.json`), and generating structured Markdown proposals.
- **Real-time Comms**: Integrated Socket.IO for live chat bridging Clients, Freelancers, and PMs.

## 3. Frontend Architecture
The frontend is built with React 18, Vite, React Router v7, and styled with Tailwind CSS v4.
- **Routing & Lazy Loading (`App.jsx`)**: Extensive use of component lazy loading (`React.lazy()`) grouped by feature (Marketing, Auth, Dashboards).
- **Protected Dashboards**:
  - `ClientDashboard.jsx`: Features the Proposal Workspace where clients can view AI-generated drafts, search AI-matched freelancers, manage budget/timelines, and execute upfront payments.
  - `FreelancerDashboard.jsx`: Focuses on active projects, proposals received, and milestone management.
  - `ProjectManagerDashboard.jsx` / `AdminDashboard.jsx`: Focus on system-wide aggregation, workload management, and dispute resolution.
- **AI Chat Component (`AIChat.jsx`)**: The highly complex conversational UI that renders markdown, dynamic question cards, handles "typing" states, and interfaces with the backend AI service.
- **UI Components**: Built using Radix UI primitives and custom Tailwind styling. Extensive use of motion/animations using Framer Motion and GSAP.

## 4. Key Design Patterns & Practices
- **Zod Validation**: Used extensively on the backend to validate incoming payloads before they reach controllers.
- **Graceful Degradation**: If AI APIs fail, the system falls back to predefined paths or prompts the user natively.
- **Escrow/Wallet abstractions**: The architecture anticipates secure handling of funds, utilizing "Held in Escrow" states before releasing to freelancers.
- **Monorepo setup**: The frontend and backend run side-by-side during development but operate over standard REST/Socket contracts.

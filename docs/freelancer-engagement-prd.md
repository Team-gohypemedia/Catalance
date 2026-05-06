***
> **CONTEXT FOR CHATGPT PRO ANALYSIS**
> 
> **Role & Task:** You are an expert Product Manager, Gamification Specialist, and Systems Architect. Please review the following Product and Technical Requirements Document (PRD) for a new "Freelancer Engagement" feature on **Catalance**, a platform connecting verified creative freelancers with clients. 
> 
> **Current Tech Stack:** 
> * Frontend: React (Vite) / Next.js
> * Backend: Node.js / Express.js
> * Database: MongoDB (Mongoose)
> 
> **What We Need From You:**
> 1. **Identify Loopholes:** Find any logical gaps in the streak system, points economy, or level progression.
> 2. **Gamification Review:** Are the rewards and milestones compelling enough to drive daily retention? Suggest improvements.
> 3. **AI Scalability Analysis:** Review the feasibility of the AI personalized questions (Section 7.2) and suggest the best way to architect this using LLM APIs without incurring massive costs.
> 4. **General Feedback:** Provide your honest critique on whether this feature will effectively solve freelancer retention without confusing the core matching algorithm.
***

# Freelancer Engagement, Streaks, Loyalty Rewards, and AI Daily Questions
## Product and Technical Requirements Document

### 1. Overview
This document explains a new freelancer engagement feature for the website. The purpose is to make freelancers come back daily, improve their skills, keep them active on the platform, reward loyal freelancers, and create a better learning and performance signal for the business.

The feature includes daily streaks, loyalty points, rewards such as T-shirts or other merchandise, hackathons, daily AI-generated questions, personalized freelancer-level questions, and a freelancer progress report.

### 2. Objective
* Increase daily freelancer activity on the website.
* Create a habit where freelancers visit the platform every day.
* Improve freelancer knowledge, communication, and project readiness through daily questions.
* Use AI to generate five common questions for all freelancers every day.
* Use AI to generate one personalized question for each freelancer based on their level and process report.
* Reward freelancers through streaks, loyalty points, badges, hackathon participation, and physical rewards.
* Build a visible progress system that helps freelancers feel they are growing on the platform.

### 3. Important Concept: Engagement Level vs Project Experience Level
This feature introduces an engagement and learning level for freelancers. This should be handled carefully because it is different from the project-matching experience level.

| Level Type | Purpose | Used For |
| :--- | :--- | :--- |
| **Project Experience Level** | Shows whether a freelancer is suitable for low, medium, or complex client projects. | Freelancer matching, project eligibility, budget fit, client recommendation. |
| **Engagement / Learning Level** | Shows how active, consistent, and improving the freelancer is on the platform. | Streaks, rewards, badges, learning progress, trust signals, internal reporting. |

**Recommendation:** Engagement level should not automatically override real project experience. It can be used as an additional trust and activity signal, but project eligibility should still depend on actual experience, portfolio, skills, project history, and admin rules.

### 4. Scope of Feature
* Freelancer daily check-in system.
* Daily streak tracking (Strict UTC Midnight cut-off).
* Loyalty points and reward system.
* AI-generated daily five common questions for all freelancers.
* AI-generated one personalized question for every freelancer (processed via background jobs).
* Freelancer engagement and learning level.
* Freelancer process report and progress tracking.
* Hackathon and challenge system.
* Admin dashboard for questions, rewards, hackathons, and freelancer progress.

### 5. Freelancer Daily Streak System
A streak system should motivate freelancers to visit the website daily and complete meaningful actions.

#### 5.1 Daily Streak Completion Rule
A freelancer earns one daily streak count when they complete:
1. Answering the five common daily questions.
2. Answering the one personalized question.
*(System automatically calculates score, updates the progress report, streak, XP, loyalty points, and badges).*

#### 5.2 Streak Milestones
| Milestone | Reward Example | Purpose |
| :--- | :--- | :--- |
| 3-day streak | Small XP bonus | Encourage new habit. |
| 7-day streak | Badge + loyalty points | First weekly achievement. |
| 15-day streak | Extra points + profile badge | Build consistency. |
| 30-day streak | Reward eligibility (e.g., T-shirt) | Strong platform loyalty. |
| 60-day streak | Premium badge + hackathon priority | Recognize serious freelancers. |
| 100-day streak | Gold loyalty reward | Recognize top active freelancers. |

#### 5.3 Missed Day Rule
* If a freelancer misses one day, the streak resets to zero by default.
* **Streak Freeze (Recommended):** Allow freelancers to "buy" a streak freeze using loyalty points to prevent demotivation.

### 6. Loyalty Points and Rewards
#### 6.1 How Freelancers Earn Points
* **Complete daily five common questions:** 5 to 25 points (depends on correct answers).
* **Complete personalized question:** 10 points.
* **Maintain 7-day streak:** Bonus 25 points.
* **Maintain 30-day streak:** Bonus 150 points.
* **Join a hackathon:** 50 points.
* **Win a hackathon:** 300+ points.
* **Improve weak skill area:** Bonus points.

#### 6.2 Reward Claim Flow
1. Freelancer earns loyalty points.
2. Freelancer opens the reward section.
3. System shows available rewards (based on points, streak, level, inventory).
4. Freelancer selects a reward.
5. System creates a reward claim request.
6. Admin verifies and approves the claim.
7. Status updates: pending -> approved -> shipped -> completed.

### 7. Daily AI Question System
#### 7.1 Five Common Daily Questions
* **Target:** All freelancers get the exact same 5 questions.
* **Categories:** Client communication, project delivery, quality control, best practices, platform rules.
* **Format:** Multiple-choice or True/False. Randomize option order to prevent cheating. Provide explanation after answering.

#### 7.2 One Personalized Daily Question
* **Target:** Different for every freelancer.
* **Inputs for AI:** Engagement level, weak topics, past answers, process report.
* **Example:** A designer struggling with revision handling gets a scenario-based question about handling a 3rd revision request.

### 8. Freelancer Engagement / Learning Level
| Engagement Level | Condition Example | Meaning |
| :--- | :--- | :--- |
| **Level 1 - Starter** | New freelancer or low activity | Needs basic workflow learning. |
| **Level 2 - Active Learner** | Completes daily questions regularly | Understands basic process. |
| **Level 3 - Skilled** | Good scores and consistent streak | Shows strong professional understanding. |
| **Level 4 - Pro** | High score, strong streak, hackathons | Highly engaged and reliable. |
| **Gold Contributor** | Long streak, high score, top performance | Top platform-engaged freelancer. |

### 9. Freelancer Process Report
Summarizes freelancer progress for AI personalization and admin tracking.
* **Tracks:** Daily accuracy, strong/weak topics, learning speed, streak history.
* **Example Output:** 
  * *Current Level:* Level 2
  * *Accuracy:* 78%
  * *Strong Area:* Client Communication
  * *Weak Area:* Scope Handling
  * *AI Recommendation:* Ask scenario-based scope questions.

### 10. Suggested Database Architecture (MongoDB/Mongoose)
To be implemented under a new `engagement` module (`src/modules/engagement`).

* **`EngagementProfile`**: `userId`, `level`, `xp`, `loyaltyPoints`, `currentStreak`, `longestStreak`, `lastCompletedDate`.
* **`DailyQuestionSet`**: `date`, `questions` (Array of objects with text, options, correctAnswer, explanation).
* **`PersonalizedQuestion`**: `userId`, `date`, `questionData`.
* **`AnswerLog`**: `userId`, `date`, `scores`, `isCompleted`.
* **`Reward` & `RewardClaim`**: Catalogs and user claims.
* **`Hackathon` & `HackathonSubmission`**.

---

### 11. Technical Addendum & MVP Plan

#### Architectural Considerations
1. **Background Job Processing (Cron):** Generating personalized questions *on-the-fly* when a user logs in will cause severe latency. Instead, implement a nightly cron job (using `node-cron` or BullMQ) to pre-generate the personalized question for all active freelancers.
2. **Timezone Standardization:** Enforce UTC Midnight as the streak reset boundary globally to avoid complicated local-timezone rollover logic. Display a countdown timer on the UI to make this clear.
3. **AI Grading Limitations:** Subjective short-answers are expensive and slow to grade via AI. Stick to Multiple Choice / True-False for the MVP.

#### MVP Phase 1 Definition (Go-To-Market)
To launch quickly and gather data, limit the initial scope:
1. **Daily Streak Counter** (UTC Midnight reset).
2. **5 Common AI Questions ONLY** (Multiple Choice). *Defer the personalized question to Phase 2.*
3. **Basic XP and Levels** (Level 1 to 5).
4. **Simple Badges** for 7, 15, and 30-day streaks.
5. **No Reward Store Yet** (Allow points to accumulate; display "Rewards Coming Soon").

#### MVP Phase 2 (Enhancements)
1. **1 Personalized AI Question per user** (Via Nightly Cron Job).
2. **Reward Store & Claim Flow**.
3. **Hackathons & Challenges**.
4. **Streak Freezes**.

/**
 * Demo seed for the platform domain (F1): settings, feature flags, default copy and support tickets.
 * DEFAULT_SETTINGS mirrors campus/api/src/lib/settings.js and DEFAULT_FAQS / DEFAULT_POLICY_TEXT mirror
 * campus/api/src/lib/platform-content.js — keep them in sync.
 * Stored settings live in the `platformSettings` collection ({ id: key, key, value }); empty = all defaults.
 */
import { daysAgo, hoursAgo } from "../utils";

export const DEFAULT_SETTINGS = {
  "flags.aiTutor": false,
  "flags.gamification": false,
  "flags.gigs": false,
  "flags.wallet": false,
  "flags.community": true,
  "flags.mentorBooking": true,
  "flags.cohorts": true,
  "flags.aspirants": true,

  "pricing.gstPercent": 18,
  "pricing.levelDefaults": {
    BEGINNER: { priceINR: 2499, durationDays: 10 },
    INTERMEDIATE: { priceINR: 5000, durationDays: 15 },
    ADVANCED: { priceINR: 10000, durationDays: 20 },
    STANDARD: { priceINR: 2499, durationDays: 10 },
  },
  "payments.advancePercent": 100,
  "payments.offlineEnabled": true,
  "payments.offlineInstructions": "Pay by UPI or bank transfer to the account shown on your invoice, then enter the UTR / reference number here. We confirm within one working day.",

  "assessment.passScore": 70,
  "assessment.maxAttempts": 2,
  "assessment.reassessWindowDays": 14,
  "verification.expiryMonths": null,

  "finance.freelancerSharePercent": 50,
  "finance.splitBasis": "CLIENT_PRICE_EX_TAX",

  "projects.offerExpiryHours": 48,

  "policies.versions": { TERMS: "2026-11-01", PRIVACY: "2026-11-01", REFUND: "2026-11-01", ASSESSMENT_POLICY: "2026-11-01", PROJECT_POLICY: "2026-11-01" },
  "policies.text": { TERMS: "", PRIVACY: "", REFUND: "", ASSESSMENT_POLICY: "", PROJECT_POLICY: "" },
  "content.noGuarantee": "Passing an assessment makes you eligible for relevant project opportunities. Projects and earnings are not guaranteed.",
  "content.hero": {
    title: "Learn a skill. Prove it. Get verified.",
    subtitle: "Build practical digital skills and become eligible for freelance projects through Catalance.",
  },
  "content.faqs": [],
  "support.email": "support@catalance.in",
};

export const POLICY_DOCS = { terms: "TERMS", privacy: "PRIVACY", refund: "REFUND", assessment: "ASSESSMENT_POLICY", project: "PROJECT_POLICY" };

export const DEFAULT_FAQS = [
  { q: "What is Catalance Campus?", a: "Campus is the learning side of Catalance. You learn a practical digital skill, prove it in a final assessment and get verified for that skill." },
  { q: "How much does a course cost?", a: "Each course shows its fee, duration and level before you enrol. Fees exclude GST, which is shown separately at checkout." },
  { q: "How do I pay?", a: "Pay the full fee in advance by UPI, card or net banking. Where offline payment is offered, enter your payment reference and we confirm it within one working day." },
  { q: "Can I get a refund?", a: "Refunds follow the Refund and Cancellation Policy. Read it before you pay. To ask for one, raise a ticket in Help and support." },
  { q: "How does the final assessment work?", a: "Each course ends with one practical task. An evaluator scores it against a published rubric. You need 70 out of 100 and every critical criterion met to pass." },
  { q: "What if I don't pass?", a: "You get written feedback and one included reassessment within 14 days. If you think the result is wrong, you can appeal once." },
  { q: "What does verified mean?", a: "You passed the assessment for a skill and level, and completed your profile. Your verification shows on your profile and can be checked with its code." },
  { q: "Will I get projects after I am verified?", a: "Verification makes you eligible to be considered for suitable projects when client work is available. Projects and earnings are not guaranteed." },
  { q: "How are project payouts shown?", a: "Every project offer shows the exact amount you receive, the deliverables and the deadline before you accept. You can decline without penalty." },
  { q: "I need help. Who do I contact?", a: "Raise a ticket in Help and support after you log in, or email support. Complaints can be escalated from the ticket." },
];

const REVIEW_NOTE = "This is a plain-language summary. It is being reviewed by legal advisers and may change. The version date shows which text applies.";

export const DEFAULT_POLICY_TEXT = {
  TERMS: `${REVIEW_NOTE}

## Who we are
Catalance Campus ("Campus") is part of Catalance. You use one Catalance account for both.

## Your account
Keep your login safe. Give true details. One person, one account.

## Courses
Each course shows its level, fee, duration and outcome before you enrol. Course content is for your own learning. Do not share or resell it.

## Assessments and verification
Passing a course assessment and completing your profile can verify that skill. A course completion certificate is not a skill verification. We may revoke a verification if work was copied or details were false.

## Projects
Verification makes you eligible to be considered for projects. Projects and earnings are not guaranteed. Each project offer has its own terms that you accept or decline.

## Conduct
Be respectful. No plagiarism, no sharing of client information, no attempts to take work outside Catalance.

## Changes
We may update these terms. We show the new version date and ask you to accept it where needed.`,

  PRIVACY: `${REVIEW_NOTE}

## What we collect
Your account details, your learning progress, your submissions and assessment results, payment records and support tickets.

## Why
To run your courses, score your assessments, verify skills, match verified learners to suitable projects, take payments and help you.

## Who sees it
Evaluators see the submissions they score. Project managers see verified skills and availability, never your contact details unless you accept a project. Payment details are handled by our payment provider.

## Your choices
Marketing messages are optional and you can withdraw consent at any time. You can ask for a copy of your data or ask us to delete it through Help and support.

## Security
Access is limited by role. Privileged actions are logged.`,

  REFUND: `${REVIEW_NOTE}

## Payment
Course fees are paid in full in advance. GST is shown separately.

## Cancellation before you start
If you cancel before you open the first lesson, you can ask for a full refund within 7 days of payment.

## After you start
Once you have opened lessons or started the assessment, fees are generally not refundable, except where the course was cancelled or changed by us.

## How to ask
Raise a ticket in Help and support with the category "Payment". We reply within 3 working days. Approved refunds go back to the original payment method.`,

  ASSESSMENT_POLICY: `${REVIEW_NOTE}

## The task
Each course has one final practical assessment with a published brief and rubric.

## Passing
You pass with a score of at least 70 out of 100 and every critical criterion met. The exact rubric version used is kept with your result.

## Reassessment
If you don't pass, you get written feedback and one included reassessment within 14 days.

## Appeals
You can appeal a result once, with a reason. A different reviewer decides.

## Your own work
Submit only your own work. Copied or AI-generated work presented as your own fails and may lead to a revoked verification.`,

  PROJECT_POLICY: `${REVIEW_NOTE}

## Offers
A project manager may offer you a project that matches your verified skill. Offers are not guaranteed and depend on client work being available.

## Before you accept
Each offer shows the deliverables, deadline, revision limit and the exact payout you receive. Accept only if you can deliver on time.

## Declining
You can decline any offer. Declining has no penalty.

## Delivery
Submit work through Campus. The project manager reviews it and may ask for revisions within the agreed limit.

## Payout
Payout becomes due after the client accepts the work. Payouts are made by Catalance to your registered payout details.

## Confidentiality
Keep client information private. Do not contact clients outside Catalance.`,
};

const msg = (id, authorId, authorName, body, at, internal = false) => ({ id, authorId, authorName, body, internal, at });

const supportTickets = [
  {
    id: "tk_1",
    userId: "u_student",
    category: "PAYMENT",
    subject: "Payment done but course still locked",
    body: "I paid by UPI yesterday for the UI/UX course and entered the UTR, but the course still shows Enrol. Can you check?",
    status: "RESOLVED",
    priority: "NORMAL",
    ownerId: "u_finance",
    relatedType: null,
    relatedId: null,
    messages: [
      msg("tm_1", "u_finance", "Neha Kapoor (Support)", "Thanks Aarav. The bank confirmed your transfer this morning. Your course is open now. Sorry for the wait.", hoursAgo(30)),
      msg("tm_2", "u_finance", "Neha Kapoor (Support)", "UTR matched with HDFC statement. Verified offline order.", hoursAgo(30), true),
      msg("tm_3", "u_student", "Aarav Sharma", "It works now. Thank you!", hoursAgo(28)),
    ],
    resolution: "Offline payment verified and enrolment opened.",
    resolvedAt: hoursAgo(28),
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(28),
  },
  {
    id: "tk_2",
    userId: "u_student",
    category: "ASSESSMENT",
    subject: "Can I submit a Figma link instead of a PDF?",
    body: "The assessment brief says PDF or link. Is a view-only Figma link fine, or do you need an export?",
    status: "OPEN",
    priority: "NORMAL",
    ownerId: null,
    relatedType: null,
    relatedId: null,
    messages: [],
    resolution: null,
    resolvedAt: null,
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    id: "tk_3",
    userId: "s_3",
    category: "COMPLAINT",
    subject: "Evaluator feedback was not clear",
    body: "My feedback says the layout needs work but doesn't say which screens. I would like a clearer explanation before I reassess.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    ownerId: "u_admin",
    relatedType: null,
    relatedId: null,
    messages: [msg("tm_4", "u_admin", "Campus Admin (Support)", "We've asked the evaluator to add notes per screen. You'll hear from us by tomorrow.", hoursAgo(20))],
    resolution: null,
    resolvedAt: null,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(20),
  },
  {
    id: "tk_4",
    userId: "s_7",
    category: "PROJECT",
    subject: "Deadline on project offer is too tight",
    body: "The offer asks for 3 landing pages in 2 days. Is it possible to get 4 days? Otherwise I'll decline.",
    status: "OPEN",
    priority: "NORMAL",
    ownerId: null,
    relatedType: null,
    relatedId: null,
    messages: [],
    resolution: null,
    resolvedAt: null,
    createdAt: hoursAgo(9),
    updatedAt: hoursAgo(9),
  },
];

export default {
  platformSettings: [],
  supportTickets,
};

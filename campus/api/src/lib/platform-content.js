/**
 * Default public copy used when the matching admin setting is empty (spec §1.1: policy text and FAQs are editable
 * from admin without code changes; these are only the fallbacks). Mirrored in web/src/mocks/data/platform.js.
 * Legal text here is a plain-language starting point and must be reviewed by legal advisers before launch.
 */

/** URL slug → policy key used in settings ("policies.versions" / "policies.text") and ConsentRecord.purpose */
export const POLICY_DOCS = {
  terms: "TERMS",
  privacy: "PRIVACY",
  refund: "REFUND",
  assessment: "ASSESSMENT_POLICY",
  project: "PROJECT_POLICY",
};

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

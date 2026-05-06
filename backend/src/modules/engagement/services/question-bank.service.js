import crypto from "crypto";
import { prisma } from "../../../lib/prisma.js";
import { engagementRules } from "../config/engagement-rules.config.js";

const DIFFICULTY_COPY = {
  BEGINNER: "Choose the best first response.",
  INTERMEDIATE: "Choose the most professional response.",
  ADVANCED: "Choose the response that protects trust and delivery quality."
};

const VARIANT_COPY = [
  "Focus on the immediate next step.",
  "Focus on reducing client risk."
];

const CATEGORY_SCENARIOS = [
  {
    category: "CLIENT_COMMUNICATION",
    skillTag: "expectation_setting",
    stems: [
      {
        text: "A client gives a vague request and wants work to begin immediately.",
        correct: "Ask focused clarifying questions and confirm the expected outcome before starting.",
        wrong: [
          "Start immediately and decide details later.",
          "Tell the client the request is impossible.",
          "Ignore unclear parts and deliver your own interpretation."
        ],
        explanation:
          "Clear expectations reduce rework and help both sides agree on what success looks like."
      },
      {
        text: "A client asks for a status update earlier than planned.",
        correct: "Share a concise progress update, current blocker if any, and next milestone.",
        wrong: [
          "Wait until the planned update time without replying.",
          "Send a long technical explanation with no next step.",
          "Say everything is done even if it is not."
        ],
        explanation:
          "Fast, honest updates build confidence without overloading the client."
      },
      {
        text: "A client sends emotional feedback after seeing a draft.",
        correct: "Acknowledge the concern, restate the goal, and ask for specific change priorities.",
        wrong: [
          "Defend every design choice immediately.",
          "Delete the draft and restart without discussion.",
          "Tell the client their feedback is wrong."
        ],
        explanation:
          "Good feedback handling turns frustration into concrete next actions."
      }
    ]
  },
  {
    category: "SCOPE_MANAGEMENT",
    skillTag: "revision_handling",
    stems: [
      {
        text: "A client asks for extra deliverables that were not included in the agreed scope.",
        correct: "Explain the original scope and suggest a paid add-on or revised timeline.",
        wrong: [
          "Complete the extra work silently.",
          "Reject the client without explanation.",
          "Stop responding until the client changes the request."
        ],
        explanation:
          "Scope changes should be handled clearly so the relationship stays professional and sustainable."
      },
      {
        text: "A client keeps adding small changes after final approval.",
        correct: "Group the changes, confirm which are in scope, and price or schedule anything extra.",
        wrong: [
          "Accept unlimited changes to avoid conflict.",
          "Mark the project complete without replying.",
          "Ask the client to contact support before you respond."
        ],
        explanation:
          "Grouping requests prevents scattered work and creates a clean decision point."
      },
      {
        text: "A project brief has no clear list of deliverables.",
        correct: "Create a short deliverables checklist and ask the client to confirm it.",
        wrong: [
          "Assume the client wants every possible deliverable.",
          "Only work on the easiest item.",
          "Start billing time without a shared checklist."
        ],
        explanation:
          "A confirmed checklist protects both delivery quality and payment expectations."
      }
    ]
  },
  {
    category: "DELIVERY",
    skillTag: "milestone_planning",
    stems: [
      {
        text: "You realize a milestone may be delayed by one day.",
        correct: "Tell the client early, explain the reason briefly, and give the revised delivery time.",
        wrong: [
          "Wait until the deadline passes.",
          "Send no update because the delay is small.",
          "Deliver unfinished work and hope the client does not notice."
        ],
        explanation:
          "Early timeline communication protects trust even when the news is not ideal."
      },
      {
        text: "A client wants to review progress before the final delivery.",
        correct: "Share a controlled preview with clear notes on what is ready and what is still pending.",
        wrong: [
          "Send all raw files with no context.",
          "Refuse any review until the final day.",
          "Share a preview and call it final."
        ],
        explanation:
          "A controlled preview helps collect useful feedback without confusing draft and final states."
      },
      {
        text: "You finished early but still need quality checks.",
        correct: "Run the checks before delivery and then send a concise handoff note.",
        wrong: [
          "Send immediately without testing.",
          "Delay without telling the client.",
          "Ask the client to find any issues themselves."
        ],
        explanation:
          "Finishing early is useful only when the delivered work is still checked and reliable."
      }
    ]
  },
  {
    category: "QUALITY_CONTROL",
    skillTag: "review_checklist",
    stems: [
      {
        text: "Before submitting a final file, what is the strongest quality habit?",
        correct: "Review it against the brief, test key requirements, and check naming/version details.",
        wrong: [
          "Only check if the file opens.",
          "Send the first export because speed matters most.",
          "Ask the client to fix minor mistakes."
        ],
        explanation:
          "A short quality checklist catches avoidable mistakes before the client sees them."
      },
      {
        text: "You notice a small issue after sending a delivery.",
        correct: "Notify the client, fix it quickly, and provide the corrected version clearly.",
        wrong: [
          "Hope the client does not see it.",
          "Delete the message from chat.",
          "Blame the client brief immediately."
        ],
        explanation:
          "Owning and fixing small issues quickly is usually better than hiding them."
      },
      {
        text: "A project has multiple files and versions.",
        correct: "Use clear file names and include a simple version note in the handoff.",
        wrong: [
          "Send every file with random names.",
          "Put final work in a folder named test.",
          "Let the client guess which file is latest."
        ],
        explanation:
          "Clear file naming reduces client confusion and prevents old versions being used."
      }
    ]
  },
  {
    category: "PLATFORM_RULES",
    skillTag: "platform_safety",
    stems: [
      {
        text: "A client asks to move payment outside the platform.",
        correct: "Keep payment on-platform and explain that it protects both sides.",
        wrong: [
          "Accept the off-platform payment to save time.",
          "Share personal payment details immediately.",
          "Continue outside the platform and delete the chat."
        ],
        explanation:
          "On-platform payment keeps records, protections, and dispute handling available."
      },
      {
        text: "A client asks for personal documents unrelated to the project.",
        correct: "Decline politely and share only information required by platform-approved workflows.",
        wrong: [
          "Send any document the client asks for.",
          "Ask another freelancer to send theirs.",
          "Post the documents in a public chat."
        ],
        explanation:
          "Freelancers should protect personal data and use official verification flows."
      },
      {
        text: "A dispute begins because the client says the delivery is incomplete.",
        correct: "Collect the brief, delivery proof, and chat history, then follow the platform process.",
        wrong: [
          "Argue in chat without evidence.",
          "Delete earlier files and messages.",
          "Refuse to participate in the dispute process."
        ],
        explanation:
          "A calm evidence trail helps resolve disputes fairly."
      }
    ]
  },
  {
    category: "BUSINESS_BASICS",
    skillTag: "professional_operations",
    stems: [
      {
        text: "You are offered a project below your minimum viable budget.",
        correct: "Explain what can fit the budget or propose a smaller paid scope.",
        wrong: [
          "Accept and plan to reduce quality later.",
          "Reject without any useful option.",
          "Increase the price after the client accepts."
        ],
        explanation:
          "Budget-fit conversations work best when you offer a clear scope alternative."
      },
      {
        text: "A client asks why your price is higher than another freelancer's.",
        correct: "Explain your process, deliverables, and quality checks without insulting others.",
        wrong: [
          "Say the other freelancer is bad.",
          "Drop your price without changing scope.",
          "Ignore the question."
        ],
        explanation:
          "Professional pricing is about value, clarity, and scope rather than attacking competitors."
      },
      {
        text: "You want repeat work from a satisfied client.",
        correct: "Close with a clear handoff, thank them, and mention relevant next support options.",
        wrong: [
          "Spam them with unrelated services.",
          "Ask for more money before delivery is accepted.",
          "Disappear after sending final files."
        ],
        explanation:
          "A strong closing handoff makes future collaboration easier without pressure."
      }
    ]
  }
];

export const buildQuestionContentHash = ({
  questionText,
  category,
  difficulty,
  correctOptionId
}) => {
  const normalized = [questionText, category, difficulty, correctOptionId]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");

  return crypto.createHash("sha256").update(normalized).digest("hex");
};

export const buildFallbackQuestions = () => {
  const questions = [];

  CATEGORY_SCENARIOS.forEach((categoryConfig) => {
    engagementRules.difficulties.forEach((difficulty) => {
      categoryConfig.stems.forEach((stem, index) => {
        VARIANT_COPY.forEach((variantCopy, variantIndex) => {
          const questionText = stem.text;
          const correctOptionId = "A";
          const options = [
            { id: "A", text: stem.correct },
            { id: "B", text: stem.wrong[0] },
            { id: "C", text: stem.wrong[1] },
            { id: "D", text: stem.wrong[2] }
          ];

          questions.push({
            questionText,
            type: difficulty === "ADVANCED" ? "SCENARIO_MCQ" : "MCQ",
            category: categoryConfig.category,
            skillTag: `${categoryConfig.skillTag}_${index + 1}_${variantIndex + 1}`,
            difficulty,
            options,
            correctOptionId,
            explanation: stem.explanation,
            source: "template",
            status: "APPROVED",
            contentHash: buildQuestionContentHash({
              questionText,
              category: categoryConfig.category,
              difficulty,
              correctOptionId
            })
          });
        });
      });
    });
  });

  return questions;
};

export const ensureFallbackQuestionBank = async (client = prisma) => {
  const approvedCount = await client.engagementQuestion.count({
    where: { status: "APPROVED" }
  });

  const fallbackQuestions = buildFallbackQuestions();
  if (approvedCount >= fallbackQuestions.length) {
    return { inserted: 0, totalFallback: fallbackQuestions.length };
  }

  const result = await client.engagementQuestion.createMany({
    data: fallbackQuestions,
    skipDuplicates: true
  });

  return {
    inserted: result.count,
    totalFallback: fallbackQuestions.length
  };
};

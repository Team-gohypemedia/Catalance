import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { aspirantOf } from "../lib/aspirant.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use("/api/tutor", requireFlag("aiTutor"));

const LANGUAGE_NAMES = {
  en: "English",
  hinglish: "Hinglish",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
};

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .min(1, "Ask me something first.")
    .max(60),
  language: z.string().trim().max(20).optional(),
  context: z
    .object({ courseId: z.string().trim().optional().nullable(), lessonId: z.string().trim().optional().nullable() })
    .optional()
    .nullable(),
});

const tutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: { message: "You're asking very fast! Take a breath and try again in a minute." } },
});

function systemPrompt(language, ctx, user) {
  const langName = LANGUAGE_NAMES[language] || "English";
  const langRule =
    language === "hinglish"
      ? "Reply in Hinglish: a natural Hindi-English mix written in Latin script, the way Indian college students text (e.g. \"Dekho, useEffect basically ek side effect hai...\")."
      : language === "en"
        ? "Reply in simple, clear English."
        : `Reply in ${langName}, in its native script. Keep technical terms (React, SQL, CTA, etc.) in English.`;
  const parts = [
    "You are Campus Tutor, a patient senior mentor for Indian college students on Catalance Campus, India's learn → earn → get-ranked university for tech and non-tech skills.",
    "Students come from all kinds of colleges, often tier-2/3 towns, and many are first-generation learners. Be warm, encouraging and practical, never condescending.",
    langRule,
    "Use markdown. Keep answers short: small steps, bullet points, one concrete example (Indian context where natural: local businesses, UPI, college life). Use code blocks for code.",
    "Prefer teaching over just giving answers: explain the idea, show an example, then suggest a tiny next step the student can try. For graded quizzes or assignments, guide with hints instead of handing over the final answer.",
    "If you're not sure about something, say so. Stay on learning, careers and freelancing topics.",
  ];
  if (user?.name) parts.push(`The student's name is ${user.name.split(" ")[0]}${user.stream ? ` (${user.stream}${user.year ? `, year ${user.year}` : ""})` : ""}.`);
  const aspirant = aspirantOf(user);
  if (aspirant || user?.goal === "GOVT_EXAM_BACKUP") {
    const a = aspirant || {};
    parts.push(
      [
        `This learner is a government-exam aspirant${a.examName ? ` preparing for ${a.examName}` : ""}${a.prepYears ? ` (${a.prepYears} year${a.prepYears === 1 ? "" : "s"} of prep)` : ""}, building a backup private-sector career with about ${a.dailyMinutes || 45} minutes a day alongside their preparation.`,
        "Be warm, respectful and practical. Hindi or Hinglish is welcome whenever it helps them understand; never make them feel judged for their English.",
        "Their prep years are a strength, not a gap: connect new skills to what they already know from exam prep (Quant/DI → Excel and data, English/Hindi → translation and content, Banking awareness/Accounts → Tally and GST, essays and current affairs → research writing).",
        "Answer career-switch, resume-gap and gap-year questions with concrete steps: which skill or course to start, a small portfolio piece to build, how to describe prep years on a resume, and a realistic timeline that fits their daily time budget.",
        "Never call anyone a failure or a \"failed aspirant\", and never pressure them to quit their exam. Campus is insurance alongside prep, not a replacement.",
        "Campus certificates are verified skill certificates, not degrees or government diplomas; never claim otherwise.",
        a.strengths?.length ? `Their strongest exam subjects: ${a.strengths.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  if (ctx?.course) {
    parts.push(`The student is studying the course "${ctx.course.title}"${ctx.course.track ? ` in the ${ctx.course.track.title} track` : ""}.`);
  }
  if (ctx?.lesson) {
    const l = ctx.lesson;
    const content = String(l.content || "").slice(0, 6000);
    const brief = l.assignment?.brief ? `\n\nAssignment brief:\n${String(l.assignment.brief).slice(0, 2000)}` : "";
    parts.push(
      `If lesson context is given, ground your answers in it. Current lesson: "${l.title}" (${l.type}).\n\n--- LESSON CONTENT ---\n${content}${brief}\n--- END LESSON ---`,
    );
  }
  return parts.join("\n\n");
}

function fallbackReply(language, ctx, question) {
  const topic = ctx?.lesson?.title || ctx?.course?.title;
  if (language === "hinglish") {
    return [
      `Arre, abhi mera AI brain offline hai 🙏 (server pe tutor ki API key set nahi hai).`,
      "",
      `Tab tak yeh try karo${topic ? ` for **${topic}**` : ""}:`,
      "- Lesson ko ek baar aur dhyan se padho, aur jo line samajh na aaye usse highlight karo",
      "- Community mein apna doubt post karo, mentors aur seniors jaldi reply karte hain",
      "- Kisi mentor ke saath 1:1 session book karo",
      "",
      `Tumhara sawaal tha: _"${question.slice(0, 200)}"_. Jaise hi main wapas online aaunga, isse detail mein samjhaunga!`,
    ].join("\n");
  }
  return [
    "The AI tutor is offline right now 🙏 (no tutor API key is configured on the server).",
    "",
    `Meanwhile, here's what you can do${topic ? ` for **${topic}**` : ""}:`,
    "- Re-read the lesson and note the exact line that confuses you",
    "- Post your doubt in **Community**; mentors and seniors usually reply fast",
    "- Book a 1:1 session with a mentor",
    "",
    `Your question was: _"${question.slice(0, 200)}"_. I'll be able to answer it in detail once I'm back online.`,
  ].join("\n");
}

async function loadContext(context) {
  if (context?.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: context.lessonId },
      include: { course: { select: { id: true, title: true, track: { select: { title: true } } } } },
    });
    if (lesson) return { lesson, course: lesson.course };
  }
  if (context?.courseId) {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: context.courseId }, { slug: context.courseId }] },
      select: { id: true, title: true, track: { select: { title: true } } },
    });
    if (course) return { course };
  }
  return null;
}

router.post("/api/tutor/chat", requireAuth, tutorLimiter, validate({ body: chatSchema }), async (req, res) => {
  const { messages, context } = req.body;
  const language = LANGUAGE_NAMES[req.body.language] ? req.body.language : req.user.language || "en";
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last?.content?.trim()) throw httpError(400, "Ask me something first.");

  const ctx = await loadContext(context);
  let reply;

  if (!env.openRouterKey) {
    reply = fallbackReply(language, ctx, last.content.trim());
  } else {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.corsOrigins[0] || "https://campus.catalance.in",
          "X-Title": "Catalance Campus Tutor",
        },
        body: JSON.stringify({
          model: env.aiModel,
          temperature: 0.5,
          max_tokens: 900,
          messages: [
            { role: "system", content: systemPrompt(language, ctx, req.user) },
            ...messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("[tutor] OpenRouter error", response.status, data?.error?.message || data);
        throw httpError(502, "The tutor is having trouble right now. Please try again in a moment.");
      }
      reply = data?.choices?.[0]?.message?.content?.trim();
      if (!reply) throw httpError(502, "The tutor didn't have an answer this time. Try rephrasing your question.");
    } catch (err) {
      if (err.name === "AbortError") throw httpError(504, "The tutor took too long to answer. Please try again.");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // best-effort log for analytics; never block the reply on it
  prisma.tutorMessage
    .createMany({
      data: [
        { userId: req.user.id, role: "user", content: last.content.slice(0, 8000), language, lessonId: ctx?.lesson?.id ?? null, courseId: ctx?.course?.id ?? null },
        { userId: req.user.id, role: "assistant", content: reply.slice(0, 8000), language, lessonId: ctx?.lesson?.id ?? null, courseId: ctx?.course?.id ?? null },
      ],
    })
    .catch((e) => console.warn("[tutor] log failed:", e.message));

  res.json({ reply });
});

export default router;

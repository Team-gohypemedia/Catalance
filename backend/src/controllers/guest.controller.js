import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { chatWithAI, generateProposalMarkdown } from "../services/ai.service.js";

const GREETING_ONLY_REGEX = /^(hi|hello|hey|yo|hola|good\s*(morning|afternoon|evening))[!.\s]*$/i;
const NAME_QUESTION_REGEX = /\bname\b/i;
const GREETING_SMALLTALK_REGEX =
    /\b(hi|hello|hey|yo|hola|namaste|salam|how are you|what'?s up|kya\s*hal|kaise\s*ho)\b/i;
const NAME_INTRO_REGEX = /\b(my name is|i am|i'm|this is)\b/i;

const isGreetingInsteadOfNameAnswer = (questionText = "", userText = "") => {
    if (!NAME_QUESTION_REGEX.test(questionText || "")) return false;
    const normalized = String(userText || "").toLowerCase().trim();
    if (!normalized) return false;
    if (!GREETING_SMALLTALK_REGEX.test(normalized)) return false;
    if (NAME_INTRO_REGEX.test(normalized)) return false;
    // Keep this fallback for short small-talk style replies.
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    return wordCount <= 8;
};

const parseValidationResponse = (rawMessage) => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return null;
    }

    const raw = rawMessage.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.substring(firstBrace, lastBrace + 1)
        : raw;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, ""),
        raw,
        raw.replace(/\*\*/g, ""),
    ];

    for (const candidate of candidates) {
        const normalized = candidate
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();

        if (!normalized.startsWith("{") || !normalized.endsWith("}")) {
            continue;
        }

        try {
            const parsed = JSON.parse(normalized);
            if (typeof parsed?.isValid === "boolean" && typeof parsed?.message === "string") {
                return parsed;
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    const fallback = raw.replace(/\*\*/g, "");
    const isValidMatch = fallback.match(/"isValid"\s*:\s*(true|false)/i);
    const messageMatch = fallback.match(/"message"\s*:\s*"([\s\S]*?)"/i);
    if (!isValidMatch || !messageMatch) {
        return null;
    }

    return {
        isValid: isValidMatch[1].toLowerCase() === "true",
        message: messageMatch[1].replace(/\\"/g, "\""),
    };
};

// @desc    Start a new guest session with guided questions
// @route   POST /api/guest/start
// @access  Public
export const startGuestSession = asyncHandler(async (req, res) => {
    const { serviceId } = req.body; // Can be slug or ID

    if (!serviceId) {
        throw new AppError("Service ID is required", 400);
    }

    // 1. Find the Service and its Questions
    const service = await prisma.service.findFirst({
        where: {
            OR: [
                { slug: serviceId },
                { id: serviceId }
            ],
            active: true
        },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!service) {
        throw new AppError("Service not found or inactive", 404);
    }

    const firstQuestion = service.questions[0]?.text || "How can I help you regarding this service?";
    const firstQuestionConfig = {
        type: service.questions[0]?.type || "text",
        options: service.questions[0]?.options || []
    };

    // 2. Create Session
    const session = await prisma.aiGuestSession.create({
        data: {
            serviceId: service.slug, // Store slug for consistency
            currentStep: 0,
            answers: {},
        },
    });

    // 3. Create Initial assistant message (The First Question)
    await prisma.aiGuestMessage.create({
        data: {
            sessionId: session.id,
            role: "assistant",
            content: firstQuestion,
        },
    });

    res.status(201).json({
        success: true,
        sessionId: session.id,
        message: firstQuestion,
        inputConfig: firstQuestionConfig,
        history: [{ role: "assistant", content: firstQuestion }]
    });
});

// @desc    Handle chat: Answer questions -> Generate Proposal
// @route   POST /api/guest/chat
// @access  Public
export const guestChat = asyncHandler(async (req, res) => {
    const { sessionId, message } = req.body;

    const incomingArray = Array.isArray(message)
        ? message.filter(Boolean).map(String)
        : [];
    const messageText = Array.isArray(message)
        ? incomingArray.join(", ")
        : (message ?? "");
    const trimmedMessageText = messageText.toString().trim();
    const safeMessageText = incomingArray.length ? incomingArray.join(", ") : trimmedMessageText;

    console.log(`\n--- [Guest Chat] Session: ${sessionId} ---`);
    console.log(`[User]: ${safeMessageText || message}`);

    if (!sessionId || (!trimmedMessageText && incomingArray.length === 0)) {
        throw new AppError("Session ID and message are required", 400);
    }

    // 1. Fetch Session
    const session = await prisma.aiGuestSession.findUnique({
        where: { id: sessionId },
        include: { messages: true },
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    // 2. Fetch Service Questions
    const service = await prisma.service.findUnique({
        where: { slug: session.serviceId },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!service) {
        throw new AppError("Service context lost", 404);
    }

    const questions = service.questions;
    const currentStep = session.currentStep;

    // 3. Save User Answer (Preliminary)
    // We will save it, but we might not advance step if invalid.

    // --- VALIDATION STEP ---
    let validationResult = null;
    let aiResponseContent = "";

    if (currentStep < questions.length) {
        const currentQuestionText = questions[currentStep].text;

        if (isGreetingInsteadOfNameAnswer(currentQuestionText, safeMessageText)) {
            validationResult = {
                isValid: false,
                status: "invalid_answer",
                message: "I am doing well, thanks. Please share your name so I can continue."
            };
            aiResponseContent = validationResult.message;
            console.log("[Validation Fallback]:", validationResult);
        } else {

        // Prepare context for the NEXT question if it exists
        const nextStepIndex = currentStep + 1;
        const nextQuestionText = (nextStepIndex < questions.length)
            ? questions[nextStepIndex].text
            : "This was the final question. I will now generate the proposal.";

        const validationPrompt = `
            You are a friendly, professional assistant guiding a user through a questionnaire for a "${service.name}" service.
            
            Current Question Asked: "${currentQuestionText}"
            User's Answer: "${safeMessageText}"
            
            Next Question in Script: "${nextQuestionText}"

            Task:
            1. Validate the user's answer to the Current Question.
            - If it's a greeting (hi, hello) but the question expects details -> INVALID.
            - If it's irrelevant/gibberish -> INVALID.
            - If the user is asking an informational side-question (e.g., "what is Flutter?", "which is best for me?") instead of directly answering the current question -> INFO_REQUEST.
            - Otherwise -> VALID.

            2. Generate a Response Message:
            - If INVALID: Politely ask for clarification or the specific details needed.
            - For name questions, ask for "name" only. Never ask for "full name" or "real full name".
            - If INFO_REQUEST: Give a brief helpful answer (1-2 short sentences), then ask the Current Question again so we can continue the flow.
            - If VALID: Acknowledge the answer briefly and enthusiastically, then ask the "Next Question in Script" naturally. 
              (Example: "That sounds great! Now, [Next Question]?")
              (If it's the final question, just say "Thanks! Let me put that together for you.")

            Return ONLY a raw JSON object (double quotes only) with this structure:
            {
                "isValid": boolean,
                "status": "valid_answer" | "invalid_answer" | "info_request",
                "message": string // The response to send to the user (error feedback OR next question transition)
            }
            Do not use markdown formatting, code fences, or bold text.
        `;

        // We use a separate AI call for validation. 
        const validationResponse = await chatWithAI(
            [{ role: "user", content: validationPrompt }],
            [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
            "system_validator"
        );

        if (validationResponse.success) {
            console.log(`[Validation Raw]:`, validationResponse.message);
            const parsedValidation = parseValidationResponse(validationResponse.message);
            if (parsedValidation) {
                validationResult = parsedValidation;
                aiResponseContent = parsedValidation.message;
                console.log(`[Validation Parsed]:`, parsedValidation);
            } else {
                console.warn("[Validation] Could not parse structured validator output");
            }
        } else {
            console.warn("[Validation] AI request failed");
        }
        }

        // If parsing fails, avoid advancing on obvious non-answers.
        if (!validationResult && GREETING_ONLY_REGEX.test(safeMessageText)) {
            validationResult = {
                isValid: false,
                message: "Please answer the question directly so I can continue.",
            };
        }

        if (!validationResult) {
            validationResult = { isValid: true, message: "" };
        }

        if (!validationResult.isValid) {
            if (validationResult.status === "info_request") {
                const normalizedResponse = (aiResponseContent || "").toLowerCase();
                const normalizedCurrentQuestion = (currentQuestionText || "").toLowerCase();
                if (
                    currentQuestionText &&
                    !normalizedResponse.includes(normalizedCurrentQuestion)
                ) {
                    aiResponseContent = `${aiResponseContent}\n\n${currentQuestionText}`;
                }
            }

            // INVALID ANSWER FLOW

            // 1. Save User's (Invalid) Message
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: safeMessageText,
                },
            });

            // 2. Save Assistant's Feedback Message
            const feedbackMsg = aiResponseContent || "Could you please provide more specific details?";
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: feedbackMsg,
                },
            });

            // 3. Return response WITHOUT incrementing step
            // Re-fetch messages including the new ones
            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            });

            return res.json({
                success: true,
                message: feedbackMsg,
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }
    }
    // --- END VALIDATION STEP ---

    // 3. Save User Answer (Valid)
    await prisma.aiGuestMessage.create({
        data: {
            sessionId,
            role: "user",
            content: safeMessageText,
        },
    });

    // Update answers in session
    const currentQuestionText = questions[currentStep]?.text || "General Inquiry";
    const updatedAnswers = {
        ...(session.answers || {}),
        [currentQuestionText]: safeMessageText
    };

    // Increment step OR set based on Branching Logic
    let nextStep = currentStep + 1;
    const currentQuestion = questions[currentStep];

    // Branching Logic Evaluation
    if (currentQuestion && currentQuestion.logic && Array.isArray(currentQuestion.logic)) {
        for (const rule of currentQuestion.logic) {
            let match = false;
            const userAnswers = incomingArray.length
                ? incomingArray.map(ans => ans.toLowerCase().trim())
                : [safeMessageText.toLowerCase().trim()];
            const ruleValue = (rule.value || "").toLowerCase().trim();

            if (rule.condition === "equals") {
                match = userAnswers.includes(ruleValue);
            } else if (rule.condition === "not_equals") {
                match = !userAnswers.includes(ruleValue);
            } else if (rule.condition === "contains") {
                match = userAnswers.some(ans => ans.includes(ruleValue));
            }

            if (match && rule.nextQuestionSlug) {
                // Find index of target question
                const targetIndex = questions.findIndex(q => q.slug === rule.nextQuestionSlug || q.id === rule.nextQuestionSlug);

                if (targetIndex !== -1) {
                    // Important: Ensure we don't jump backwards indefinitely or create loops (basic check: allow forward/backward but log it)
                    nextStep = targetIndex;
                    console.log(`[Logic Jump] Matched rule '${rule.condition} "${ruleValue}"', jumping to question index ${targetIndex}`);
                    break; // Stop at first matching rule
                } else {
                    console.warn(`[Logic Jump] Target question '${rule.nextQuestionSlug}' not found.`);
                }
            }
        }
    }

    await prisma.aiGuestSession.update({
        where: { id: sessionId },
        data: {
            answers: updatedAnswers,
            currentStep: nextStep
        }
    });

    // 4. Determine Next Assistant Response
    let responseContent = "";
    let nextInputConfig = { type: "text", options: [] };

    if (nextStep < questions.length) {
        // CASE A: More questions to ask
        // Use the friendly AI-generated transition if available, otherwise fallback to raw text
        responseContent = aiResponseContent || questions[nextStep].text;

        // Configure next input
        nextInputConfig = {
            type: questions[nextStep].type || "text",
            options: questions[nextStep].options || []
        };
    } else {
        // CASE B: All questions answered -> Generate Proposal
        try {
            const proposalHistory = [
                ...session.messages.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: safeMessageText }
            ];

            responseContent = await generateProposalMarkdown(
                {
                    serviceName: service.name,
                    serviceId: service.slug,
                    questionnaireAnswers: updatedAnswers
                },
                proposalHistory,
                service.name
            );
        } catch (error) {
            console.error("[Proposal] Generation failed:", error?.message || error);
            responseContent = "I have collected your requirements, but I'm having trouble generating the proposal right now. Please sign up to connect with an expert.";
        }
        // No input config for final step (or maybe CTA in future)
    }

    // 5. Save Assistant Message
    console.log(`[Assistant]: ${responseContent}`);
    await prisma.aiGuestMessage.create({
        data: {
            sessionId,
            role: "assistant",
            content: responseContent,
        },
    });

    // Re-fetch messages for complete history or append manually
    const newHistory = [
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: safeMessageText },
        { role: "assistant", content: responseContent }
    ];

    res.json({
        success: true,
        message: responseContent,
        inputConfig: nextInputConfig,
        history: newHistory
    });
});

// @desc    Get guest session history
// @route   GET /api/guest/history/:sessionId
// @access  Public
export const getGuestHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.aiGuestSession.findUnique({
        where: { id: sessionId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        },
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    res.json({
        success: true,
        messages: session.messages,
    });
});

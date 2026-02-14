import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { chatWithAI } from "../services/ai.service.js";

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

    console.log(`\n--- [Guest Chat] Session: ${sessionId} ---`);
    console.log(`[User]: ${message}`);

    if (!sessionId || !message) {
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
    let validationResult = { isValid: true };
    let aiResponseContent = "";

    if (currentStep < questions.length) {
        const currentQuestionText = questions[currentStep].text;

        // Prepare context for the NEXT question if it exists
        const nextStepIndex = currentStep + 1;
        const nextQuestionText = (nextStepIndex < questions.length)
            ? questions[nextStepIndex].text
            : "This was the final question. I will now generate the proposal.";

        const validationPrompt = `
            You are a friendly, professional assistant guiding a user through a questionnaire for a "${service.name}" service.
            
            Current Question Asked: "${currentQuestionText}"
            User's Answer: "${message}"
            
            Next Question in Script: "${nextQuestionText}"

            Task:
            1. Validate the user's answer to the Current Question.
            - If it's a greeting (hi, hello) but the question expects details -> INVALID.
            - If it's irrelevant/gibberish -> INVALID.
            - Otherwise -> VALID.

            2. Generate a Response Message:
            - If INVALID: Politely ask for clarification or the specific details needed.
            - If VALID: Acknowledge the answer briefly and enthusiastically, then ask the "Next Question in Script" naturally. 
              (Example: "That sounds great! Now, [Next Question]?")
              (If it's the final question, just say "Thanks! Let me put that together for you.")

            Return ONLY a raw JSON object (double quotes only) with this structure:
            {
                "isValid": boolean,
                "message": string // The response to send to the user (error feedback OR next question transition)
            }
        `;

        // We use a separate AI call for validation. 
        const validationResponse = await chatWithAI(
            [{ role: "user", content: validationPrompt }],
            [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
            "system_validator"
        );

        if (validationResponse.success) {
            console.log(`[Validation Raw]:`, validationResponse.message);
            try {
                // Find JSON object within response
                const startIndex = validationResponse.message.indexOf("{");
                const endIndex = validationResponse.message.lastIndexOf("}");

                if (startIndex !== -1 && endIndex !== -1) {
                    const jsonString = validationResponse.message.substring(startIndex, endIndex + 1);
                    validationResult = JSON.parse(jsonString);
                    aiResponseContent = validationResult.message;
                    console.log(`[Validation Parsed]:`, validationResult);
                } else {
                    console.warn("[Validation] No JSON found in response");
                }
            } catch (e) {
                console.error("[Validation] JSON parse error:", e.message);
            }
        } else {
            console.warn("[Validation] AI request failed");
        }

        if (!validationResult.isValid) {
            // INVALID ANSWER FLOW

            // 1. Save User's (Invalid) Message
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: message,
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
            content: message,
        },
    });

    // Update answers in session
    const currentQuestionText = questions[currentStep]?.text || "General Inquiry";
    const updatedAnswers = {
        ...(session.answers || {}),
        [currentQuestionText]: message
    };

    // Increment step OR set based on Branching Logic
    let nextStep = currentStep + 1;
    const currentQuestion = questions[currentStep];

    // Branching Logic Evaluation
    if (currentQuestion && currentQuestion.logic && Array.isArray(currentQuestion.logic)) {
        for (const rule of currentQuestion.logic) {
            let match = false;
            const userAns = message.toLowerCase().trim();
            const ruleValue = (rule.value || "").toLowerCase().trim();

            if (rule.condition === "equals") {
                match = userAns === ruleValue;
            } else if (rule.condition === "not_equals") {
                match = userAns !== ruleValue;
            } else if (rule.condition === "contains") {
                match = userAns.includes(ruleValue);
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
        const systemPrompt = `
            You are an expert freelancer consultant for the service: "${service.name}".
            The client has answered the following requirements questionnaire:
            ${JSON.stringify(updatedAnswers, null, 2)}

            Based on these requirements, generate a professional project proposal.
            Include:
            - A summary of their needs.
            - A proposed scope of work.
            - Estimated timeline and budget range.
            - A call to action to sign up for full details.
            
            Format using Markdown. Keep it concise but professional.
        `;

        const aiResponse = await chatWithAI(
            [{ role: "user", content: "Generate proposal based on my answers." }],
            [{ role: "system", content: systemPrompt }], // Using history slot for system prompt context
            service.name
        );

        if (aiResponse.success) {
            responseContent = aiResponse.message;
        } else {
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
        { role: "user", content: message },
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

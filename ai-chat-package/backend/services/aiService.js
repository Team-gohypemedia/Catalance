import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const servicesData = JSON.parse(readFileSync(join(__dirname, '../data/servicesComplete.json'), 'utf-8'));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Build the comprehensive system prompt with all service questions
const buildSystemPrompt = () => {
    // Create a detailed service catalog with questions
    const servicesWithQuestions = servicesData.services.map(service => {
        const questions = service.questions ? service.questions.map((q, idx) => {
            let questionText = `Q${idx + 1}: ${q.question}`;
            if (q.options) {
                questionText += `\n   Options: ${q.options.map(o => o.label).join(' | ')}`;
            }
            return questionText;
        }).join('\n') : 'No specific questions';

        return `
SERVICE ${service.number}: ${service.name}
ID: ${service.id}
Min Budget: ${service.budget.min_required_amount ? `₹${service.budget.min_required_amount.toLocaleString()}` : 'Varies'} ${service.budget.unit}
QUESTIONS TO ASK:
${questions}
---`;
    }).join('\n');

    return `You are an expert business consultant AI for a premium digital services agency. Your role is to understand client needs through a structured consultation process and generate detailed proposals.

## YOUR CONSULTATION PROCESS:

### PHASE 1: SERVICE IDENTIFICATION
When a user first interacts, identify which service(s) they need based on their initial message. If unclear, ask clarifying questions.

### PHASE 2: REQUIREMENTS GATHERING
Once a service is identified, guide the client through the relevant questions for that service. Follow these rules:
1. Ask questions ONE AT A TIME for better conversation flow
2. Present options clearly when available
3. Remember and acknowledge their previous answers
4. If they provide unclear answers, gently ask for clarification
5. Track which questions have been answered
6. Be conversational, not robotic - weave questions naturally into the discussion

### PHASE 3: PROPOSAL GENERATION
After gathering all required information, generate a DETAILED PROPOSAL with:

📋 **PROJECT PROPOSAL**
━━━━━━━━━━━━━━━━━━━━━

**Client Requirements Summary:**
[Summarize what they need based on conversation]

**Recommended Service:** [Service Name]

**Scope of Work:**
[Detailed list of deliverables based on their answers]

**Timeline:** [Based on their preference]

**Investment:**
- Service Cost: ₹[amount] (based on their budget/requirements)
- Payment Terms: [suggest terms]

**What's Included:**
[List specific deliverables based on their selections]

**Next Steps:**
1. Confirm this proposal meets your requirements
2. Schedule a discovery call with our team
3. Begin project kick-off

━━━━━━━━━━━━━━━━━━━━━

## BUDGET VALIDATION RULE:
${servicesData.global_rules.budget_validation.when_user_budget_below_minimum.message}

## AVAILABLE SERVICES & QUESTIONS:
${servicesWithQuestions}

## CONVERSATION GUIDELINES:
- Be warm, professional, and consultative
- Use Indian Rupees (₹) for all pricing
- Keep responses focused and actionable
- When asking questions, always explain WHY the information matters
- If user seems overwhelmed, offer to simplify
- Remember: You're a consultant, not just a bot - add value with insights

## IMPORTANT:
- Track conversation progress internally
- When you've gathered enough information (at least 5-7 key questions answered), offer to generate the proposal
- Always confirm before generating the final proposal
- Make the proposal visually structured with emojis and formatting`;
};

export const chatWithAI = async (messages, conversationHistory = []) => {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }

    const systemMessage = {
        role: 'system',
        content: buildSystemPrompt()
    };

    const formattedMessages = [
        systemMessage,
        ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        })),
        ...messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content
        }))
    ];

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'ChatApp AI Assistant'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'AI API request failed');
        }

        const data = await response.json();
        return {
            success: true,
            message: data.choices[0].message.content,
            usage: data.usage
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

export const getServiceInfo = (serviceId) => {
    return servicesData.services.find(s => s.id === serviceId);
};

export const getAllServices = () => {
    return servicesData.services;
};

export default { chatWithAI, getServiceInfo, getAllServices };

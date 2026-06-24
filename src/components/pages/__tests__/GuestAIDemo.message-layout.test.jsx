import { describe, expect, it } from "vitest";

import {
  parseAssistantMessageLayout,
  repairSplitStrongEmphasis,
  splitContextAndQuestion,
} from "@/components/pages/guestAiMessageLayout";

describe("GuestAIDemo assistant message layout", () => {
  it("keeps domains inside the question instead of splitting off the TLD", () => {
    const split = splitContextAndQuestion(
      "From your point of view, what would you most like to improve compared to the current gohypemedia.com?",
    );

    expect(split.contextText).toBe("");
    expect(split.questionText).toBe(
      "From your point of view, what would you most like to improve compared to the current gohypemedia.com?",
    );
  });

  it("preserves a domain-based question when parsing interactive option cards", () => {
    const parsed = parseAssistantMessageLayout(`Got it, so the new site's main job is to bring in more client leads.

You can choose a few:

From your point of view, what would you most like to improve compared to the current gohypemedia.com?
1. Convert visitors into leads
2. User experience & navigation
3. SEO & search visibility`);

    expect(parsed.questionText).toContain("gohypemedia.com?");
    expect(parsed.questionText).not.toBe("com?");
    expect(parsed.options).toHaveLength(3);
  });

  it("keeps closing parentheses attached to the real question instead of isolating )?", () => {
    const parsed = parseAssistantMessageLayout(`Since gohype is a footwear e-commerce brand with 3D animation, I want to make sure the site matches your vibe and target audience.

For this project, it helps to understand your vision a bit more so we design the right structure, visuals, and product flow.

Can you tell me a bit more about your website idea - for example, who you're targeting (sneakerheads, budget buyers, premium footwear, streetwear, etc.), and what kind of 3D/animation experience you imagine (3D rotating shoes, animated homepage, try-on, etc.)?`);

    expect(parsed.questionText).toContain("etc.)?");
    expect(parsed.questionText).not.toBe(")?");
    expect(parsed.contextText).toContain("Since gohype is a footwear e-commerce brand");
  });

  it("keeps wrapped comma continuations inside the same question", () => {
    const parsed = parseAssistantMessageLayout(`Got it, GoHype is a solid name for a clothing brand.

Since you mentioned a clothing website in Next.js, it'll help to understand the concept a bit more so we design it right for your audience.

Tell me a little about your website - what kind of clothing brand is GoHype (streetwear, ethnic, luxury, basics, etc.)
, and how do you imagine the site feeling for visitors?`);

    expect(parsed.contextText).toContain("Since you mentioned a clothing website in Next.js");
    expect(parsed.questionText).toContain("what kind of clothing brand is GoHype");
    expect(parsed.questionText).toContain(", and how do you imagine the site feeling for visitors?");
    expect(parsed.questionText).not.toBe(", and how do you imagine the site feeling for visitors?");
  });

  it("repairs strong markers that accidentally split a word", () => {
    expect(
      repairSplitStrongEmphasis("**Nice, a fashion e-commerce site is a gre**at space to be in."),
    ).toBe("**Nice, a fashion e-commerce site is a great** space to be in.");

    const parsed = parseAssistantMessageLayout(`**Nice, a fashion e-commerce site is a gre**at space to be in.

Since you'll be selling products online, we can structure it around smooth browsing, filters, and a clean checkout.

To get things rolling, could you share your name?`);

    expect(parsed.contextText).toContain("**Nice, a fashion e-commerce site is a great** space to be in.");
  });

  it("does not split the question on e.g., and protects both dots", () => {
    const parsed = parseAssistantMessageLayout(`Got it, so the brand name is goupe.

You mentioned a Webflow ecommerce fashion site with 3D animation, so it'll help to understand the vibe and content a bit more.

This lets us plan structure, visuals, and animations that actually fit your brand instead of just looking "cool."

Can you tell me a little about your website—what you'll sell, who it's for, and the kind of style or feeling you want (e.g., luxury, streetwear, minimal, edgy)?`);

    expect(parsed.questionText).toBe("Can you tell me a little about your website—what you'll sell, who it's for, and the kind of style or feeling you want (e.g., luxury, streetwear, minimal, edgy)?");
    expect(parsed.contextText).toContain("This lets us plan structure, visuals");
  });

  it("merges the layout back into contextText if the question has malformed parentheses", () => {
    // If the question only gets unmatched parenthesis due to some bad splitting
    const parsed = parseAssistantMessageLayout(`What is your favorite food? Here is some context (which shouldn't split
    
    )?`);
    expect(parsed.questionText).toBe("");
    expect(parsed.contextText).toContain("What is your favorite food?");
  });

  it("merges the layout back into contextText if the question is extremely short", () => {
    const parsed = parseAssistantMessageLayout(`This is some long context about your request.
    
    Q?`);
    expect(parsed.questionText).toBe("");
    expect(parsed.contextText).toContain("This is some long context");
  });

  it("correctly handles the 3D-animated fashion e-commerce onboarding prompt", () => {
    const content = `Nice, a 3D-animated fashion e-commerce site on Webflow is a great direction.

From what you said, this sounds like:

Goal: Sell products online
Type: E-commerce Store
Platform: Webflow
Style: Strong focus on 3D animation / motion for a premium visual experience
On Webflow, we can mix:

3D product presentation (embedded 3D models or “3D-like” interactions with scroll and hover animations)
Smooth page transitions and micro-interactions
A clean, conversion-focused checkout with Webflow Ecommerce (or a connected checkout if needed)
To guide you better on structure, visuals, and features, I’d love to know:

What’s your name?`;

    const parsed = parseAssistantMessageLayout(content);
    expect(parsed.questionText).toBe("What’s your name?");
    expect(parsed.contextText).toContain("Nice, a 3D-animated fashion");
    expect(parsed.contextText).toContain("To guide you better on structure, visuals, and features, I’d love to know:");
  });

  it("extracts a request starting with I'd love to know as questionText even if it ends with a period", () => {
    const content = `Nice to meet you, Ravindra.

This is for an ecommerce fashion website in Webflow with 3D animation, so it'll help to align the design and brand feel with your label identity.

For that, I'd love to know your company or brand name.`;

    const parsed = parseAssistantMessageLayout(content);
    expect(parsed.questionText).toBe("For that, I'd love to know your company or brand name.");
    expect(parsed.contextText).toContain("Nice to meet you, Ravindra.");
    expect(parsed.contextText).toContain("so it'll help to align the design");
  });
});

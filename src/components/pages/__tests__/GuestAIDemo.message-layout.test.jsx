import { describe, expect, it } from "vitest";

import {
  parseAssistantMessageLayout,
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
});

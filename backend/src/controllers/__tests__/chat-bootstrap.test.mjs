import test from "node:test";
import assert from "node:assert/strict";

import {
  buildClientChatBootstrapFromData,
  hasUnlockedProjectChatRecord,
} from "../../lib/client-chat-bootstrap.js";

const baseProposal = {
  id: "proposal_1",
  amount: 1000,
  freelancerId: "freelancer_1",
  createdAt: "2026-04-10T10:00:00.000Z",
  updatedAt: "2026-04-10T12:00:00.000Z",
  freelancer: {
    id: "freelancer_1",
    fullName: "Kshitij Sharma",
    avatar: "https://example.com/avatar.png",
  },
  project: {
    id: "project_1",
    ownerId: "client_1",
    title: "Moliko",
    status: "IN_PROGRESS",
    spent: 200,
    clientName: "Mohd Kaif",
    businessName: "Moliko",
    serviceType: "Web Development",
    serviceKey: "web-development",
    budget: 1000,
    verifiedTasks: [],
    paymentPlanVersion: "v1",
    updatedAt: "2026-04-10T12:00:00.000Z",
  },
};

test("hasUnlockedProjectChatRecord blocks kickoff-unpaid projects", () => {
  const locked = hasUnlockedProjectChatRecord(
    {
      ...baseProposal.project,
      spent: 0,
      status: "AWAITING_PAYMENT",
    },
    baseProposal,
  );

  assert.equal(locked, false);
});

test("hasUnlockedProjectChatRecord unlocks once kickoff payment is covered", () => {
  const unlocked = hasUnlockedProjectChatRecord(baseProposal.project, baseProposal);
  assert.equal(unlocked, true);
});

test("buildClientChatBootstrapFromData prefers the conversation that has message history", () => {
  const result = buildClientChatBootstrapFromData({
    currentUserId: "client_1",
    proposals: [baseProposal],
    conversations: [
      {
        id: "conversation_empty",
        service: "CHAT:project_1:client_1:freelancer_1",
        updatedAt: "2026-04-10T11:00:00.000Z",
        lastMessage: null,
        messageCount: 0,
      },
      {
        id: "conversation_real",
        service: "CHAT:project_1:client_1:freelancer_1",
        updatedAt: "2026-04-10T13:00:00.000Z",
        lastMessage: {
          id: "message_1",
          conversationId: "conversation_real",
          content: "Final draft shared.",
          createdAt: "2026-04-10T13:00:00.000Z",
        },
        messageCount: 1,
      },
    ],
  });

  assert.equal(result.conversations.length, 1);
  assert.equal(result.conversations[0].conversationId, "conversation_real");
  assert.equal(result.conversations[0].previewText, "Final draft shared.");
});

test("buildClientChatBootstrapFromData omits completed projects with no history", () => {
  const result = buildClientChatBootstrapFromData({
    currentUserId: "client_1",
    proposals: [
      {
        ...baseProposal,
        project: {
          ...baseProposal.project,
          id: "project_2",
          status: "COMPLETED",
        },
      },
    ],
    conversations: [],
  });

  assert.equal(result.conversations.length, 0);
});

test("buildClientChatBootstrapFromData reports locked accepted projects separately", () => {
  const result = buildClientChatBootstrapFromData({
    currentUserId: "client_1",
    proposals: [
      {
        ...baseProposal,
        project: {
          ...baseProposal.project,
          spent: 0,
          status: "AWAITING_PAYMENT",
        },
      },
    ],
    conversations: [],
  });

  assert.equal(result.conversations.length, 0);
  assert.equal(result.hasLockedAcceptedProjects, true);
});

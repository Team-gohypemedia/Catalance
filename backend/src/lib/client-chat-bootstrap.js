import { resolveProjectPaymentPlan } from "../modules/projects/project-payment-plan.js";
import {
  CHAT_SERVICE_LABEL,
  buildProjectChatServiceKey,
  serializeChatMessage,
} from "./chat-conversation.js";
import { prisma } from "./prisma.js";

const normalizeText = (value = "") => String(value || "").trim();

const normalizeComparableText = (value = "") =>
  normalizeText(value).toLowerCase();

const getTimeValue = (value) => {
  if (!value) return 0;

  const parsed =
    typeof value === "number" ? value : new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = normalizeText(value);
    if (text) {
      return text;
    }
  }

  return "";
};

const getFreelancerName = (proposal = {}) =>
  getFirstNonEmptyText(
    proposal?.freelancer?.fullName,
    proposal?.freelancer?.email,
    "Freelancer",
  );

const getConversationPreview = (item = {}) => {
  if (normalizeText(item?.lastMessage?.content)) {
    return normalizeText(item.lastMessage.content);
  }

  if (normalizeText(item?.lastMessage?.attachment?.name)) {
    return `Attachment: ${normalizeText(item.lastMessage.attachment.name)}`;
  }

  if (normalizeText(item?.projectTitle)) {
    return normalizeText(item.projectTitle);
  }

  if (normalizeText(item?.serviceLabel)) {
    return normalizeText(item.serviceLabel);
  }

  return "Open the conversation to continue the project discussion.";
};

const hasHistory = (conversation = null) =>
  Boolean(
    conversation?.lastMessage ||
      Number(conversation?.messageCount || 0) > 0,
  );

const selectPreferredConversation = (current, candidate) => {
  if (!current) return candidate;
  if (!candidate) return current;

  const currentHasMessages = hasHistory(current);
  const candidateHasMessages = hasHistory(candidate);

  if (candidateHasMessages && !currentHasMessages) {
    return candidate;
  }

  if (!candidateHasMessages && currentHasMessages) {
    return current;
  }

  return getTimeValue(candidate.updatedAt) > getTimeValue(current.updatedAt)
    ? candidate
    : current;
};

export const hasUnlockedProjectChatRecord = (project = {}, proposal = null) => {
  const normalizedStatus = normalizeText(project?.status).toUpperCase();

  if (normalizedStatus === "COMPLETED") {
    return true;
  }

  const acceptedProposal = proposal
    ? {
        id: proposal.id,
        amount: proposal.amount,
        status: "ACCEPTED",
        freelancerId: proposal.freelancerId,
      }
    : null;

  const paymentPlan = resolveProjectPaymentPlan({
    ...project,
    proposals: acceptedProposal ? [acceptedProposal] : [],
  });

  if (!paymentPlan) {
    return false;
  }

  const installments = Array.isArray(paymentPlan.installments)
    ? paymentPlan.installments
    : [];
  const firstInstallment = installments[0] || null;
  const nextDueInstallment = paymentPlan.nextDueInstallment || null;
  const hasPaidInstallment = installments.some(
    (installment) => installment?.isPaid,
  );
  const firstInstallmentPaid = Boolean(firstInstallment?.isPaid);
  const hasFirstPhaseMovedForward = Number(nextDueInstallment?.sequence) > 1;
  const kickoffPaymentStillDue =
    Number(nextDueInstallment?.sequence) === 1 ||
    normalizedStatus === "AWAITING_PAYMENT" ||
    normalizedStatus === "PENDING_PAYMENT";

  if (kickoffPaymentStillDue) {
    return false;
  }

  if (
    paymentPlan.isFullyPaid ||
    firstInstallmentPaid ||
    hasPaidInstallment ||
    hasFirstPhaseMovedForward
  ) {
    return true;
  }

  return false;
};

const buildConversationMetaByService = (conversations = []) => {
  const byService = new Map();

  for (const conversation of conversations) {
    const serviceKey = normalizeText(conversation?.service);
    if (!serviceKey) {
      continue;
    }

    const current = byService.get(serviceKey);
    byService.set(
      serviceKey,
      selectPreferredConversation(current, conversation),
    );
  }

  return byService;
};

export const buildClientChatBootstrapFromData = ({
  currentUserId = null,
  proposals = [],
  conversations = [],
} = {}) => {
  const conversationMetaByService = buildConversationMetaByService(conversations);
  const seenServiceKeys = new Set();
  const rows = [];
  let hasLockedAcceptedProjects = false;

  for (const proposal of proposals) {
    const project = proposal?.project;
    const projectId = normalizeText(project?.id);
    const ownerId = normalizeText(project?.ownerId);
    const freelancerId = normalizeText(proposal?.freelancerId);

    if (!projectId || !ownerId || !freelancerId) {
      continue;
    }

    if (normalizeComparableText(freelancerId) === normalizeComparableText(currentUserId)) {
      continue;
    }

    const serviceKey = buildProjectChatServiceKey({
      projectId,
      ownerId,
      freelancerId,
    });

    if (!serviceKey || seenServiceKeys.has(serviceKey)) {
      continue;
    }

    seenServiceKeys.add(serviceKey);

    const chatUnlocked = hasUnlockedProjectChatRecord(project, proposal);
    if (!chatUnlocked) {
      hasLockedAcceptedProjects = true;
      continue;
    }

    const conversationMeta = conversationMetaByService.get(serviceKey) || null;
    const projectStatus = normalizeText(project?.status).toUpperCase();

    if (projectStatus === "COMPLETED" && !hasHistory(conversationMeta)) {
      continue;
    }

    const businessName = getFirstNonEmptyText(
      project?.businessName,
      project?.clientName,
    );
    const serviceLabel = getFirstNonEmptyText(
      project?.serviceType,
      project?.serviceKey,
      CHAT_SERVICE_LABEL,
    );
    const projectTitle = getFirstNonEmptyText(
      businessName,
      project?.title,
      serviceLabel,
      CHAT_SERVICE_LABEL,
    );
    const lastActivity = getTimeValue(
      conversationMeta?.lastMessage?.createdAt ||
        conversationMeta?.updatedAt ||
        proposal?.updatedAt ||
        project?.updatedAt ||
        proposal?.createdAt,
    );

    rows.push({
      id: projectId,
      projectId,
      conversationId: conversationMeta?.id || null,
      createdAt: conversationMeta?.createdAt || proposal?.createdAt || null,
      updatedAt: conversationMeta?.updatedAt || proposal?.updatedAt || null,
      serviceKey,
      freelancerId,
      freelancerName: getFreelancerName(proposal),
      businessName,
      projectTitle,
      serviceLabel,
      avatar: proposal?.freelancer?.avatar || null,
      lastActivity,
      lastMessage: conversationMeta?.lastMessage || null,
      messageCount: Number(conversationMeta?.messageCount || 0),
      previewText: getConversationPreview({
        lastMessage: conversationMeta?.lastMessage,
        projectTitle,
        serviceLabel,
      }),
      chatUnlocked: true,
    });
  }

  rows.sort((left, right) => right.lastActivity - left.lastActivity);

  return {
    conversations: rows,
    hasLockedAcceptedProjects,
  };
};

export const getClientChatBootstrapData = async (userId) => {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: "ACCEPTED",
      freelancerId: { not: userId },
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
      freelancerId: true,
      freelancer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        },
      },
      project: {
        select: {
          id: true,
          ownerId: true,
          title: true,
          status: true,
          spent: true,
          clientName: true,
          businessName: true,
          serviceType: true,
          serviceKey: true,
          budget: true,
          verifiedTasks: true,
          paymentPlanVersion: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serviceKeys = Array.from(
    new Set(
      proposals
        .map((proposal) =>
          buildProjectChatServiceKey({
            projectId: proposal?.project?.id,
            ownerId: proposal?.project?.ownerId,
            freelancerId: proposal?.freelancerId,
          }),
        )
        .filter(Boolean),
    ),
  );

  const conversations = serviceKeys.length
    ? await prisma.chatConversation.findMany({
        where: {
          service: {
            in: serviceKeys,
          },
        },
        select: {
          id: true,
          service: true,
          createdAt: true,
          updatedAt: true,
          projectTitle: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const normalizedConversations = conversations.map((conversation) => ({
    ...conversation,
    lastMessage: conversation.messages?.[0]
      ? serializeChatMessage(conversation.messages[0])
      : null,
    messageCount: Number(conversation._count?.messages || 0),
  }));

  return buildClientChatBootstrapFromData({
    currentUserId: userId,
    proposals,
    conversations: normalizedConversations,
  });
};

export const listClientConversationsData = async (userId) => {
  const bootstrap = await getClientChatBootstrapData(userId);

  return bootstrap.conversations.map((conversation) => ({
    id: conversation.conversationId || conversation.id,
    service: conversation.serviceKey,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    createdById: null,
    freelancerName: conversation.freelancerName,
    projectTitle: conversation.projectTitle || CHAT_SERVICE_LABEL,
    lastMessage: conversation.lastMessage,
    messageCount: conversation.messageCount,
    projectId: conversation.projectId,
  }));
};

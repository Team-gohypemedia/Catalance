import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import {
    getProposalStorageKeys,
    migrateProposalStorageNamespace,
} from "@/shared/lib/storage-keys";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";

const stripUnavailableSections = (text = "") => {
    const withoutTags = text.replace(/\[PROPOSAL_DATA\]|\[\/PROPOSAL_DATA\]/g, "");
    const filtered = [];

    const isDividerLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;

        // Box-drawing separators (e.g., "══════") or similar glyph-only lines
        if (/^[\u2500-\u257F]+$/.test(trimmed)) return true;

        // ASCII separators ("-----", "=====", etc.)
        if (/^[=\-_*]{10,}$/.test(trimmed)) return true;

        // Fallback: long line with no alphanumerics (covers corrupted separator glyphs)
        if (trimmed.length >= 20 && /^[^a-z0-9]+$/i.test(trimmed)) return true;

        return false;
    };

    const shouldDropLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (/^project proposal$/i.test(trimmed)) return true;
        if (isDividerLine(line)) return true;
        if (/not provided/i.test(trimmed) || /not specified/i.test(trimmed)) return true;
        // Drop leftover placeholder tokens like [Portfolio]
        if (/^\[[^\]]+\]$/.test(trimmed)) return true;
        return false;
    };

    withoutTags.split("\n").forEach((line) => {
        if (shouldDropLine(line)) return;

        const trimmed = line.trim();
        if (!trimmed) {
            if (filtered[filtered.length - 1] === "") return;
            filtered.push("");
            return;
        }

        filtered.push(trimmed);
    });

    return filtered.join("\n").trim();
};

const normalizeBudgetText = (text = "") => {
    // Look for lines starting with "Budget:" and normalize the value part
    return text.replace(/Budget:\s*(.*)/i, (match, value) => {
        let cleanValue = value;
        const lower = value.toLowerCase().replace(/,/g, "");
        
        // Check for 'k' (thousands)
        if (lower.includes("k")) {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                cleanValue = `INR ${Math.round(num * 1000)}`;
            }
        } 
        // Check for 'l' or 'lakh' (lakhs)
        else if (lower.includes("l") || lower.includes("lakh")) {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                cleanValue = `INR ${Math.round(num * 100000)}`;
            }
        }

    return `Budget: ${cleanValue}`;
  });
};

const buildLocalProposalId = () =>
    `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeComparableText = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/[_/\\-]+/g, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const formatProposalContent = (text = "") =>
    normalizeBudgetText(stripUnavailableSections(text));

const parseProposalContent = (text = "", fallbackService = "") => {
    const content = (text || "").trim();
    const getValue = (label) => {
        const match = content.match(new RegExp(`${label}:\\s*(.*)`, "i"));
        return match?.[1]?.trim() || "";
    };

    const serviceName =
        getValue("Service") ||
        getValue("Service Type") ||
        getValue("Category") ||
        "";

    const projectName =
        getValue("Project Category") ||
        getValue("Project Name") ||
        getValue("Project Title") ||
        getValue("Project") ||
        "";

    const projectTitle =
        serviceName && projectName
            ? `${serviceName}/${projectName}`
            : projectName || serviceName || "Proposal";
    const preparedFor = getValue("Prepared for") || getValue("For") || "Client";

    let rawBudget = getValue("Budget") || "";
    let budget = rawBudget;

    try {
        const lower = rawBudget.toLowerCase().replace(/,/g, "");
        if (lower.includes("k")) {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                budget = Math.round(num * 1000).toString();
            }
        } else if (lower.includes("l") || lower.includes("lakh")) {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                budget = Math.round(num * 100000).toString();
            }
        } else {
            const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) {
                budget = num.toString();
            }
        }
    } catch {
        // fallback to raw string
    }

    const service = serviceName || fallbackService || "General services";

    return {
        service,
        projectTitle,
        preparedFor,
        budget,
        summary: content,
        content,
        raw: { content }
    };
};

const stripServiceNameFromProjectTitle = (projectTitle = "", serviceLabel = "") => {
    const normalizedProjectTitle = String(projectTitle || "").trim();
    const normalizedServiceLabel = String(serviceLabel || "").trim();

    if (!normalizedProjectTitle) return "";
    if (!normalizedServiceLabel) return normalizedProjectTitle;

    const titleParts = normalizedProjectTitle
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean);

    if (titleParts.length === 2) {
        const normalizedService = normalizeComparableText(normalizedServiceLabel);

        if (normalizeComparableText(titleParts[0]) === normalizedService) {
            return titleParts[1];
        }

        if (normalizeComparableText(titleParts[1]) === normalizedService) {
            return titleParts[0];
        }
    }

    return normalizedProjectTitle;
};

const resolveProposalServiceValue = (proposal = {}) =>
    proposal.serviceKey ||
    proposal.service ||
    proposal.serviceName ||
    proposal.category ||
    proposal.project?.serviceKey ||
    proposal.project?.service ||
    proposal.project?.serviceName ||
    "";

const resolveProposalTitleValue = (proposal = {}) => {
    const rawTitle =
        proposal.projectTitle ||
        proposal.title ||
        proposal.project?.title ||
        proposal.project?.name ||
        "";
    const serviceValue = resolveProposalServiceValue(proposal);

    return stripServiceNameFromProjectTitle(rawTitle, serviceValue) || rawTitle;
};

const resolveProposalProjectLink = (proposal = {}) =>
    String(
        proposal.syncedProjectId || proposal.projectId || proposal.project?.id || "",
    ).trim();

const mergeProposalRecords = (current = {}, incoming = {}) => {
    const currentTimestamp = new Date(
        current.updatedAt || current.createdAt || 0,
    ).getTime();
    const incomingTimestamp = new Date(
        incoming.updatedAt || incoming.createdAt || 0,
    ).getTime();
    const preferIncoming = incomingTimestamp >= currentTimestamp;
    const preferred = preferIncoming ? incoming : current;
    const fallback = preferIncoming ? current : incoming;

    return {
        ...fallback,
        ...preferred,
        id: current.id || incoming.id || buildLocalProposalId(),
    };
};

const getProposalSignature = (proposal = {}) => {
    const title = normalizeComparableText(resolveProposalTitleValue(proposal));
    const service = normalizeComparableText(resolveProposalServiceValue(proposal));
    const summary = normalizeComparableText(
        proposal.summary || proposal.content || proposal.description || "",
    );
    if (!title && !service) {
        return `${title}::${service}::${summary.slice(0, 160)}`;
    }
    return `${title}::${service}`;
};

const getProposalDedupKeys = (proposal = {}) => {
    const keys = [];
    const linkedProjectId = resolveProposalProjectLink(proposal);
    const signature = getProposalSignature(proposal);
    const summaryKey = normalizeComparableText(
        proposal.summary || proposal.content || proposal.description || "",
    );
    const serviceKey = normalizeComparableText(resolveProposalServiceValue(proposal));
    const budgetKey = normalizeComparableText(
        proposal.budget || proposal.amount || proposal.project?.budget || "",
    );

    if (proposal.id) {
        keys.push(`id:${String(proposal.id).trim()}`);
    }

    if (linkedProjectId) {
        keys.push(`project:${linkedProjectId}`);
    }

    if (signature && signature !== "::") {
        keys.push(`signature:${signature}`);
    }

    if (summaryKey) {
        keys.push(`summary:${serviceKey}::${budgetKey}::${summaryKey.slice(0, 160)}`);
    }

    return keys;
};

const dedupeSavedProposals = (proposals = []) => {
    const deduped = [];
    const keyToIndex = new Map();

    proposals
        .map((proposal) => ({
            ...proposal,
            id: proposal.id || proposal.localId || buildLocalProposalId(),
        }))
        .forEach((proposal) => {
            const proposalKeys = getProposalDedupKeys(proposal);
            let existingIndex = -1;

            for (const key of proposalKeys) {
                const matchIndex = keyToIndex.get(key);
                if (typeof matchIndex === "number") {
                    existingIndex = matchIndex;
                    break;
                }
            }

            if (existingIndex === -1) {
                const nextIndex = deduped.length;
                deduped.push(proposal);
                proposalKeys.forEach((key) => keyToIndex.set(key, nextIndex));
                return;
            }

            const mergedProposal = mergeProposalRecords(
                deduped[existingIndex],
                proposal,
            );
            deduped[existingIndex] = mergedProposal;
            getProposalDedupKeys(mergedProposal).forEach((key) =>
                keyToIndex.set(key, existingIndex),
            );
        });

    return deduped;
};

const loadSavedProposals = (storageKeys) => {
    if (typeof window === "undefined") return [];
    const keys = storageKeys || getProposalStorageKeys();
    const listRaw = window.localStorage.getItem(keys.listKey);
    const singleRaw = window.localStorage.getItem(keys.singleKey);
    let proposals = [];

    if (listRaw) {
        try {
            const parsed = JSON.parse(listRaw);
            if (Array.isArray(parsed)) proposals = parsed;
        } catch {
            // ignore parse errors
        }
    }

    if (singleRaw) {
        try {
            const parsed = JSON.parse(singleRaw);
            if (parsed && (parsed.summary || parsed.content || parsed.projectTitle)) {
                const signature = getProposalSignature(parsed);
                const exists = proposals.some((item) => getProposalSignature(item) === signature);
                if (!exists) proposals = [...proposals, parsed];
            }
        } catch {
            // ignore parse errors
        }
    }

    return dedupeSavedProposals(proposals);
};

const upsertSavedProposals = (existing, incoming) => {
    return dedupeSavedProposals([
        ...(Array.isArray(existing) ? existing : []),
        ...(Array.isArray(incoming) ? incoming : []),
    ]);
};

const persistSavedProposals = (proposals, activeId, storageKeys) => {
    if (typeof window === "undefined") return;
    const keys = storageKeys || getProposalStorageKeys();
    if (!Array.isArray(proposals) || proposals.length === 0) {
        window.localStorage.removeItem(keys.listKey);
        window.localStorage.removeItem(keys.singleKey);
        return;
    }

    const normalized = dedupeSavedProposals(proposals);
    window.localStorage.setItem(keys.listKey, JSON.stringify(normalized));
    const active =
        normalized.find((proposal) => proposal.id === activeId) || normalized[0];
    if (active) {
        window.localStorage.setItem(keys.singleKey, JSON.stringify(active));
    }
};

const ProposalPanel = ({ content, proposals, activeServiceKey }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const storageKeys = useMemo(
        () => getProposalStorageKeys(user?.id),
        [user?.id]
    );

    const cleanContent = useMemo(() => {
        return formatProposalContent(content || "");
    }, [content]);

    // Local state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editableContent, setEditableContent] = useState(cleanContent);

    // Sync state if prop changes (e.g. re-generation matches)
    useEffect(() => {
        setEditableContent(cleanContent);
    }, [cleanContent]);

    // Parse from editableContent so updates reflect immediately in the title/budget
    const parsed = useMemo(
        () => parseProposalContent(editableContent, activeServiceKey),
        [editableContent, activeServiceKey]
    );

    if (!content) return null;

    // Accept and proceed to dashboard - saves to dashboard view only, NOT to drafts
    const handleAccept = () => {
        if (typeof window === "undefined") return;
        migrateProposalStorageNamespace(user?.id);

        const now = new Date().toISOString();
        const hasMultiProposals = Array.isArray(proposals) && proposals.length > 0;
        const proposalsToSave = hasMultiProposals
            ? proposals
                .map((item) => {
                    const serviceKey = item?.serviceKey || "";
                    const rawContent = item?.message?.content || item?.content || "";
                    if (!rawContent) return null;
                    const normalizedContent =
                        serviceKey && serviceKey === activeServiceKey
                            ? editableContent
                            : formatProposalContent(rawContent);
                    const parsedContent = parseProposalContent(normalizedContent, serviceKey);
                    return {
                        ...parsedContent,
                        serviceKey,
                        ownerId: user?.id || null,
                        syncedProjectId: null,
                        syncedAt: null,
                        createdAt: now,
                        updatedAt: now
                    };
                })
                .filter(Boolean)
            : [
                {
                    ...parsed,
                    serviceKey: activeServiceKey,
                    ownerId: user?.id || null,
                    syncedProjectId: null,
                    syncedAt: null,
                    createdAt: now,
                    updatedAt: now
                }
            ];

        const existing = loadSavedProposals(storageKeys);
        const merged = upsertSavedProposals(existing, proposalsToSave);
        const activeTarget =
            proposalsToSave.find((proposal) => proposal.serviceKey === activeServiceKey) ||
            proposalsToSave[0];
        const activeSignature = activeTarget ? getProposalSignature(activeTarget) : null;
        const activeMatch = activeSignature
            ? merged.find((proposal) => getProposalSignature(proposal) === activeSignature)
            : merged[merged.length - 1];

        persistSavedProposals(merged, activeMatch?.id, storageKeys);
        if (storageKeys?.syncedKey) {
            window.localStorage.removeItem(storageKeys.syncedKey);
        }

        toast.success(
            proposalsToSave.length > 1
                ? "Proposals accepted! Redirecting to dashboard..."
                : "Proposal accepted! Redirecting to dashboard..."
        );
        
        if (user?.role === "CLIENT") {
            navigate("/client");
            return;
        }
        navigate("/login", { state: { redirectTo: "/client" } });
    };

    const handleSaveEdit = () => {
        setIsEditing(false);
        toast.success("Changes saved");
    };

    const handleCancelEdit = () => {
        setEditableContent(cleanContent);
        setIsEditing(false);
    };

    return (
        <>
            <Card className="border border-border/50 bg-card/70 h-full overflow-hidden flex flex-col">
                <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
                    <div className="space-y-1 border-b border-border/40 pb-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-primary font-bold">
                            proposal ready
                        </p>
                        <p className="text-lg font-semibold">{parsed.projectTitle}</p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                            {editableContent}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex-1 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            Edit Proposal
                        </Button>
                        <Button
                            className="flex-[2] gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleAccept}
                        >
                            Accept Proposal
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 py-4 overflow-hidden">
                        <Textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            className="h-[50vh] w-full font-mono text-sm resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProposalPanel;

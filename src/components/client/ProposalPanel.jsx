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
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

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

const SAVED_PROPOSALS_KEY = "markify:savedProposals";
const SAVED_PROPOSAL_KEY = "markify:savedProposal";

const buildLocalProposalId = () =>
    `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
            : projectName || serviceName || "Project Proposal";
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

const getProposalSignature = (proposal = {}) => {
    const title = (proposal.projectTitle || proposal.title || "").trim().toLowerCase();
    const service = (proposal.serviceKey || proposal.service || "").trim().toLowerCase();
    const summary = (proposal.summary || proposal.content || "").trim().toLowerCase();
    if (!title && !service) {
        return `${title}::${service}::${summary.slice(0, 120)}`;
    }
    return `${title}::${service}`;
};

const loadSavedProposals = () => {
    if (typeof window === "undefined") return [];
    const listRaw = window.localStorage.getItem(SAVED_PROPOSALS_KEY);
    const singleRaw = window.localStorage.getItem(SAVED_PROPOSAL_KEY);
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

    return proposals.map((proposal) => ({
        ...proposal,
        id: proposal.id || proposal.localId || buildLocalProposalId()
    }));
};

const upsertSavedProposals = (existing, incoming) => {
    const next = Array.isArray(existing) ? [...existing] : [];
    const additions = Array.isArray(incoming) ? incoming : [];

    additions.forEach((proposal) => {
        if (!proposal) return;
        const normalized = {
            ...proposal,
            id: proposal.id || proposal.localId || buildLocalProposalId()
        };
        const signature = getProposalSignature(normalized);
        const index = next.findIndex((item) => getProposalSignature(item) === signature);
        if (index >= 0) {
            const current = next[index];
            next[index] = { ...current, ...normalized, id: current.id || normalized.id };
        } else {
            next.push(normalized);
        }
    });

    return next;
};

const persistSavedProposals = (proposals, activeId) => {
    if (typeof window === "undefined") return;
    if (!Array.isArray(proposals) || proposals.length === 0) {
        window.localStorage.removeItem(SAVED_PROPOSALS_KEY);
        window.localStorage.removeItem(SAVED_PROPOSAL_KEY);
        return;
    }

    window.localStorage.setItem(SAVED_PROPOSALS_KEY, JSON.stringify(proposals));
    const active =
        proposals.find((proposal) => proposal.id === activeId) || proposals[0];
    if (active) {
        window.localStorage.setItem(SAVED_PROPOSAL_KEY, JSON.stringify(active));
    }
};

const ProposalPanel = ({ content, proposals, activeServiceKey }) => {
    if (!content) return null;

    const navigate = useNavigate();
    const { user } = useAuth();

    const cleanContent = useMemo(() => {
        return formatProposalContent(content);
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

    // Accept and proceed to dashboard - saves to dashboard view only, NOT to drafts
    const handleAccept = () => {
        if (typeof window === "undefined") return;

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
                        createdAt: now,
                        updatedAt: now
                    };
                })
                .filter(Boolean)
            : [
                {
                    ...parsed,
                    serviceKey: activeServiceKey,
                    createdAt: now,
                    updatedAt: now
                }
            ];

        const existing = loadSavedProposals();
        const merged = upsertSavedProposals(existing, proposalsToSave);
        const activeTarget =
            proposalsToSave.find((proposal) => proposal.serviceKey === activeServiceKey) ||
            proposalsToSave[0];
        const activeSignature = activeTarget ? getProposalSignature(activeTarget) : null;
        const activeMatch = activeSignature
            ? merged.find((proposal) => getProposalSignature(proposal) === activeSignature)
            : merged[merged.length - 1];

        persistSavedProposals(merged, activeMatch?.id);
        window.localStorage.removeItem("markify:savedProposalSynced");

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

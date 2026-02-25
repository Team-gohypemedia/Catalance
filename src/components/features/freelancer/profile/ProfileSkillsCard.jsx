import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useState } from "react";
import { Card } from "@/components/ui/card";

const normalizeSkill = (entry, index) => {
    if (typeof entry === "string") {
        return { id: `skill-${index}-${entry}`, name: entry, level: "Intermediate" };
    }
    if (!entry || typeof entry !== "object") {
        return { id: `skill-${index}`, name: "Skill", level: "Intermediate" };
    }
    return {
        id: `skill-${index}-${entry.name || "item"}`,
        name: String(entry.name || "Skill").trim(),
        level: String(
            entry.level || entry.proficiency || entry.experienceLevel || "Intermediate"
        ).trim(),
    };
};

const ProfileSkillsCard = ({ skills, deleteSkill, openSkillModal }) => {
    const skillCards = (Array.isArray(skills) ? skills : []).map(normalizeSkill);
    const [openMenu, setOpenMenu] = useState(null);

    return (
        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                    Skills & Expertise
                </h3>
                <button
                    type="button"
                    onClick={openSkillModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-muted active:scale-[0.98]"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add new
                </button>
            </div>

            {skillCards.length > 0 ? (
                <div className="mt-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {skillCards.map((skill, index) => (
                            <div
                                key={skill.id}
                                className="relative flex items-start justify-between rounded-xl border border-border/50 bg-background/50 p-4 transition-all duration-200 hover:border-border/80 hover:bg-muted/30"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                        {skill.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {skill.level}
                                    </p>
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenMenu(openMenu === index ? null : index)
                                        }
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                                        title="Options"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>

                                    {openMenu === index ? (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setOpenMenu(null)}
                                            />
                                            <div className="absolute right-0 top-8 z-20 min-w-[120px] rounded-lg border border-border/60 bg-card p-1 shadow-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        deleteSkill(index);
                                                        setOpenMenu(null);
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Remove
                                                </button>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border/50 bg-muted/10 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Add your skills so clients can quickly understand what you do best.
                    </p>
                </div>
            )}
        </Card>
    );
};

export default ProfileSkillsCard;

import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import X from "lucide-react/dist/esm/icons/x";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_SKILL_LEVEL,
  SKILL_LEVEL_OPTIONS,
  formatSkillLevelLabel,
  normalizeSkillLevel,
} from "@/components/features/freelancer/profile/freelancerProfileUtils";

const normalizeSkill = (entry, index) => {
  if (typeof entry === "string") {
    return {
      id: `skill-${index}-${entry}`,
      name: entry,
      level: DEFAULT_SKILL_LEVEL,
    };
  }

  if (!entry || typeof entry !== "object") {
    return {
      id: `skill-${index}`,
      name: "Skill",
      level: DEFAULT_SKILL_LEVEL,
    };
  }

  return {
    id: `skill-${index}-${entry.name || "item"}`,
    name: String(entry.name || "Skill").trim(),
    level: normalizeSkillLevel(
      entry.level || entry.proficiency || entry.experienceLevel || DEFAULT_SKILL_LEVEL
    ),
  };
};

const ProfileSkillsCard = ({
  skills,
  deleteSkill,
  setSkillLevel,
  savingChanges,
  openSkillModal,
}) => {
  const skillCards = (Array.isArray(skills) ? skills : []).map(normalizeSkill);
  const [openMenu, setOpenMenu] = useState(null);
  const [openMenuView, setOpenMenuView] = useState("actions");
  const [pendingSkillLevel, setPendingSkillLevel] = useState(DEFAULT_SKILL_LEVEL);

  const closeMenu = () => {
    setOpenMenu(null);
    setOpenMenuView("actions");
    setPendingSkillLevel(DEFAULT_SKILL_LEVEL);
  };

  return (
    <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Skills & Expertise
        </h3>
        <div className="flex items-center gap-3">
          {savingChanges ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </span>
          ) : null}
          <button
            type="button"
            onClick={openSkillModal}
            disabled={savingChanges}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add new
          </button>
        </div>
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
                  <p className="text-sm font-semibold text-foreground">{skill.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Level {formatSkillLevelLabel(skill.level)}
                  </p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    disabled={savingChanges}
                    onClick={() => {
                      if (openMenu === index) {
                        closeMenu();
                      } else {
                        setOpenMenu(index);
                        setOpenMenuView("actions");
                        setPendingSkillLevel(skill.level);
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    title="Options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {openMenu === index ? (
                    <>
                      <div className="fixed inset-0 z-10" onClick={closeMenu} />
                      <div className="absolute right-0 top-8 z-20 w-[240px] rounded-lg border border-border/60 bg-card p-1 shadow-lg">
                        {openMenuView === "actions" ? (
                          <>
                            <button
                              type="button"
                              disabled={savingChanges}
                              onClick={() => {
                                setPendingSkillLevel(skill.level);
                                setOpenMenuView("levels");
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit level
                            </button>
                            <button
                              type="button"
                              disabled={savingChanges}
                              onClick={() => {
                                deleteSkill(skill);
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="px-3 pb-3 pt-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                  Skill level (1-10)
                                </p>
                                <p className="mt-1 text-xs text-foreground/80">
                                  Current: {formatSkillLevelLabel(pendingSkillLevel)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={closeMenu}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                title="Close"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-4 space-y-3">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[pendingSkillLevel]}
                                disabled={savingChanges}
                                onValueChange={(values) => {
                                  setPendingSkillLevel(normalizeSkillLevel(values?.[0]));
                                }}
                                onValueCommit={(values) => {
                                  const nextLevel = normalizeSkillLevel(values?.[0]);
                                  setPendingSkillLevel(nextLevel);
                                  if (
                                    typeof setSkillLevel === "function" &&
                                    nextLevel !== skill.level
                                  ) {
                                    void setSkillLevel(index, nextLevel);
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
                                {SKILL_LEVEL_OPTIONS.map((levelOption) => (
                                  <span
                                    key={`${skill.id}-scale-${levelOption}`}
                                    className={
                                      pendingSkillLevel === levelOption
                                        ? "text-primary"
                                        : undefined
                                    }
                                  >
                                    {levelOption}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
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
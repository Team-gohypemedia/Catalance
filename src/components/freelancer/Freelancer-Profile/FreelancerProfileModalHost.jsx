import X from "lucide-react/dist/esm/icons/x";
import { FULL_PROFILE_EDITOR_SECTIONS } from "./freelancerProfileUtils";

const getModalPanelClassName = (modalType, fullProfileEditorSection) =>
  `subtle-scrollbar w-full border border-border/70 bg-card text-card-foreground shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200 ${
    modalType === "onboardingService" ? "rounded-md p-0" : "rounded-2xl p-6"
  } ${
    modalType === "viewAllProjects"
      ? "max-w-6xl h-[90vh] overflow-hidden flex flex-col"
      : modalType === "fullProfile"
        ? [
            FULL_PROFILE_EDITOR_SECTIONS.WORK_PREFERENCES,
            FULL_PROFILE_EDITOR_SECTIONS.INDUSTRY_FOCUS,
          ].includes(fullProfileEditorSection)
          ? "max-w-3xl max-h-[90vh] overflow-y-auto"
          : "max-w-5xl max-h-[90vh] overflow-y-auto"
        : modalType === "education"
          ? "max-w-4xl max-h-[90vh] overflow-y-auto"
          : modalType === "personal"
            ? "max-w-2xl max-h-[90vh] overflow-y-auto"
            : modalType === "onboardingService"
              ? "max-w-6xl h-[92vh] max-h-[960px] overflow-hidden flex flex-col"
              : modalType === "work"
                ? "max-w-2xl max-h-[90vh] overflow-y-auto"
                : modalType === "portfolio"
                  ? "max-w-2xl max-h-[90vh] overflow-y-auto"
                  : modalType === "addProject"
                    ? "max-w-[1040px] overflow-hidden"
                    : modalType === "service"
                      ? "relative max-w-lg overflow-visible"
                      : "max-w-md"
  }`;

const FreelancerProfileModalHost = ({
  children,
  modalType,
  fullProfileEditorSection,
  onClose,
}) => {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/65 px-4 transition-all backdrop-blur-[2px] dark:bg-black/60">
      <div className={`relative ${getModalPanelClassName(modalType, fullProfileEditorSection)}`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors z-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default FreelancerProfileModalHost;

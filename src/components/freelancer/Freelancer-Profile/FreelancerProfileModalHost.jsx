import { FULL_PROFILE_EDITOR_SECTIONS } from "./freelancerProfileUtils";

const getModalPanelClassName = (modalType, fullProfileEditorSection) =>
  `w-full border border-border/70 bg-card/95 backdrop-blur shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200 ${
    ["addProject", "onboardingService"].includes(modalType) ? "rounded-md p-0" : "rounded-2xl p-6"
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
            ? "max-w-2xl"
            : modalType === "onboardingService"
              ? "max-w-6xl h-[92vh] max-h-[960px] overflow-hidden flex flex-col"
              : modalType === "work"
                ? "max-w-2xl max-h-[90vh] overflow-y-auto"
                : modalType === "portfolio"
                  ? "max-w-2xl max-h-[90vh] overflow-y-auto"
                  : modalType === "addProject"
                    ? "max-w-[1040px] overflow-hidden"
                    : "max-w-md"
  }`;

const FreelancerProfileModalHost = ({
  children,
  modalType,
  fullProfileEditorSection,
}) => {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 transition-all">
      <div className={getModalPanelClassName(modalType, fullProfileEditorSection)}>
        {children}
      </div>
    </div>
  );
};

export default FreelancerProfileModalHost;

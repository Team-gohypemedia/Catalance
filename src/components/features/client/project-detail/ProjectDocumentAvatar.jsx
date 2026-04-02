import { cn } from "@/shared/lib/utils";

const ProjectDocumentAvatar = ({ doc, getProjectDocumentPresentation }) => {
  const { Icon, accentClassName, badgeClassName } =
    getProjectDocumentPresentation(doc);

  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
        accentClassName,
      )}
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-[8px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
          badgeClassName,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
    </span>
  );
};

export default ProjectDocumentAvatar;

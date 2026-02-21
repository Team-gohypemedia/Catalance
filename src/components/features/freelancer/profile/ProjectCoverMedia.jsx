import { useState } from "react";
import { cn } from "@/shared/lib/utils";

const PROJECT_COVER_GRADIENTS = [
  "bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700",
  "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700",
  "bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-700",
  "bg-gradient-to-br from-rose-500 via-orange-600 to-amber-600",
  "bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-700",
  "bg-gradient-to-br from-lime-500 via-emerald-600 to-teal-700",
];

const getGradientIndexFromSeed = (seed = "") => {
  const text = String(seed || "project");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % PROJECT_COVER_GRADIENTS.length;
};

export const getProjectDisplayTitle = (project = {}) => {
  const explicitTitle = String(project?.title || "").trim();
  if (explicitTitle) return explicitTitle;

  const rawLink = String(project?.link || "").trim();
  if (!rawLink) return "Project";

  try {
    const normalized = /^https?:\/\//i.test(rawLink)
      ? rawLink
      : `https://${rawLink}`;
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./i, "") || "Project";
  } catch {
    return rawLink;
  }
};

const ProjectCoverFallback = ({
  project,
  className,
  titleClassName,
}) => {
  const title = getProjectDisplayTitle(project);
  const seed = `${String(project?.title || "").trim()}|${String(
    project?.link || ""
  ).trim()}`.toLowerCase();
  const gradientClassName =
    PROJECT_COVER_GRADIENTS[getGradientIndexFromSeed(seed)];

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center p-4 text-center",
        gradientClassName,
        className
      )}
    >
      <span
        className={cn(
          "line-clamp-3 text-balance text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]",
          titleClassName
        )}
      >
        {title}
      </span>
    </div>
  );
};

const ProjectCoverMedia = ({
  project,
  containerClassName,
  imageClassName,
  fallbackTitleClassName,
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = String(project?.image || "").trim();

  if (!imageUrl || hasImageError) {
    return (
      <ProjectCoverFallback
        project={project}
        className={containerClassName}
        titleClassName={fallbackTitleClassName}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={getProjectDisplayTitle(project)}
      className={cn("h-full w-full object-cover", imageClassName)}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasImageError(true)}
    />
  );
};

export default ProjectCoverMedia;

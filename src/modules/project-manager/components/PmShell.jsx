import PropTypes from "prop-types";
import ManagerWorkspaceHeader from "@/components/features/project-manager/ManagerWorkspaceHeader";

export const PmShell = ({ title = "Management", subtitle, actions, children, hideHeader, className }) => {
  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ""}`}>
      <ManagerWorkspaceHeader />
      <main className="mx-auto w-full max-w-[1536px] xl:w-[94%] min-w-0 space-y-8 px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {!hideHeader && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pt-2">
            <div>
              <h1 className="text-[22px] sm:text-[clamp(2rem,3.5vw,2.75rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-foreground">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div> : null}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

PmShell.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  hideHeader: PropTypes.bool,
  className: PropTypes.string,
};

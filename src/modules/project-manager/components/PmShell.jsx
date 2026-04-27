import PropTypes from "prop-types";
import { useEffect } from "react";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "@/components/features/project-manager/ManagerTopBar";

export const PmShell = ({ title = "Management", subtitle, actions, children, hideHeader, className }) => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const htmlHadDark = html.classList.contains("dark");
    const bodyHadDark = body.classList.contains("dark");

    html.classList.remove("dark");
    body.classList.remove("dark");
    html.classList.add("pm-light");

    return () => {
      html.classList.remove("pm-light");
      if (htmlHadDark) html.classList.add("dark");
      if (bodyHadDark) body.classList.add("dark");
    };
  }, []);

  return (
    <RoleAwareSidebar>
      <div className={`pm-light-theme min-h-dvh overflow-x-clip bg-white text-slate-900 ${className || ""}`}>
        <ManagerTopBar />
        <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-5 p-3 pb-3 sm:p-4 sm:pb-4 md:space-y-6 md:p-5 md:pb-5 xl:p-6 xl:pb-6">
          {!hideHeader && (
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem] xl:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500 sm:text-base">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          )}
          {children}
        </div>
      </div>
    </RoleAwareSidebar>
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

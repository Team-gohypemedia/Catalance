import PropTypes from "prop-types";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "@/components/features/project-manager/ManagerTopBar";

export const PmShell = ({ title = "Management", subtitle, actions, children, hideHeader, className }) => (
  <RoleAwareSidebar>
    <div className={`min-h-full overflow-x-clip bg-white text-slate-900 ${className || ""}`}>
      <ManagerTopBar />
      <div className="mx-auto w-full max-w-[1400px] min-w-0 space-y-6 p-4 pb-4 md:p-6 md:pb-6">
        {!hideHeader && (
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-2 text-base font-medium text-slate-400">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        )}
        {children}
      </div>
    </div>
  </RoleAwareSidebar>
);

PmShell.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  hideHeader: PropTypes.bool,
  className: PropTypes.string,
};

import PropTypes from "prop-types";
import { Badge } from "@/components/ui/badge";
import { PM_PROJECT_STATUS_META } from "@/modules/project-manager/constants";

export const StatusBadge = ({ status }) => {
  const classes =
    PM_PROJECT_STATUS_META[status] ||
    "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <Badge className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${classes}`}>
      {status}
    </Badge>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

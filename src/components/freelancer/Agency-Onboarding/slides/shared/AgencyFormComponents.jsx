import { cn } from "@/shared/lib/utils";

export const ChoiceGrid = ({
  label,
  description,
  options = [],
  selectedValues = [],
  onToggle,
  error = "",
  className = "",
  gridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3",
}) => {
  const selectedSet = new Set(
    Array.isArray(selectedValues)
      ? selectedValues.map((value) => String(value || "").trim()).filter(Boolean)
      : [],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description ? (
          <p className="text-sm leading-6 text-white/55">{description}</p>
        ) : null}
      </div>

      <div className={gridClassName}>
        {options.map((option) => {
          const value = String(option?.value || "").trim();
          if (!value) {
            return null;
          }

          const isSelected = selectedSet.has(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle?.(value)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 bg-card text-white/85 hover:border-white/20 hover:bg-white/[0.04]",
              )}
              aria-pressed={isSelected}
            >
              {option?.label || value}
            </button>
          );
        })}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

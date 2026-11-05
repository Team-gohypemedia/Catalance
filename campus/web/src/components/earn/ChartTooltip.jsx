/** Tooltip body for recharts, styled with design tokens (works in both themes). */
export function ChartTooltip({ active, payload, label, format = (v) => v, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-fg">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mt-0.5 flex items-center gap-1.5 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
          <span className="font-medium text-fg">{format(p.value)}</span> {unit || p.name}
        </p>
      ))}
    </div>
  );
}

export const axisProps = {
  tick: { fill: "var(--muted)", fontSize: 11 },
  axisLine: false,
  tickLine: false,
};

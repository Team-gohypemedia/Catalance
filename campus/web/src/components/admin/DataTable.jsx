import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Inbox, Search, X } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";

/**
 * Admin DataTable — sorting, search, pagination; renders as cards below `md`.
 *
 * columns: [{ id, header, cell(row), sortValue?(row), align?: "left"|"right"|"center", className?, headerClassName?,
 *             hideOnMobile?, mobileLabel? }]
 * search:  { placeholder, text(row) => string }  — client-side filtering
 *          or controlled: { placeholder, value, onChange } — the caller filters (e.g. server-side ?q=)
 * mobileCard(row) — optional custom card renderer; default shows the first column as the title and the rest as label/value rows.
 */
export function DataTable({
  data,
  columns,
  loading,
  error,
  onRetry,
  search,
  toolbar,
  initialSort,
  pageSize = 12,
  onRowClick,
  rowKey = (r) => r.id,
  rowClassName,
  mobileCard,
  empty = {},
  className,
}) {
  const [localQ, setLocalQ] = useState("");
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(0);
  const controlled = search && typeof search.onChange === "function";
  const q = controlled ? search.value || "" : localQ;
  const setQ = (v) => (controlled ? search.onChange(v) : setLocalQ(v));

  const filtered = useMemo(() => {
    let rows = data || [];
    if (search && !controlled && q.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter((r) => String(search.text?.(r) ?? "").toLowerCase().includes(needle));
    }
    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col?.sortValue) {
        rows = [...rows].sort((a, b) => {
          const va = col.sortValue(a);
          const vb = col.sortValue(b);
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va ?? "").localeCompare(String(vb ?? ""), "en", { numeric: true });
          return sort.desc ? -cmp : cmp;
        });
      }
    }
    return rows;
  }, [data, q, sort, columns, search, controlled]);

  useEffect(() => setPage(0), [q, sort, data]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (col) => {
    if (!col.sortValue) return;
    setSort((s) => (s?.id === col.id ? (s.desc ? { id: col.id, desc: false } : null) : { id: col.id, desc: true }));
  };

  const align = (col) => (col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left");

  const searchBox = search && (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
      <input
        type="search"
        aria-label={search.placeholder || "Search"}
        placeholder={search.placeholder || "Search…"}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-9 w-full rounded-lg border border-line bg-surface pr-8 pl-9 text-sm text-fg transition-colors placeholder:text-subtle hover:border-line-strong focus:border-primary focus:ring-4 focus:ring-[var(--ring)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQ("")}
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );

  const pager = (
    <>
      <p className="tabular-nums">
        {filtered.length ? (
          <>
            {formatNumber(current * pageSize + 1)}–{formatNumber(Math.min(filtered.length, (current + 1) * pageSize))}
            <span className="text-subtle"> of </span>
            {formatNumber(filtered.length)}
          </>
        ) : null}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-3.5" /> <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="px-1.5 tabular-nums">
            {current + 1} <span className="text-subtle">/ {pages}</span>
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="hidden sm:inline">Next</span> <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      {(search || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {searchBox}
          {toolbar && <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="h-10 border-b border-line" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3.5 flex-1 rounded-md" />
              <Skeleton className="hidden h-3.5 w-24 rounded-md sm:block" />
              <Skeleton className="hidden h-3.5 w-16 rounded-md sm:block" />
            </div>
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={empty.icon || Inbox}
          title={q ? "No matches" : empty.title || "Nothing here yet"}
          description={q ? `Nothing matches "${q}". Try another search.` : empty.description}
          action={q ? null : empty.action}
          className="bg-surface"
        />
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden min-w-0 overflow-hidden rounded-2xl border border-line bg-surface md:block">
            <div className="relative overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line">
                    {columns.map((col) => {
                      const active = sort?.id === col.id;
                      const Icon = active ? (sort.desc ? ArrowDown : ArrowUp) : ChevronsUpDown;
                      return (
                        <th
                          key={col.id}
                          scope="col"
                          aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined}
                          className={cn("h-10 px-3 text-xs font-medium whitespace-nowrap text-muted first:pl-4 last:pr-4", align(col), col.headerClassName)}
                        >
                          {col.sortValue ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(col)}
                              className={cn(
                                "group inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
                                active && "text-fg",
                                col.align === "right" && "flex-row-reverse",
                              )}
                            >
                              {col.header}
                              <Icon className={cn("size-3", !active && "opacity-0 transition-opacity group-hover:opacity-60")} />
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn("border-b border-line transition-colors last:border-0 hover:bg-surface-2/50", onRowClick && "cursor-pointer", rowClassName?.(row))}
                    >
                      {columns.map((col) => (
                        <td key={col.id} className={cn("px-3 py-3 align-middle text-fg first:pl-4 last:pr-4", align(col), col.className)}>
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 text-xs text-muted">{pager}</div>
          </div>

          {/* mobile cards */}
          <ul className="space-y-2 md:hidden">
            {visible.map((row) => (
              <li key={rowKey(row)}>
                <div
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(row)) : undefined}
                  className={cn("rounded-2xl border border-line bg-surface p-4 transition-colors", onRowClick && "cursor-pointer active:bg-surface-2", rowClassName?.(row))}
                >
                  {mobileCard ? (
                    mobileCard(row)
                  ) : (
                    <>
                      <div className="min-w-0">{columns[0].cell(row)}</div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3">
                        {columns
                          .slice(1)
                          .filter((c) => !c.hideOnMobile)
                          .map((col) => (
                            <div key={col.id} className="min-w-0">
                              <dt className="text-[11px] text-subtle">{col.mobileLabel || col.header}</dt>
                              <dd className="mt-0.5 min-w-0 truncate text-sm">{col.cell(row)}</dd>
                            </div>
                          ))}
                      </dl>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted md:hidden">{pager}</div>
        </>
      )}
    </div>
  );
}

/** Small segmented filter used in table toolbars. options: [{ value, label, count? }] */
export function Segmented({ value, onChange, options, className, label }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("scrollbar-none inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-line bg-surface p-0.5", className)}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap text-muted transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
              on && "bg-surface-2 text-fg",
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn("tabular-nums", on ? "text-muted" : "text-subtle")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

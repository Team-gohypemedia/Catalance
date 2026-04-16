import TechnologyChips from "./TechnologyChips";
import { Skeleton } from "@/components/ui/skeleton";

const SubcategorySection = ({
  subCategories = [],
  tools = [],
  selectedSubCategoryId = null,
  selectedToolId = null,
  onSelectSubCategory,
  onSelectTool,
  subCategoriesLoading = false,
  toolsLoading = false,
  hideHeadings = false,
  hideEmptyMessages = false,
}) => (
  <div className="relative pl-1.5 sm:pl-3.5">
    <div className="pointer-events-none absolute bottom-8 left-0 top-8 w-[2px] rounded-full bg-gradient-to-b from-primary/75 via-primary/40 to-transparent sm:left-1.5" />

    <div
      className={
        hideHeadings
          ? "space-y-3 rounded-[28px] border border-white/12 bg-gradient-to-br from-slate-950/92 via-slate-950/84 to-slate-900/70 p-4 shadow-[0_24px_72px_-44px_rgba(2,6,23,0.92)] backdrop-blur-xl sm:p-5"
          : "space-y-6 rounded-[28px] border border-white/12 bg-gradient-to-br from-slate-950/92 via-slate-950/84 to-slate-900/70 p-5 shadow-[0_24px_72px_-44px_rgba(2,6,23,0.92)] backdrop-blur-xl sm:p-6"
      }
    >
      <div className={hideHeadings ? "space-y-2" : "space-y-3"}>
        {!hideHeadings ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Sub-categories
          </p>
        ) : null}
        {subCategoriesLoading ? (
          <div className="flex gap-3 overflow-hidden px-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={`subcategory-skeleton-${index}`}
                className="h-[52px] w-44 shrink-0 rounded-full bg-white/[0.08]"
              />
            ))}
          </div>
        ) : (
          <TechnologyChips
            items={subCategories.map((item) => ({
              key: String(item.id),
              label: item.label || item.name,
            }))}
            selectedValues={selectedSubCategoryId ? [String(selectedSubCategoryId)] : []}
            onToggle={(nextValue) => {
              onSelectSubCategory?.(Number.parseInt(nextValue, 10));
            }}
            horizontal
            chipStyle="subtype"
            itemClassName="rounded-[5px]"
            emptyLabel={hideEmptyMessages ? "" : "No sub-categories found for this service yet."}
          />
        )}
      </div>

      <div
        className={
          hideHeadings
            ? "space-y-2 border-t border-white/8 pt-3"
            : "space-y-3 border-t border-white/8 pt-5"
        }
      >
        {!hideHeadings ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Tools
          </p>
        ) : null}
        {toolsLoading ? (
          <div className="flex gap-3 overflow-hidden px-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={`tool-skeleton-${index}`}
                className="h-[52px] w-44 shrink-0 rounded-full bg-white/[0.08]"
              />
            ))}
          </div>
        ) : (
          <TechnologyChips
            items={tools.map((item) => ({
              key: String(item.id),
              label: item.label || item.name,
            }))}
            selectedValues={selectedToolId ? [String(selectedToolId)] : []}
            onToggle={(nextValue) => {
              onSelectTool?.(Number.parseInt(nextValue, 10));
            }}
            horizontal
            chipStyle="subtype"
            itemClassName="rounded-full"
            emptyLabel={
              hideEmptyMessages
                ? ""
                : selectedSubCategoryId
                  ? "No tools found for this sub-category yet."
                  : "Choose a sub-category to load tools."
            }
          />
        )}
      </div>
    </div>
  </div>
);

export default SubcategorySection;

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
}) => {
  const hasTools = tools.length > 0 || toolsLoading;

  return (
    <div
      className={
        hideHeadings
          ? "space-y-2.5 rounded-2xl border border-border/80 bg-card/45 p-3.5 shadow-sm backdrop-blur-xl transition-all sm:p-4.5 dark:border-white/10 dark:bg-slate-950/80"
          : "space-y-5 rounded-2xl border border-border/80 bg-card/45 p-4.5 shadow-sm backdrop-blur-xl transition-all sm:p-5.5 dark:border-white/10 dark:bg-slate-950/80"
      }
    >
      <div className={hideHeadings ? "space-y-1.5" : "space-y-2.5"}>
        {!hideHeadings ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Sub-categories
          </p>
        ) : null}
        {subCategoriesLoading ? (
          <div className="flex gap-3 overflow-hidden px-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={`subcategory-skeleton-${index}`}
                className="h-[40px] w-44 shrink-0 rounded-full bg-white/[0.08]"
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

      {hasTools && (
        <div
          className={
            hideHeadings
              ? "space-y-1.5 border-t border-border/40 pt-2.5 dark:border-white/8"
              : "space-y-2.5 border-t border-border/40 pt-4 dark:border-white/8"
          }
        >
          {!hideHeadings ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Tools
            </p>
          ) : null}
          {toolsLoading ? (
            <div className="flex gap-3 overflow-hidden px-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={`tool-skeleton-${index}`}
                  className="h-[40px] w-44 shrink-0 rounded-full bg-white/[0.08]"
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
      )}
    </div>
  );
};

export default SubcategorySection;

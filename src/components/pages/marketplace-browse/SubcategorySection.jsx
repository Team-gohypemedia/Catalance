import TechnologyChips from "./TechnologyChips";

const SubcategorySection = ({
  service,
  selectedTechnologies = [],
  onToggleTechnology,
}) => (
  <div className="relative pl-2 sm:pl-6">
    <div className="pointer-events-none absolute bottom-6 left-0 top-6 w-[2px] rounded-full bg-gradient-to-b from-[#fbcc15]/70 via-[#fbcc15]/25 to-transparent sm:left-2" />

    <div className="space-y-3 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(251,204,21,0.08),rgba(17,21,29,0.96)_24%,rgba(17,21,29,0.98)_100%)] p-4 shadow-[0_18px_56px_-42px_rgba(2,6,23,0.85)] backdrop-blur-xl">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
          Popular Technologies / Tools / Skills
        </p>
      </div>
      <TechnologyChips
        items={service?.technologies || []}
        selectedValues={selectedTechnologies}
        onToggle={onToggleTechnology}
        horizontal
        chipStyle="subtype"
        emptyLabel="No technologies found for this service yet."
      />
    </div>
  </div>
);

export default SubcategorySection;

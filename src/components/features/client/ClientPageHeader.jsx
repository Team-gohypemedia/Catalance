"use client";

import { cn } from "@/shared/lib/utils";

const formatClientPageHeaderDate = (
  value = new Date(),
  options = {
    weekday: "long",
    month: "short",
    day: "numeric",
  },
) => {
  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", options)
    .format(parsedDate)
    .replace(",", ", ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toUpperCase();
};

const ClientPageHeader = ({
  title,
  description,
  supportingText = null,
  actions = null,
  dateLabel,
  className,
  mobileDateFirst = false,
}) => {
  const resolvedDateLabel =
    typeof dateLabel === "string" && dateLabel.trim()
      ? dateLabel.trim()
      : dateLabel === false
        ? ""
        : formatClientPageHeaderDate();

  return (
    <section
      className={cn(
        "mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      {mobileDateFirst && resolvedDateLabel ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:hidden">
          {resolvedDateLabel}
        </p>
      ) : null}

      <div className="max-w-[40rem]">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[36rem] text-sm leading-7 text-[#94a3b8]">{description}</p>
        ) : null}
        {supportingText ? (
          <div className="mt-6 flex min-h-7 flex-wrap items-center gap-3 text-sm text-[#94a3b8]">
            {supportingText}
          </div>
        ) : null}
      </div>

      {resolvedDateLabel || actions ? (
        <div className="flex flex-col gap-4 lg:items-end lg:text-right">
          {resolvedDateLabel ? (
            <p
              className={cn(
                "hidden text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground lg:block",
                mobileDateFirst && "hidden lg:block",
              )}
            >
              {resolvedDateLabel}
            </p>
          ) : null}
          {actions ? <div className="flex justify-start lg:justify-end">{actions}</div> : null}
        </div>
      ) : null}
    </section>
  );
};

export default ClientPageHeader;

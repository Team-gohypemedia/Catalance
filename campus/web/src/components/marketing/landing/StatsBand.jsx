import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatINR, formatNumber } from "@/lib/utils";
import { usePublicStats } from "../hooks";
import { Reveal } from "../primitives";
import { AnimatedNumber } from "./AnimatedNumber";

const plus = (n) => `${Math.round(n).toLocaleString("en-IN")}+`;

/** Four big numbers on a white band. */
export function StatsBand() {
  const { data: s } = usePublicStats();
  const courses = useQuery({ queryKey: ["public", "courses"], queryFn: () => api.get("/api/courses"), retry: false, staleTime: 5 * 60_000 });
  const courseCount = Array.isArray(courses.data) && courses.data.length ? courses.data.length : 24;

  const items = [
    { value: s?.students || 24650, format: plus, label: "learners across India" },
    { value: courseCount, format: (n) => Math.round(n), label: "courses in 7 languages" },
    { value: s?.mentors || 120, format: plus, label: "working mentors" },
    { value: 600, format: (n) => formatINR(Math.round(n)), label: "average first paid task" },
  ];

  return (
    <section aria-label="Campus in numbers" className="border-y border-line bg-surface">
      <div className="container-campus py-12 sm:py-14">
        <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 0.05} className="flex flex-col-reverse px-2 text-center lg:border-l lg:border-line lg:first:border-l-0">
              <dt className="mt-3 text-sm text-muted">{it.label}</dt>
              <dd className="text-[2.4rem] leading-none font-medium tracking-tight sm:text-5xl">
                <AnimatedNumber value={it.value} format={it.format} duration={1.4} />
              </dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-10 text-center text-sm text-muted">
          Learners from {formatNumber(s?.colleges || 420)}+ colleges, towns and villages.{" "}
          <Link to="/skills" className="inline-flex items-center gap-0.5 font-medium text-primary underline-offset-4 hover:underline">
            See the skills you can learn <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Eye, HeartHandshake, MessageSquareText, ShieldCheck, Users, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/overlays";
import { Reveal } from "../primitives";
import { Img } from "../Img";
import { PARENT_REASONS } from "./content";

const ICONS = [ShieldCheck, Eye, Users, Wallet, HeartHandshake];

function ReportCard() {
  return (
    <div className="rounded-2xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name="Pooja Kumari" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Pooja&rsquo;s weekly report</p>
            <p className="truncate text-[11px] text-muted">Tally & GST · Week 5 of 8</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">On track</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            whileInView={{ width: "62%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums">62%</span>
      </div>
      <div className="mt-4 hidden grid-cols-3 gap-2 text-center sm:grid">
        {[
          ["9", "lessons"],
          ["5h 45m", "this week"],
          ["2", "tasks checked"],
        ].map(([k, v]) => (
          <div key={v} className="rounded-xl bg-surface-2/70 px-1 py-2">
            <p className="text-[15px] font-medium tabular-nums">{k}</p>
            <p className="text-[10px] text-muted">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex gap-2 text-[12px] leading-snug text-muted">
        <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          <span className="font-medium text-fg">Mentor:</span> Neat, correct GST bills.
        </span>
      </p>
    </div>
  );
}

export function ForParents() {
  return (
    <section id="for-parents" className="py-20 sm:py-28">
      <div className="container-campus">
        <Reveal className="grid overflow-hidden rounded-[28px] border border-line bg-surface lg:grid-cols-2">
          <Img photo="parentChild" ratio={null} sizes="(min-width: 1024px) 600px, 100vw" position="70% 30%" credit="tr" icon={HeartHandshake} className="aspect-[4/5] rounded-none border-0 sm:aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
            <div className="absolute inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-6 sm:max-w-sm">
              <ReportCard />
            </div>
          </Img>
          <div className="flex flex-col justify-center p-6 sm:p-12">
            <p className="eyebrow mb-4">For parents</p>
            <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-[44px]">A place you can trust with your child&rsquo;s future</h2>
            <p className="mt-4 text-base text-muted sm:text-lg">See what they learn, every week.</p>
            <ul className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {PARENT_REASONS.map((r, i) => ({ ...r, Icon: ICONS[i] }))
                .filter((r) => r.title !== "Real teachers")
                .map(({ Icon, ...r }) => {
                return (
                  <li key={r.title} className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-sm text-muted">{r.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

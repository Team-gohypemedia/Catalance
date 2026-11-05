import { ArrowRight, BadgeCheck, ClipboardCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "../primitives";
import { Img, PhotoChip } from "../Img";

export function FinalCta() {
  const { isAuthed } = useAuth();
  return (
    <section className="container-campus py-16 sm:py-24" aria-label="Get started">
      <Reveal className="grid overflow-hidden rounded-3xl border border-line bg-surface lg:grid-cols-2">
        <div className="relative isolate flex flex-col justify-center px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_0%_0%,var(--primary-soft),transparent)]" aria-hidden="true" />
          <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
            Learn a skill. <em className="accent">Prove it.</em>
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">Practical lessons, one final task, a skill you can show.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to={isAuthed ? "/app" : "/tracks"} size="lg" rightIcon={ArrowRight}>
              {isAuthed ? "Continue learning" : "Explore Courses"}
            </Button>
            <Button to="/how-it-works" size="lg" variant="brandOutline">
              How It Works
            </Button>
          </div>
        </div>
        <div className="p-3 sm:p-4 lg:pl-0">
          <Img photo="collegeFriends" ratio="4/3" sizes="(min-width: 1024px) 600px, 100vw" position="50% 40%" credit="br" icon={GraduationCap} className="h-full rounded-2xl">
            <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
              <PhotoChip icon={ClipboardCheck}>Assessment passed</PhotoChip>
              <PhotoChip icon={BadgeCheck} tone="success">
                Skill verified
              </PhotoChip>
            </div>
          </Img>
        </div>
      </Reveal>
    </section>
  );
}

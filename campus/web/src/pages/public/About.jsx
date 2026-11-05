import { ArrowRight, Eye, HeartHandshake, Languages, Scale, ShieldCheck, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InkCta, PageHero, Reveal } from "@/components/marketing/primitives";
import { MENTOR_PHOTOS, PHOTOS, TRACK_THUMBS, photoSrc } from "@/components/marketing/photos";
import { UNSPLASH_URL } from "@/components/marketing/Img";

/* Unsplash attribution for every photo used on the marketing pages. */
function PhotoCredits() {
  const seen = new Set();
  const photos = [...Object.values(PHOTOS), ...Object.values(TRACK_THUMBS), ...Object.values(MENTOR_PHOTOS)].filter((p) => p && !seen.has(p.id) && seen.add(p.id));
  return (
    <section id="photo-credits" aria-labelledby="photo-credits-title" className="border-t border-line py-16 sm:py-20">
      <div className="container-campus">
        <h2 id="photo-credits-title" className="text-xl font-medium tracking-tight">
          Photography credits
        </h2>
        <p className="mt-2 text-sm text-muted">
          Photos on Campus are from{" "}
          <a href={UNSPLASH_URL} target="_blank" rel="noopener noreferrer" className="text-fg underline underline-offset-2 hover:text-primary">
            Unsplash
          </a>
          , used under the Unsplash License. Thank you to these photographers.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
              <a href={p.photoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0" aria-label={`View "${p.alt}" on Unsplash`}>
                <img src={photoSrc(p, 96, { height: 96 })} alt="" width={48} height={48} loading="lazy" decoding="async" className="size-12 rounded-lg object-cover" style={{ backgroundColor: p.color }} />
              </a>
              <span className="min-w-0 text-sm">
                <span className="block truncate text-muted">{Object.values(MENTOR_PHOTOS).includes(p) ? `Portrait used for mentor ${p.alt}` : p.alt}</span>
                <span className="block truncate">
                  by{" "}
                  <a href={p.credit.url} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-2 hover:text-primary hover:underline">
                    {p.credit.name}
                  </a>{" "}
                  on{" "}
                  <a href={UNSPLASH_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-primary hover:underline">
                    Unsplash
                  </a>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base text-balance text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}

const PROBLEM = [
  { n: "4 crore+", l: "students in Indian higher education. Most of them at colleges no recruiter has ever visited." },
  { n: "~20", l: "campuses get the bulk of top recruiter attention every placement season." },
  { n: "1", l: "final practical task is what it takes to prove a skill on Campus, whatever your college." },
];

const VALUES = [
  { icon: Scale, t: "Proof over pedigree", d: "We verify work, not surnames, cities or college fees." },
  { icon: Languages, t: "Your language is not a weakness", d: "Hinglish, Tamil, Bengali. Understanding comes first, English follows." },
  { icon: HeartHandshake, t: "Clear fees", d: "One fee per course, shown with GST before you pay. No hidden charges." },
  { icon: Sprout, t: "Practitioners teach", d: "Every mentor does real client work. No reading slides from 2015." },
  { icon: ShieldCheck, t: "Honest by default", d: "Verified means verified. No promised jobs, projects or earnings." },
  { icon: Eye, t: "Built for the next billion", d: "Works on a ₹9,000 phone on 4G. Light, fast and mobile-first." },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About Campus"
        title={
          <>
            Talent is everywhere in India. <em className="accent">Opportunity isn't.</em>
          </>
        }
        description="Catalance Campus is where you learn a practical skill, prove it in one final assessment and get verified. It is part of Catalance."
        actions={
          <>
            <Button to="/tracks" size="xl" rightIcon={ArrowRight}>
              Explore Courses
            </Button>
            <Button to="/how-it-works" size="xl" variant="brandOutline">
              How It Works
            </Button>
          </>
        }
      />

      <section className="container-campus pb-20 sm:pb-28">
        <SectionHeader
          eyebrow="The problem"
          title={<>The gap starts with a <em className="accent">college name</em></>}
          description="A brilliant designer in Bikaner and an average one at a metro campus do not get the same chances. Tier-2 and tier-3 students rarely get working mentors or a fair way to prove what they can do."
        />
        <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
          {PROBLEM.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-4xl font-medium tracking-tight sm:text-5xl">{p.n}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">{p.l}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-subtle">Figures are approximate and for context.</p>
      </section>

      <section className="border-y border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-campus">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Our mission</p>
            <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
              Make proof, not college brand, the thing that <em className="accent">counts</em>
            </h2>
          </Reveal>
          <Reveal delay={0.06} className="mx-auto mt-10 grid max-w-4xl gap-6 text-base leading-relaxed text-muted sm:text-lg md:grid-cols-2 md:gap-10">
            <p>Campus replaces “where did you study?” with “what can you do?”. Each course ends with one practical assessment, scored against a published rubric. Pass it and complete your profile, and that skill is verified.</p>
            <p>We teach in the languages students actually think in and show every fee upfront. Verified learners become eligible for suitable Catalance projects when client work is available. Projects and earnings are not guaranteed.</p>
          </Reveal>
        </div>
      </section>

      <section className="container-campus py-20 sm:py-28">
        <SectionHeader eyebrow="What we believe" title={<>Our <em className="accent">values</em></>} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.t} delay={(i % 3) * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                <v.icon className="size-4.5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{v.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-campus">
          <Reveal className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-8 text-center sm:p-12">
            <p className="eyebrow">Part of Catalance</p>
            <h2 className="mt-3 text-2xl leading-[1.15] font-medium tracking-tight text-balance sm:text-4xl">
              Built by the team behind <em className="accent">Catalance</em>, India's freelance marketplace
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
              Catalance connects businesses with freelancers. Campus is where future Catalance freelancers learn and get verified. Client work is managed by Catalance project managers.
            </p>
            <p className="mt-4 text-sm text-subtle">One account for both: sign in to Campus with your Catalance account.</p>
          </Reveal>
        </div>
      </section>

      <InkCta />
      <PhotoCredits />
    </>
  );
}

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const expertiseItems = [
  "Website Development",
  "App Development",
  "Software Development",
  "Lead Generation",
  "Video Services",
  "CGI Videos",
  "3D Modeling",
  "SEO Optimization",
  "Social Media Management",
  "Influencer Marketing",
  "UGC Marketing",
  "Performance Marketing",
  "Creative & Design",
  "Brand Storytelling",
  "Writing & Content",
  "Customer Support",
  "CRM & ERP Solutions",
  "AI Automation",
  "Voice Agent",
  "WhatsApp Chat Bot",
];

const industriesAndNiches = [
  "Technology",
  "SaaS",
  "E-commerce",
  "Startups",
  "Consulting & Professional Services",
  "Personal Brands / Influencers",
  "Education",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Food & Beverage",
  "Entertainment & Media",
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Local Businesses",
];

const differentiators = [
  {
    title: "Strategy First. Always.",
    description:
      "We do not jump into execution blindly. Every project begins with understanding your business model, audience psychology, and revenue goals.",
  },
  {
    title: "Creative Meets Conversion",
    description:
      "Design that looks good is basic. Design that converts is powerful. We blend creativity with data to ensure every asset performs.",
  },
  {
    title: "Systems Over Chaos",
    description:
      "We build scalable frameworks, not temporary hacks. Whether it is SEO, paid ads, or brand positioning, we focus on long-term growth.",
  },
  {
    title: "Transparency & Accountability",
    description:
      "No jargon. No inflated promises. Clear reporting. Clear expectations. Clear results.",
  },
];

const aboutAccordionItems = [
  {
    title: "Our Story",
    content: (
      <div className="space-y-4">
        <p>
          Catalance was built with one clear mission: bridge the gap between
          vision and visibility.
        </p>
        <p>
          In a market full of noise, we focus on clarity. In a world chasing
          trends, we build systems. What started as a passion for creative
          storytelling and digital growth has evolved into a structured
          ecosystem of strategists, designers, developers, SEO experts, and
          growth marketers.
        </p>
      </div>
    ),
  },
  {
    title: "What Catalance Does",
    content: (
      <div className="space-y-4">
        <p>
          We are a performance-driven digital growth partner helping brands
          scale through strategy, creativity, and technology.
        </p>
        <p>
          From CGI videos and 3D modeling to SEO, performance marketing, brand
          storytelling, and automation, we combine innovation with execution.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expertiseItems.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: "Who We Work With",
    content: (
      <div className="space-y-4">
        <p>
          We collaborate with teams that want more than execution. We work with
          founders and businesses that need a partner who can move fast, think
          strategically, and deliver measurable outcomes.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {industriesAndNiches.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: "What Makes Us Different",
    content: (
      <div className="grid gap-3">
        {differentiators.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-black/20 p-4"
          >
            <p className="text-base font-semibold text-foreground dark:text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Our Vision",
    content: (
      <div className="space-y-4">
        <p>
          To become a global digital growth ecosystem where creativity meets
          measurable performance.
        </p>
        <p>
          We aim to build brands that last, not just campaigns that trend.
          Growth is not accidental. It is engineered.
        </p>
      </div>
    ),
  },
];

const About = () => {
  useEffect(() => {
    document.documentElement.classList.add("home-page");
    return () => {
      document.documentElement.classList.remove("home-page");
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-24">
        <header className="mb-12 space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            About Catalance
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            We Don&apos;t Just Deliver Projects.
            <br />
            We Build Momentum.
          </h1>
          <p className="max-w-4xl text-lg leading-relaxed text-muted-foreground dark:text-neutral-300">
            Catalance was built on a simple belief - businesses do not need more
            agencies. They need partners who think ahead, move fast, and execute
            with precision.
          </p>
          <p className="max-w-4xl text-lg leading-relaxed text-muted-foreground dark:text-neutral-300">
            We are a performance-driven digital growth partner helping brands
            scale through strategy, creativity, and technology.
          </p>
          <p className="max-w-4xl text-lg leading-relaxed text-muted-foreground dark:text-neutral-300">
            From CGI videos and 3D modeling to SEO, performance marketing, and
            brand storytelling - we combine innovation with execution. Because
            ideas are easy. Results are not.
          </p>
        </header>

        <section className="mb-12 rounded-3xl border border-black/10 bg-black/5 p-6 md:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">
              Inside Catalance
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              A quick look at what we build and why it matters
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground dark:text-neutral-300">
              Our work is organized around one idea: clarity creates momentum.
              Expand any section below to explore how Catalance thinks, builds,
              and grows.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="space-y-4"
          >
            {aboutAccordionItems.map((item, index) => (
              <AccordionItem
                key={item.title}
                value={`item-${index}`}
                className="overflow-hidden rounded-2xl border border-black/10 bg-black/5 px-2 dark:border-white/10 dark:bg-black/20"
              >
                <AccordionTrigger className="px-4 text-left text-lg font-semibold hover:no-underline hover:text-primary">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-6 text-base leading-relaxed text-muted-foreground dark:text-neutral-300">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="rounded-3xl border border-primary/30 bg-primary/10 p-6 md:p-8">
          <h2 className="text-3xl font-semibold text-primary">
            Let&apos;s Build Something That Compounds
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80 dark:text-neutral-200">
            Growth is not accidental.
            <br />
            It is engineered.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80 dark:text-neutral-200">
            If you are ready to stop experimenting and start scaling, Catalance
            is ready to partner with you.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80 dark:text-neutral-200">
            Let&apos;s accelerate your brand.
          </p>
          <Link to="/contact" className="mt-6 inline-block">
            <Button className="bg-primary text-black hover:bg-primary/90">
              Let&apos;s accelerate your brand
            </Button>
          </Link>
        </section>
      </section>
    </main>
  );
};

export default About;

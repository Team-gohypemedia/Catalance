import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

const About = () => {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-24">
        <header className="mb-12 space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">About Catalance</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            We Don&apos;t Just Deliver Projects.
            <br />
            We Build Momentum.
          </h1>
          <p className="max-w-4xl text-lg leading-relaxed text-neutral-300">
            Catalance was built on a simple belief - businesses do not need more agencies.
            They need partners who think ahead, move fast, and execute with precision.
          </p>
          <p className="max-w-4xl text-lg leading-relaxed text-neutral-300">
            We are a performance-driven digital growth partner helping brands scale
            through strategy, creativity, and technology.
          </p>
          <p className="max-w-4xl text-lg leading-relaxed text-neutral-300">
            From CGI videos and 3D modeling to SEO, performance marketing, and brand
            storytelling - we combine innovation with execution. Because ideas are easy.
            Results are not.
          </p>
        </header>

        <section className="mb-12 space-y-5">
          <h2 className="text-3xl font-semibold">Our Story</h2>
          <p className="text-lg leading-relaxed text-neutral-300">
            Catalance was founded with one clear mission:
            <br />
            To bridge the gap between vision and visibility.
          </p>
          <p className="text-lg leading-relaxed text-neutral-300">
            In a market full of noise, we focus on clarity.
            <br />
            In a world chasing trends, we build systems.
          </p>
          <p className="text-lg leading-relaxed text-neutral-300">
            What started as a passion for creative storytelling and digital growth has
            evolved into a structured ecosystem of strategists, designers, developers,
            SEO experts, and growth marketers - all aligned toward one goal: measurable
            impact.
          </p>
          <p className="text-lg leading-relaxed text-neutral-300">
            We do not chase vanity metrics.
            <br />
            We chase outcomes.
          </p>
        </section>

        <section className="mb-12 space-y-5">
          <h2 className="text-3xl font-semibold">What Makes Us Different</h2>
          <ol className="space-y-4">
            {differentiators.map((item, index) => (
              <li key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-lg font-semibold">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-2 text-base leading-relaxed text-neutral-300">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12 space-y-5">
          <h2 className="text-3xl font-semibold">Our Expertise</h2>
          <ul className="grid gap-3 text-lg text-neutral-300 sm:grid-cols-2">
            {expertiseItems.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <p className="text-lg leading-relaxed text-neutral-300">
            We operate at the intersection of storytelling and structure.
          </p>
        </section>

        <section className="mb-12 space-y-5">
          <h2 className="text-3xl font-semibold">Who We Work With</h2>
          <p className="text-lg leading-relaxed text-neutral-300">
            We collaborate with teams across these industries and niches:
          </p>
          <ul className="grid gap-3 text-lg text-neutral-300 sm:grid-cols-2">
            {industriesAndNiches.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <p className="text-lg leading-relaxed text-neutral-300">
            Whether you are launching, scaling, or repositioning - we step in as your
            growth catalyst.
          </p>
        </section>

        <section className="mb-12 space-y-5">
          <h2 className="text-3xl font-semibold">Our Vision</h2>
          <p className="text-lg leading-relaxed text-neutral-300">
            To become a global digital growth ecosystem where creativity meets measurable
            performance.
          </p>
          <p className="text-lg leading-relaxed text-neutral-300">
            We aim to build brands that last - not just campaigns that trend.
          </p>
        </section>

        <section className="rounded-3xl border border-primary/30 bg-primary/10 p-6 md:p-8">
          <h2 className="text-3xl font-semibold text-primary">Let&apos;s Build Something That Compounds</h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-200">
            Growth is not accidental.
            <br />
            It is engineered.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-neutral-200">
            If you are ready to stop experimenting and start scaling, Catalance is ready
            to partner with you.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-neutral-200">Let&apos;s accelerate your brand.</p>
          <Link to="/contact" className="mt-6 inline-block">
            <Button className="bg-primary text-black hover:bg-primary/90">Let&apos;s accelerate your brand</Button>
          </Link>
        </section>
      </section>
    </main>
  );
};

export default About;

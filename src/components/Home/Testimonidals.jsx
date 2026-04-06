import React from 'react'
import { Wormhole } from '@/components/ui/wormhole'
import { Marquee } from '@/components/ui/marquee'

const testimonials = [
  {
    quote:
    'The CGI ads they designed for us were a game-changer. They not only looked incredible but also conveyed our message perfectly. Our engagement and conversions saw a big boost.',
    name: '',
    role: 'CGI Artist',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    quote:
    'From the start, Go Hype Media impressed with their clarity and planning. They laid out what to expect, delivered on time, and were flexible when we needed tweaks. Our online presence got a major boost',
    name: 'Mohd Kaif',
    role: 'Software Engineer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjV87ET3lWHlXGslhEmY3VTVa9sYEXAQKJCea8dCd3K0w4u7JRHM=w72-h72-p-rp-mo-br100',
  },
  {
    quote:
      'If you’re looking for a digital-agency in Delhi that actually cares, Go Hype Media is it. They took time to understand our business, crafted a customised plan (not just a cookie-cutter approach) and executed with good communication throughout.',
    name: 'Aniket Thakur',
    role: 'Software Engineer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjX3ddj5TywgZTltbWR04JBTX0AUnCLMMXT5jxgHvxkkkf2L7H8V=w72-h72-p-rp-mo-br100',
  },
  {
    quote:
      'Amazing experience with Go Hype Media — creative team, quick delivery, and great results.',
    name: 'Ajay Prajapati',
    role: 'UX Designer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjXIHrkC7Kh18MDC6VznKCkq7j2QygoDlUlZZ2cG9jtmvmKRTgek=w72-h72-p-rp-mo-br100',
  },
  {
    quote:
      'Go hype media best social media agency in Delhi and best digital market agency in Delhi I am recommended it always',
    name: 'Nitin Nayak',
    role: 'Video Editor',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjVWLMJeRN_Pk1A0PYQMcaeaRI-cfmX2EL8DPdlRSHnn9ie0gB4=w72-h72-p-rp-mo-br100',
  },
]

function StarRating() {
  return (
    <div className="flex items-center gap-1 text-amber-300" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.49 5.04 5.56.81-4.02 3.92.95 5.54L10 13.98 5.02 16.81l.95-5.54-4.02-3.92 5.56-.81L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }) {
  return (
    <article className="group flex w-[21rem] shrink-0 flex-col justify-between rounded-[1.75rem] border border-white/10 bg-transparent p-6 text-left backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:w-[23rem]">
      <div>
        <StarRating />
        <p className="mt-4 text-lg leading-8 text-white/90">{testimonial.quote}</p>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="h-14 w-14 rounded-full object-cover grayscale transition duration-300 group-hover:grayscale-0"
          loading="lazy"
          decoding="async"
        />
        <div>
          <p className="text-base font-semibold text-white">{testimonial.name}</p>
          <p className="text-sm text-white/65">{testimonial.role}</p>
          <p className="text-sm text-white/45">{testimonial.handle}</p>
        </div>
      </div>
    </article>
  )
}

const Testimonidals = () => {
  return (
    <section className="relative h-screen overflow-hidden bg-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-95" aria-hidden="true">
        <Wormhole
          lines={{
            delay: 1.4,
            duration: 1.4,
            stroke: 1.1,
            opacity: [0.18, 1, 0.45],
            colors: ["rgb(135, 72, 0)", "rgb(135, 72, 0)", "rgb(135, 72, 0)"],
          }}
          rings={{
            delay: 0.4,
            duration: 0.4,
            stagger: 0.06,
            offset: -30,
            stroke: 1.1,
            opacity: [0.18, 1, 0.45],
            colors: ["rgb(135, 72, 0)", "rgb(135, 72, 0)", "rgb(135, 72, 0)"],
          }}
          pulse={{
            delay: 1.4,
            loopDelay: 0,
            duration: 1.4,
            stroke: 1.25,
            opacity: [0.1, 0.85, 0.2],
            colors: ["var(--primary)", "var(--primary)", "var(--primary)"],
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-4 pt-20 pb-15 sm:px-6 lg:px-10">
        <div className="mx-auto inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-1 text-sm font-medium text-white/90 backdrop-blur-md">
          Testimonials
        </div>

        <header className="mx-auto mt-6 max-w-4xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            <span className="block">Don&apos;t Just Take Our</span>
            <span className="block">Word For It</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            At SocialLift, we take the stress out of social media management.
          </p>
        </header>

        <div className="relative mt-auto pb-8 pt-10">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent sm:w-32" />

          <Marquee className="p-0 [--duration:68s] [--gap:1.5rem]" pauseOnHover={false} repeat={5}>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.handle} testimonial={testimonial} />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}

export default Testimonidals
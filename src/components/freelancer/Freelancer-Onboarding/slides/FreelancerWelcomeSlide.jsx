import React from 'react'

const FreelancerWelcomeSlide = () => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div className="space-y-5 sm:space-y-6">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-[4.65rem] lg:leading-[1.02]">
          <span>Time to </span>
          <span className="text-primary">Show Off </span>
          <span>a Little</span>
        </h1>

        <p className="mx-auto max-w-3xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
          Tell us what you're great at so we can match you with clients who'll actually appreciate it. No boring forms, we promise.
        </p>
      </div>
    </section>
  )
}

export default FreelancerWelcomeSlide

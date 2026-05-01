import React from 'react'
import {
  ONBOARDING_PAGE_SUBTITLE_CLASS,
  ONBOARDING_SERVICE_SETUP_TITLE_CLASS,
} from "../typography";

const FreelancerWelcomeSlide = () => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div className="space-y-5 sm:space-y-6">
        <h1 className={ONBOARDING_SERVICE_SETUP_TITLE_CLASS}>
          <span>Time to </span>
          <span className="text-primary">Show Off </span>
          <span>a Little</span>
        </h1>

        <p className={`mx-auto max-w-3xl text-pretty ${ONBOARDING_PAGE_SUBTITLE_CLASS} text-muted-foreground`}>
          Tell us what you're great at so we can match you with clients who'll actually appreciate it. No boring forms, we promise.
        </p>
      </div>
    </section>
  )
}

export default FreelancerWelcomeSlide

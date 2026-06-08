import React from 'react'

const FreelancerWelcomeSlide = ({ continueButton }) => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2 lg:mb-4">
          <span>Time to </span>
          <span className="text-primary">Show Off </span>
          <span>a Little</span>
        </h1>

        <p className={`mx-auto md:max-w-xl lg:max-w-2xl md:text-base lg:text-lg font-regular text-muted-foreground`}>
          Share your strengths, we'll match you with clients who value them.
        </p>

        {continueButton}
      </div>
    </section>
  )
}

export default FreelancerWelcomeSlide

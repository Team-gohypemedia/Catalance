import React from 'react'

const ClientCTA = () => {
  return (
    <section className="bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-background px-6 py-12 sm:px-10 sm:py-14 lg:min-h-[460px] lg:px-16">
          <div className="absolute inset-0 bg-background" />

          <div className="absolute -left-28 top-1/2 h-[440px] w-[440px] -translate-y-1/2 rounded-full bg-primary/35 blur-[120px]" />
          <div className="absolute -right-28 top-1/2 h-[440px] w-[440px] -translate-y-1/2 rounded-full bg-primary/35 blur-[120px]" />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/0.28)_0%,hsl(var(--background))_50%,hsl(var(--primary)/0.28)_100%)]" />

          <div className="relative z-10 flex min-h-[360px] items-center justify-center">
            <div className="w-full max-w-[760px] text-center">
              <h2 className="text-[3rem] font-semibold leading-[0.9] tracking-[-0.07em] text-foreground sm:text-[4rem] lg:text-[5rem]">
                <span className="block">Freelance services</span>
                <span className="block">at your fingertips</span>
              </h2>

              <p className="mx-auto mt-6 max-w-[26ch] text-[1.05rem] leading-[1.45] text-foreground/82 sm:text-[1.1rem]">
                On-demand expert freelancers for every project
              </p>

              <button
                type="button"
                className="mx-auto mt-8 inline-flex h-12 items-center justify-center rounded-[1rem] bg-primary px-7 text-[1rem] font-medium text-primary-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.3)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Connect Collaborate Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ClientCTA
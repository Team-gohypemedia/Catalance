import React from 'react'

const ClientCTA = () => {
  return (
    <section className="bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-45 w-full max-w-310 flex-col items-center justify-center rounded-[2.5rem] bg-[#e0b700] px-6 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:px-10 sm:py-12">
        <h2 className="max-w-3xl text-2xl font-medium tracking-tight text-black sm:text-3xl lg:text-[2.2rem]">
          Freelance services at your fingertips
        </h2>

        <button
          type="button"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-8 py-3 text-base font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          Connect Collaborate Create
        </button>
      </div>
    </section>
  )
}

export default ClientCTA
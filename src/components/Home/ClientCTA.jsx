import React from 'react'
import { Button } from '@/components/ui/button'
import LightRays from '@/components/ui/LightRays'

const ClientCTA = () => {
  return (
    <section className="bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-background px-6 py-12 sm:px-10 sm:py-14 lg:min-h-[460px] lg:px-16">
          <div className="absolute inset-0 bg-background" />

          <div
            className="absolute inset-x-0 top-0 z-[1] h-[70%]"
            style={{
              background:
                'linear-gradient(180deg, var(--primary) 0%, var(--background) 100%)',
              opacity: 1,
            }}
          />

          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex justify-center"
            style={{
              WebkitMaskImage:
                'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.76) 58%, rgba(0,0,0,0.34) 82%, rgba(0,0,0,0) 100%)',
              maskImage:
                'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.76) 58%, rgba(0,0,0,0.34) 82%, rgba(0,0,0,0) 100%)',
            }}
          >
            <div className="h-[440px] w-full">
              <LightRays
                raysOrigin="top-center"
                raysColor="#000000"
                raysSpeed={0.9}
                lightSpread={0.9}
                rayLength={2}
                fadeDistance={1}
                followMouse={false}
                mouseInfluence={0}
                noiseAmount={0}
                distortion={0}
                className="h-full w-full opacity-70"
              />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[360px] items-center justify-center">
            <div className="w-full max-w-[760px] text-center">
              <h2 className="text-[3rem] font-semibold leading-[0.9] tracking-[-0.07em] text-foreground sm:text-[4rem] lg:text-[5rem]">
                <span className="block">Freelance services</span>
                <span className="block">at your fingertips</span>
              </h2>
              <Button
              type="button"
              size="lg"
              className="mt-10"
              >
                Connect Collaborate Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ClientCTA
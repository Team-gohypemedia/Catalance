import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import LightRays from '@/components/ui/LightRays'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const CTA_WORDS = ['Connect', 'Collaborate', 'Create']
const CTA_WORD_ROTATION_MS = 1700
const CTA_LONGEST_WORD = CTA_WORDS.reduce(
  (longestWord, word) => (word.length > longestWord.length ? word : longestWord),
  CTA_WORDS[0] || ''
)

const ClientCTA = () => {
  const [activeWordIndex, setActiveWordIndex] = useState(0)

  useEffect(() => {
    if (CTA_WORDS.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveWordIndex((currentIndex) => (currentIndex + 1) % CTA_WORDS.length)
    }, CTA_WORD_ROTATION_MS)

    return () => window.clearInterval(intervalId)
  }, [])

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
                asChild
                size="lg"
                aria-label={CTA_WORDS.join(', ')}
                className="mt-10 h-12 rounded-xl px-8 text-lg font-semibold shadow-[0_14px_36px_rgba(255,204,0,0.22)]"
              >
                <Link to="/service">
                  <span
                    aria-hidden="true"
                    className="relative inline-grid h-[1.1em] min-w-[11ch] place-items-center overflow-hidden leading-none"
                  >
                    <span className="invisible col-start-1 row-start-1">{CTA_LONGEST_WORD}</span>
                    <AnimatePresence initial={false} mode="sync">
                      <motion.span
                        key={CTA_WORDS[activeWordIndex]}
                        initial={{ y: '115%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        exit={{ y: '-115%', opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
                      >
                        {CTA_WORDS[activeWordIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ClientCTA

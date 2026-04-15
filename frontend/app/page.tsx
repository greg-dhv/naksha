'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LuminousField from '@/components/LuminousField'

export default function LandingPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-void">
      <LuminousField />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
        }}
      >
        {/* Mark */}
        <div className="mb-8">
          <div
            className="w-12 h-12 mx-auto mb-6 rounded-full"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(242,235,218,0.9) 0%, rgba(201,164,90,0.6) 50%, transparent 100%)',
              boxShadow: '0 0 40px rgba(201,164,90,0.35), 0 0 80px rgba(201,164,90,0.12)',
            }}
          />
        </div>

        {/* Wordmark */}
        <h1
          className="text-6xl sm:text-7xl font-serif tracking-widest mb-4"
          style={{
            background: 'linear-gradient(160deg, #f0e8d4 0%, #c9a45a 50%, #f0e8d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.18em',
          }}
        >
          naksha
        </h1>

        {/* Tagline */}
        <p
          className="text-sm tracking-[0.35em] uppercase mb-3"
          style={{ color: 'var(--gold)', opacity: 0.7 }}
        >
          your karmic map
        </p>

        {/* Descriptor */}
        <p
          className="text-base leading-relaxed mt-6 mb-12"
          style={{ color: 'rgba(242,235,218,0.5)', maxWidth: '360px', lineHeight: '1.9' }}
        >
          Vedic astrology that actually knows you. Not a horoscope — a living relationship
          with your karmic blueprint.
        </p>

        {/* CTA */}
        <Link
          href="/onboarding"
          className="group relative inline-flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase"
          style={{
            color: 'var(--cream)',
            border: '1px solid rgba(201,164,90,0.35)',
            borderRadius: '2px',
            letterSpacing: '0.22em',
            transition: 'all 0.4s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'rgba(201,164,90,0.7)'
            el.style.boxShadow = '0 0 30px rgba(201,164,90,0.15)'
            el.style.background = 'rgba(201,164,90,0.05)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'rgba(201,164,90,0.35)'
            el.style.boxShadow = 'none'
            el.style.background = 'transparent'
          }}
        >
          Read your karmic map
          <span style={{ opacity: 0.6 }}>→</span>
        </Link>

        {/* Secondary note */}
        <p className="mt-8 text-xs" style={{ color: 'rgba(242,235,218,0.25)', letterSpacing: '0.1em' }}>
          Based on Vedic astrology · Sidereal zodiac · Lahiri ayanamsa
        </p>
      </div>

      {/* Ambient glow at center */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,164,90,0.04) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
        }}
      />
    </main>
  )
}

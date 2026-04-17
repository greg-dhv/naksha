'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import MinimalChartIllustration from '@/components/MinimalChartIllustration'

const BG = '#1e2d3a'

export default function LandingPage() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 120); return () => clearTimeout(t) }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans, "Nunito Sans", system-ui, sans-serif)',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '28px 52px',
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          Naksha
        </span>
        <Link
          href="/onboarding"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.45)',
            textDecoration: 'none',
            transition: 'color 300ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          Begin →
        </Link>
      </nav>

      {/* Hero */}
      <div
        className={visible ? 'page-visible' : 'page-enter'}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '0 52px',
          paddingTop: '88px',
          paddingBottom: '60px',
          gap: '32px',
        }}
      >
        {/* Left column */}
        <div style={{ flex: '0 0 56%', maxWidth: '56%' }}>
          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 200,
              fontSize: 'clamp(44px, 5.5vw, 82px)',
              lineHeight: 1.06,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              marginBottom: '32px',
            }}
          >
            Align with your<br />cosmic blueprint.
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 300,
              fontSize: '16px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.6)',
              maxWidth: '460px',
              marginBottom: '52px',
            }}
          >
            Ancient Vedic astrology distilled into clear guidance.
            Understand your life's rhythms, uncover your inherent strengths,
            and navigate time with purpose.
          </p>

          <Link
            href="/onboarding"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '14px 38px',
              textDecoration: 'none',
              transition: 'all 300ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
          >
            Read your karmic map
          </Link>
        </div>

        {/* Right column — illustration */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <MinimalChartIllustration size={320} />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px 52px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {['Vedic · Sidereal', 'Lahiri Ayanamsa', 'Jyotiṣa'].map(text => (
          <span
            key={text}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </main>
  )
}

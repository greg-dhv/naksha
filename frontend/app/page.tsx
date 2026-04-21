'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MinimalChartIllustration from '@/components/MinimalChartIllustration'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const [visible, setVisible] = useState(false)
  const { user, loading, openAuthModal } = useAuth()
  const router = useRouter()

  useEffect(() => { const t = setTimeout(() => setVisible(true), 120); return () => clearTimeout(t) }, [])

  useEffect(() => {
    if (!loading && user) router.replace('/home')
  }, [loading, user, router])

  const navLinkStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 400,
    color: 'var(--nk-text-3)',
    textDecoration: 'none',
    transition: 'color 200ms ease',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--nk-ground)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        borderBottom: '1px solid var(--nk-border-hair)',
        background: 'rgba(11,18,32,0.85)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', color: 'var(--nk-primary)',
          }}>
            ✦
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '11px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            fontWeight: 600, color: 'var(--nk-text)',
          }}>
            Naksha
          </span>
        </div>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          {!loading && !user && (
            <button
              onClick={openAuthModal}
              style={navLinkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--nk-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--nk-text-3)')}
            >
              Sign in
            </button>
          )}
          <Link
            href="/onboarding"
            style={{
              ...navLinkStyle,
              color: 'var(--nk-primary)',
              border: '1px solid var(--nk-primary-line)',
              padding: '8px 18px',
              borderRadius: 'var(--nk-r-sm)',
              background: 'var(--nk-primary-dim)',
            }}
          >
            Begin →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div
        className={visible ? 'page-visible' : 'page-enter'}
        style={{
          flex: 1, display: 'flex', alignItems: 'center',
          padding: '0 40px', paddingTop: '96px', paddingBottom: '60px',
          gap: '40px',
        }}
      >
        {/* Left column */}
        <div style={{ flex: '0 0 54%', maxWidth: '54%' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: '10px',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--nk-primary)', opacity: 0.8,
            }}>
              Vedic · Sidereal · Jyotiṣa
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-sans)', fontWeight: 200,
            fontSize: 'clamp(40px, 5vw, 76px)',
            lineHeight: 1.06, color: 'var(--nk-text)',
            letterSpacing: '-0.01em', marginBottom: '28px',
          }}>
            Align with your<br />cosmic blueprint.
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans)', fontWeight: 300,
            fontSize: '16px', lineHeight: 1.75,
            color: 'var(--nk-text-2)',
            maxWidth: '440px', marginBottom: '48px',
          }}>
            Ancient Vedic astrology distilled into clear guidance.
            Understand your life's rhythms, uncover your inherent strengths,
            and navigate time with purpose.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href={user ? '/home' : '/onboarding'}
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-sans)', fontSize: '11px',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                fontWeight: 500,
                color: '#fff',
                background: 'var(--nk-primary)',
                padding: '14px 32px',
                textDecoration: 'none',
                borderRadius: 'var(--nk-r-sm)',
                transition: 'background 200ms ease',
                boxShadow: 'var(--nk-primary-glow)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--nk-primary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--nk-primary)')}
            >
              {user ? 'View my chart' : 'Read your karmic map'}
            </Link>
            {!loading && !user && (
              <button
                onClick={openAuthModal}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '11px',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  fontWeight: 400,
                  color: 'var(--nk-text-2)',
                  background: 'transparent',
                  border: '1px solid var(--nk-border)',
                  padding: '14px 28px',
                  borderRadius: 'var(--nk-r-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 200ms ease, color 200ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--nk-border-hover)'
                  e.currentTarget.style.color = 'var(--nk-text)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--nk-border)'
                  e.currentTarget.style.color = 'var(--nk-text-2)'
                }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Right column — illustration */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <MinimalChartIllustration size={300} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '40px',
        padding: '20px 40px',
        borderTop: '1px solid var(--nk-border-hair)',
      }}>
        {['Lahiri Ayanamsa', 'Whole Sign Houses', 'Vimshottari Dasha'].map(text => (
          <span key={text} style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--nk-text-4)',
          }}>
            {text}
          </span>
        ))}
      </div>
    </main>
  )
}

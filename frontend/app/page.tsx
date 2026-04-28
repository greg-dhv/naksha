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

  return (
    <>
      <style>{`
        .lp-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 10;
          border-bottom: 1px solid var(--nk-border-hair);
          background: rgba(11,18,32,0.88);
          backdrop-filter: blur(20px);
        }
        .lp-nav-actions { display: flex; gap: 16px; align-items: center; }
        .lp-nav-signin {
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 400;
          color: var(--nk-text-3);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 200ms ease;
        }
        .lp-nav-signin:hover { color: var(--nk-text); }
        .lp-nav-begin {
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 400;
          color: var(--nk-primary);
          border: 1px solid var(--nk-primary-line);
          padding: 8px 16px;
          border-radius: var(--nk-r-sm);
          background: var(--nk-primary-dim);
          text-decoration: none;
        }

        /* Hero */
        .lp-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 96px 24px 48px;
          gap: 0;
        }
        .lp-illustration {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 32px;
          order: -1;
        }
        .lp-eyebrow {
          font-family: var(--font-sans);
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--nk-primary);
          opacity: 0.8;
          margin-bottom: 20px;
        }
        .lp-h1 {
          font-family: var(--font-sans);
          font-weight: 200;
          font-size: clamp(36px, 10vw, 76px);
          line-height: 1.06;
          color: var(--nk-text);
          letter-spacing: -0.01em;
          margin-bottom: 24px;
        }
        .lp-sub {
          font-family: var(--font-sans);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.75;
          color: var(--nk-text-2);
          max-width: 420px;
          margin: 0 auto 40px;
        }
        .lp-ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
        }
        .lp-cta-primary {
          display: block;
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 500;
          color: #fff;
          background: var(--nk-primary);
          padding: 16px 32px;
          text-decoration: none;
          border-radius: var(--nk-r-sm);
          transition: background 200ms ease;
          box-shadow: var(--nk-primary-glow);
          text-align: center;
        }
        .lp-cta-primary:hover { background: var(--nk-primary-hover); }
        .lp-cta-secondary {
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 400;
          color: var(--nk-text-2);
          background: transparent;
          border: 1px solid var(--nk-border);
          padding: 16px 28px;
          border-radius: var(--nk-r-sm);
          cursor: pointer;
          transition: border-color 200ms ease, color 200ms ease;
          width: 100%;
        }
        .lp-cta-secondary:hover {
          border-color: var(--nk-border-hover);
          color: var(--nk-text);
        }

        /* Bottom bar */
        .lp-bottom {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 16px 32px;
          padding: 20px 24px;
          border-top: 1px solid var(--nk-border-hair);
        }
        .lp-bottom span {
          font-family: var(--font-sans);
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--nk-text-4);
        }

        /* Desktop */
        @media (min-width: 768px) {
          .lp-nav { padding: 24px 40px; }
          .lp-nav-actions { gap: 28px; }
          .lp-nav-begin { padding: 8px 18px; }
          .lp-hero {
            flex-direction: row;
            text-align: left;
            align-items: center;
            padding: 0 40px;
            padding-top: 96px;
            padding-bottom: 60px;
            gap: 40px;
          }
          .lp-text-col {
            flex: 0 0 54%;
            max-width: 54%;
          }
          .lp-illustration {
            flex: 1;
            margin-bottom: 0;
            order: 1;
          }
          .lp-text-col { order: 0; }
          .lp-sub { margin: 0 0 48px; }
          .lp-ctas {
            flex-direction: row;
            max-width: none;
            margin: 0;
          }
          .lp-cta-primary { display: inline-block; }
          .lp-cta-secondary { width: auto; }
          .lp-bottom { gap: 40px; padding: 20px 40px; }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'var(--nk-ground)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Nav */}
        <nav className="lp-nav">
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

          <div className="lp-nav-actions">
            {!loading && !user && (
              <button className="lp-nav-signin" onClick={() => openAuthModal()}>
                Sign in
              </button>
            )}
            <Link href="/onboarding" className="lp-nav-begin">
              Begin →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className={`lp-hero ${visible ? 'page-visible' : 'page-enter'}`}>
          {/* Illustration — top on mobile, right on desktop */}
          <div className="lp-illustration">
            <MinimalChartIllustration size={260} />
          </div>

          {/* Text col */}
          <div className="lp-text-col">
            <p className="lp-eyebrow">Vedic · Sidereal · Jyotiṣa</p>

            <h1 className="lp-h1">
              Vedic astrology,<br />made legible.
            </h1>

            <p className="lp-sub">
              Ancient Vedic astrology distilled into clear guidance.
              Understand your life's rhythms, uncover your inherent strengths,
              and navigate time with purpose.
            </p>

            <div className="lp-ctas">
              <Link
                href={user ? '/home' : '/onboarding'}
                className="lp-cta-primary"
              >
                {user ? 'View my chart' : 'Read your karmic map'}
              </Link>
            </div>
            {!loading && !user && (
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--nk-text-4)',
                marginTop: '14px',
              }}>
                No signup required · Free
              </p>
            )}
          </div>

        </div>

        {/* Bottom bar */}
        <div className="lp-bottom">
          {['Lahiri Ayanamsa', 'Whole Sign Houses', 'Vimshottari Dasha'].map(text => (
            <span key={text}>{text}</span>
          ))}
        </div>
      </main>
    </>
  )
}

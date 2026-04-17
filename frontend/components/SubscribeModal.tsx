'use client'
import { useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  unlockedBy?: string
}

const TIER1 = [
  '12 depth readings — Shadow Pattern, Love Karma, Career Blueprint & more',
  'Monday weekly briefing — what\'s active in your chart this week',
  'Monthly reading — deep reading at every new moon',
  'Transit alerts — only when the sky speaks to your chart',
  'Dasha timeline — your complete life chapter map',
]

const TIER2 = [
  'Everything in The Map',
  'Chart-aware AI guide — ask anything through the lens of your chart',
  'Relationship karma reading — what two charts are here to teach each other',

]

export default function SubscribeModal({ isOpen, onClose, unlockedBy }: Props) {
  const [plan, setPlan] = useState<'map' | 'guide'>('map')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    console.log('Early access:', email, plan)
    setDone(true)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(42,56,66,0.88)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* SM: bottom sheet, MD+: centered */}
      <div
        style={{
          width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
          background: '#3a4e5c',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 40px',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '24px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-label)', fontSize: '18px',
            color: 'var(--clr-text-3)',
          }}
          aria-label="Close"
        >
          ×
        </button>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 24px',
              background: 'radial-gradient(circle, rgba(200,170,110,0.8) 0%, rgba(200,170,110,0.1) 100%)',
            }} />
            <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 'var(--text-h2)', fontWeight: 300, color: 'var(--clr-text)', marginBottom: '12px' }}>
              You're on the list
            </h3>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: 'var(--text-sm)', color: 'var(--clr-text-2)', lineHeight: 'var(--leading-normal)' }}>
              We'll reach you when early access opens.
            </p>
          </div>
        ) : (
          <>
            <p className="label label--accent" style={{ marginBottom: '16px' }}>Unlock your full map</p>
            <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 'var(--text-h2)', fontWeight: 200, color: 'var(--clr-text)', marginBottom: '10px' }}>
              {unlockedBy ? `Unlock ${unlockedBy}` : 'Go deeper'}
            </h3>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: 'var(--text-sm)', color: 'var(--clr-text-2)', lineHeight: 'var(--leading-normal)', marginBottom: '32px' }}>
              Your karmic map has layers. Each one reveals more of the pattern beneath your life.
            </p>

            {/* Plan toggle */}
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '28px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
            }}>
              {([
                { key: 'map' as const,   label: 'The Map',   price: '€11.99 / mo' },
                { key: 'guide' as const, label: 'The Guide', price: '€29.99 / mo' },
              ]).map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-sm)',
                    background: plan === p.key ? 'var(--clr-accent-dim)' : 'transparent',
                    border: `1px solid ${plan === p.key ? 'var(--clr-accent-line)' : 'transparent'}`,
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all var(--dur-normal)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: plan === p.key ? 'var(--clr-text)' : 'var(--clr-text-2)', display: 'block' }}>
                    {p.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '10px', color: plan === p.key ? 'var(--clr-accent)' : 'var(--clr-text-3)', display: 'block', marginTop: '2px' }}>
                    {p.price}
                  </span>
                </button>
              ))}
            </div>

            {/* Features */}
            <ul style={{ listStyle: 'none', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(plan === 'map' ? TIER1 : TIER2).map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--clr-accent)', opacity: 0.6, flexShrink: 0, marginTop: '1px', fontSize: '10px' }}>✦</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', color: 'var(--clr-text-2)', lineHeight: 'var(--leading-normal)' }}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {/* Email capture */}
            <form onSubmit={handleSubmit}>
              <p className="label" style={{ marginBottom: '12px' }}>Early access — we'll reach you first</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--clr-text)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-sm)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    background: 'var(--clr-accent-dim)',
                    border: '1px solid var(--clr-accent-line)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-label)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--clr-accent)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Join
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  unlockedBy?: string   // which section triggered the modal
}

const TIER1_FEATURES = [
  '12 weekly depth cards — Shadow Pattern, Love Karma, Career Blueprint & more',
  'Monday weekly briefing — what\'s active in your chart this week',
  'Monthly reading — 1000-word deep reading at every new moon',
  'Transit alerts — event-driven, only when the sky speaks to your chart',
  'Dasha timeline — your complete life chapter map',
]

const TIER2_FEATURES = [
  'Everything in The Map',
  'Chart-aware AI guide — ask anything about your life through the lens of your chart',
  'Relationship karma reading — what you and another person are here to teach each other',
]

export default function SubscribeModal({ isOpen, onClose, unlockedBy }: Props) {
  const [selected, setSelected] = useState<'map' | 'guide'>('map')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // TODO: wire to email list (Mailchimp / ConvertKit / etc.)
    console.log('Early access email:', email, 'Plan:', selected)
    setSubmitted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: '#0c0c1e',
          border: '1px solid rgba(201,164,90,0.2)',
          borderRadius: '20px',
          padding: '40px 36px',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-lg"
          style={{ color: 'rgba(242,235,218,0.25)' }}
          aria-label="Close"
        >
          ×
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div
              className="w-10 h-10 mx-auto mb-6 rounded-full"
              style={{ background: 'radial-gradient(circle at 40% 35%, rgba(201,164,90,0.9) 0%, rgba(201,164,90,0.2) 100%)' }}
            />
            <h3 className="text-2xl font-serif mb-3" style={{ color: 'var(--cream)' }}>
              You're on the list
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: '1.8' }}>
              We'll reach you when early access opens. In the meantime, your karmic map is waiting.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', opacity: 0.65 }}>
              Unlock your full map
            </p>
            <h3 className="text-2xl font-serif mb-2" style={{ color: 'var(--cream)' }}>
              {unlockedBy ? `Unlock ${unlockedBy}` : 'Go deeper'}
            </h3>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)', lineHeight: '1.8' }}>
              Your karmic map has layers. Each one reveals more of the pattern beneath your life.
            </p>

            {/* Plan toggle */}
            <div
              className="flex gap-3 mb-8"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '4px',
              }}
            >
              {([
                { key: 'map', label: 'The Map', price: '€11.99/mo' },
                { key: 'guide', label: 'The Guide', price: '€29.99/mo' },
              ] as const).map(plan => (
                <button
                  key={plan.key}
                  onClick={() => setSelected(plan.key)}
                  className="flex-1 py-3 text-sm text-center rounded-lg transition-all duration-300"
                  style={{
                    background: selected === plan.key ? 'rgba(201,164,90,0.12)' : 'transparent',
                    border: selected === plan.key ? '1px solid rgba(201,164,90,0.25)' : '1px solid transparent',
                    color: selected === plan.key ? 'var(--cream)' : 'var(--muted)',
                  }}
                >
                  <span className="block font-medium">{plan.label}</span>
                  <span className="block text-xs mt-0.5" style={{ color: selected === plan.key ? 'var(--gold)' : 'rgba(107,111,136,0.7)' }}>
                    {plan.price}
                  </span>
                </button>
              ))}
            </div>

            {/* Features */}
            <ul className="mb-8 space-y-3">
              {(selected === 'map' ? TIER1_FEATURES : TIER2_FEATURES).map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(242,235,218,0.65)', lineHeight: '1.6' }}>
                  <span style={{ color: 'var(--gold)', opacity: 0.7, flexShrink: 0, marginTop: '2px' }}>✦</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Email capture */}
            <form onSubmit={handleSubmit}>
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                We're in early access. Join the list — we'll reach you first.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--cream)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="px-5 py-3 text-sm rounded-lg transition-all"
                  style={{
                    background: 'rgba(201,164,90,0.15)',
                    border: '1px solid rgba(201,164,90,0.3)',
                    color: 'var(--gold)',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Get early access
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

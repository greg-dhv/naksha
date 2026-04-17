'use client'

interface Props {
  title: string
  description: string
  tier: 1 | 2
  tierLabel: string
  price: string
  preview: React.ReactNode
  onUnlock: () => void
}

export default function BlurredSection({ title, description, tier, tierLabel, price, preview, onUnlock }: Props) {
  const accentColor = tier === 2 ? '#9070b0' : 'var(--clr-accent)'
  const accentBorder = tier === 2 ? 'rgba(144,112,176,0.25)' : 'var(--clr-accent-line)'
  const accentDim    = tier === 2 ? 'rgba(144,112,176,0.10)' : 'var(--clr-accent-dim)'

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Blurred preview */}
      <div style={{ filter: 'blur(5px)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }}>
        {preview}
      </div>

      {/* Lock overlay */}
      <div
        className="blur-lock"
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '48px 32px',
          cursor: 'pointer',
        }}
        onClick={onUnlock}
      >
        {/* Tier badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 14px', borderRadius: '40px', marginBottom: '20px',
          background: accentDim, border: `1px solid ${accentBorder}`,
          fontFamily: 'var(--font-label)', fontSize: '10px',
          letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase',
          color: accentColor,
        }}>
          ✦ {tierLabel}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-label)', fontSize: 'var(--text-h3)', fontWeight: 300,
          color: 'var(--clr-text)', marginBottom: '10px',
        }}>
          {title}
        </h3>

        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
          color: 'var(--clr-text-2)', maxWidth: '300px', lineHeight: 'var(--leading-normal)',
          marginBottom: '28px',
        }}>
          {description}
        </p>

        <button
          onClick={onUnlock}
          style={{
            background: accentDim, border: `1px solid ${accentBorder}`,
            borderRadius: 'var(--radius-sm)', padding: '12px 28px', cursor: 'pointer',
            fontFamily: 'var(--font-label)', fontSize: '11px',
            letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase',
            color: accentColor,
            transition: 'all var(--dur-normal)',
          }}
        >
          Unlock · {price}
        </button>
      </div>
    </div>
  )
}

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
  return (
    <div className="relative overflow-hidden" style={{ borderRadius: '16px' }}>
      {/* Blurred preview content */}
      <div
        className="pointer-events-none select-none"
        style={{
          filter: 'blur(6px)',
          opacity: 0.45,
          userSelect: 'none',
        }}
      >
        {preview}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 cursor-pointer"
        style={{
          background: 'rgba(7,7,15,0.7)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onUnlock}
      >
        {/* Tier badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
          style={{
            background: tier === 2 ? 'rgba(160,128,192,0.12)' : 'rgba(201,164,90,0.10)',
            border: `1px solid ${tier === 2 ? 'rgba(160,128,192,0.25)' : 'rgba(201,164,90,0.22)'}`,
            color: tier === 2 ? '#a080c0' : 'var(--gold)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>✦</span>
          <span>{tierLabel}</span>
        </div>

        {/* Lock icon */}
        <div
          className="w-10 h-10 flex items-center justify-center rounded-full mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '16px',
          }}
        >
          🔒
        </div>

        <h3 className="text-xl font-serif mb-2" style={{ color: 'var(--cream)' }}>
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)', maxWidth: '280px', lineHeight: '1.7' }}>
          {description}
        </p>

        <button
          className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg transition-all"
          style={{
            background: tier === 2 ? 'rgba(160,128,192,0.12)' : 'rgba(201,164,90,0.10)',
            border: `1px solid ${tier === 2 ? 'rgba(160,128,192,0.3)' : 'rgba(201,164,90,0.28)'}`,
            color: tier === 2 ? '#c0a0e0' : 'var(--gold)',
            letterSpacing: '0.12em',
          }}
          onClick={onUnlock}
        >
          Unlock · {price}
        </button>
      </div>
    </div>
  )
}

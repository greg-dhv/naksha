'use client'
import { ChartResponse } from '@/lib/types'
import { PLANET_COLORS } from '@/lib/api'
import { useState } from 'react'

interface Props {
  data: ChartResponse
}

export default function NakshatraCard({ data }: Props) {
  const moon = data.chart.planets['Moon']
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `My birth star is ${moon.nakshatra} — ${data.meta.name}'s karmic map via Naksha`
    try {
      await navigator.share({ text, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.028)',
        border: '1px solid rgba(201,164,90,0.22)',
        borderRadius: '16px',
        padding: '36px 36px 32px',
        boxShadow: '0 0 60px rgba(201,164,90,0.05), inset 0 0 40px rgba(201,164,90,0.025)',
      }}
    >
      {/* Ambient glow top-right */}
      <div
        className="absolute -top-20 -right-20 pointer-events-none"
        style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,164,90,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Label */}
      <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--gold)', opacity: 0.65 }}>
        Your birth star
      </p>

      {/* Nakshatra name */}
      <div className="mb-2">
        <h3
          className="text-4xl font-serif"
          style={{
            background: 'linear-gradient(135deg, #f0e8d4 0%, #c9a45a 60%, #f0e8d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {moon.nakshatra}
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Moon in {moon.sign} · Pada {moon.pada} · House {moon.house}
        </p>
      </div>

      {/* Divider */}
      <div className="my-6" style={{ height: '1px', background: 'rgba(201,164,90,0.12)' }} />

      {/* AI reading */}
      <p
        className="text-base leading-loose"
        style={{ color: 'rgba(242,235,218,0.78)', lineHeight: '1.95', fontStyle: 'normal' }}
      >
        {data.readings.nakshatra_archetype}
      </p>

      {/* Share */}
      <button
        onClick={share}
        className="mt-8 inline-flex items-center gap-2 text-xs tracking-widest uppercase transition-all"
        style={{
          color: copied ? 'var(--gold)' : 'rgba(242,235,218,0.3)',
          letterSpacing: '0.18em',
        }}
      >
        {copied ? 'Copied ✓' : '↑ Share this card'}
      </button>
    </div>
  )
}

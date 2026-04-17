'use client'
import { ChartResponse } from '@/lib/types'
import { useState } from 'react'

export default function NakshatraCard({ data }: { data: ChartResponse }) {
  const moon = data.chart.planets['Moon']
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `My birth star is ${moon.nakshatra} — discovered on Naksha`
    try { await navigator.share({ text, url: window.location.href }) }
    catch {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="card card--accent">
      <p className="label label--accent" style={{ marginBottom: '24px' }}>Your birth star</p>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h1)',
          fontWeight: 300,
          color: 'var(--clr-text)',
          marginBottom: '8px',
          lineHeight: 1.1,
        }}
      >
        {moon.nakshatra}
      </h3>

      <p className="label" style={{ marginBottom: '32px' }}>
        Moon in {moon.sign} · Pada {moon.pada} · House {moon.house}
      </p>

      <div className="divider" style={{ marginBottom: '32px' }} />

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-body)',
          color: 'var(--clr-text)',
          opacity: 0.82,
          lineHeight: 'var(--leading-loose)',
        }}
      >
        {data.readings.nakshatra_archetype}
      </p>

      <button
        onClick={share}
        style={{
          marginTop: '32px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-label)',
          fontSize: 'var(--text-label)',
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
          color: copied ? 'var(--clr-accent)' : 'var(--clr-text-3)',
          transition: 'color var(--dur-normal)',
        }}
      >
        {copied ? 'Copied ✓' : '↑ Share this card'}
      </button>
    </div>
  )
}

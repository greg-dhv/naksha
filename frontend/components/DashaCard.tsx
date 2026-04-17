'use client'
import { ChartResponse } from '@/lib/types'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#e8c84a', Moon: '#b8d4e8', Mars: '#d86050',
  Mercury: '#70c090', Jupiter: '#e0a030', Venus: '#d890b0',
  Saturn: '#7888a8', Rahu: '#9070b0', Ketu: '#b09060',
}

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })

export default function DashaCard({ data }: { data: ChartResponse }) {
  const maha = data.dasha.current_mahadasha
  const antar = data.dasha.current_antardasha

  const progress = () => {
    if (!maha) return 0
    const s = new Date(maha.start_date).getTime()
    const e = new Date(maha.end_date).getTime()
    return Math.min(100, Math.max(0, ((Date.now() - s) / (e - s)) * 100))
  }

  const pct = progress()
  const color = maha ? (PLANET_COLORS[maha.planet] || 'var(--clr-accent)') : 'var(--clr-accent)'

  return (
    <div className="card">
      <p className="label label--accent" style={{ marginBottom: '24px' }}>Your life season</p>

      {maha ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-h1)',
                  fontWeight: 300,
                  color,
                  lineHeight: 1.1,
                  marginBottom: '6px',
                }}
              >
                {maha.planet}
              </h3>
              <p className="label">Mahadasha</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p className="label" style={{ marginBottom: '4px' }}>{fmt(maha.start_date)}</p>
              <p className="label">{fmt(maha.end_date)}</p>
            </div>
          </div>

          {/* Progress */}
          <div style={{ height: '1px', background: 'var(--clr-border)', position: 'relative', marginBottom: '8px', borderRadius: '1px' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '1px',
              width: `${pct}%`,
              background: `linear-gradient(90deg, transparent, ${color}90, ${color})`,
              borderRadius: '1px',
              transition: 'width 1s var(--ease-out)',
            }} />
          </div>
          <p className="label" style={{ marginBottom: '28px' }}>{Math.round(pct)}% through this chapter</p>

          {/* Antardasha */}
          {antar && (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--clr-border-2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '28px',
            }}>
              <p className="label" style={{ marginBottom: '6px' }}>Active sub-current</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-sm)',
                color: PLANET_COLORS[antar.planet] || 'var(--clr-text)',
              }}>
                {maha.planet} / {antar.planet} · until {fmt(antar.end_date)}
              </p>
            </div>
          )}

          <div className="divider" style={{ marginBottom: '28px' }} />

          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-body)',
            color: 'var(--clr-text)',
            opacity: 0.82,
            lineHeight: 'var(--leading-loose)',
          }}>
            {data.readings.life_season}
          </p>
        </>
      ) : (
        <p className="label">Dasha data unavailable.</p>
      )}
    </div>
  )
}

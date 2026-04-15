'use client'
import { ChartResponse } from '@/lib/types'

const PLANET_QUALITIES: Record<string, string> = {
  Sun: 'Solar · Authority · Soul purpose',
  Moon: 'Lunar · Feeling · Inner life',
  Mars: 'Martial · Drive · Courage',
  Mercury: 'Mercurial · Discernment · Communication',
  Jupiter: 'Expansive · Wisdom · Grace',
  Venus: 'Venusian · Beauty · Devotion',
  Saturn: 'Saturnine · Discipline · Depth',
  Rahu: 'Rahu · Ambition · The unknown frontier',
  Ketu: 'Ketu · Liberation · Completion',
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f5c842',
  Moon: '#d4e8f0',
  Mars: '#e85c4a',
  Mercury: '#7ec8a0',
  Jupiter: '#f0a830',
  Venus: '#e8a0c0',
  Saturn: '#8899bb',
  Rahu: '#a080c0',
  Ketu: '#c0a070',
}

interface Props {
  data: ChartResponse
}

export default function DashaCard({ data }: Props) {
  const maha = data.dasha.current_mahadasha
  const antar = data.dasha.current_antardasha

  const formatDate = (d: string) => {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
  }

  const progress = () => {
    if (!maha) return 0
    const start = new Date(maha.start_date).getTime()
    const end = new Date(maha.end_date).getTime()
    const now = Date.now()
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.028)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '36px 36px 32px',
      }}
    >
      {/* Ambient glow */}
      {maha && (
        <div
          className="absolute -top-16 -left-16 pointer-events-none"
          style={{
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${PLANET_COLORS[maha.planet]}15 0%, transparent 70%)`,
          }}
        />
      )}

      <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--gold)', opacity: 0.65 }}>
        Your life season
      </p>

      {maha ? (
        <>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3
                className="text-4xl font-serif mb-1"
                style={{ color: PLANET_COLORS[maha.planet] || 'var(--cream)' }}
              >
                {maha.planet}
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {PLANET_QUALITIES[maha.planet]}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                {formatDate(maha.start_date)} →
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {formatDate(maha.end_date)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-px mb-2"
            style={{ background: 'rgba(255,255,255,0.06)', position: 'relative', borderRadius: '1px' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '1px',
                width: `${progress()}%`,
                background: `linear-gradient(90deg, transparent, ${PLANET_COLORS[maha.planet] || 'var(--gold)'}80, ${PLANET_COLORS[maha.planet] || 'var(--gold)'})`,
                borderRadius: '1px',
                transition: 'width 1s ease',
              }}
            />
          </div>
          <p className="text-xs mb-6" style={{ color: 'rgba(242,235,218,0.2)' }}>
            {Math.round(progress())}% through this chapter
          </p>

          {/* Antardasha */}
          {antar && (
            <div
              className="mb-6 px-4 py-3 rounded-lg"
              style={{
                background: `${PLANET_COLORS[antar.planet] || 'rgba(255,255,255,0.03)'}10`,
                border: `1px solid ${PLANET_COLORS[antar.planet] || 'rgba(255,255,255,0.07)'}30`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'rgba(242,235,218,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Active sub-current
              </p>
              <p className="text-sm" style={{ color: PLANET_COLORS[antar.planet] || 'var(--cream)' }}>
                {maha.planet} / {antar.planet} · until {formatDate(antar.end_date)}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="my-6" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          {/* AI reading */}
          <p
            className="text-base leading-loose"
            style={{ color: 'rgba(242,235,218,0.78)', lineHeight: '1.95' }}
          >
            {data.readings.life_season}
          </p>
        </>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Dasha data unavailable.</p>
      )}
    </div>
  )
}

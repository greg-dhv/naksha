'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LuminousField from '@/components/LuminousField'
import BirthChartWheel from '@/components/BirthChartWheel'
import NakshatraCard from '@/components/NakshatraCard'
import DashaCard from '@/components/DashaCard'
import BlurredSection from '@/components/BlurredSection'
import SubscribeModal from '@/components/SubscribeModal'
import { ChartResponse, PlanetInfo } from '@/lib/types'
import { PLANET_ORDER, PLANET_SYMBOLS, PLANET_COLORS, SIGN_SYMBOLS } from '@/lib/api'

export default function ChartPage() {
  const router = useRouter()
  const [data, setData] = useState<ChartResponse | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContext, setModalContext] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naksha_chart')
    if (!stored) {
      router.replace('/onboarding')
      return
    }
    try {
      setData(JSON.parse(stored))
      setTimeout(() => setVisible(true), 100)
    } catch {
      router.replace('/onboarding')
    }
  }, [router])

  if (!data) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <LuminousField />
        <div className="relative z-10 text-center">
          <p className="text-sm tracking-widest uppercase" style={{ color: 'rgba(242,235,218,0.3)', letterSpacing: '0.2em' }}>
            Opening your map…
          </p>
        </div>
      </main>
    )
  }

  const { chart, dasha, meta } = data

  const openModal = (context: string) => {
    setModalContext(context)
    setModalOpen(true)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })

  return (
    <main className="relative min-h-screen bg-void">
      <LuminousField intensity={0.55} />

      <div
        className="relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-10">
          {/* Eyebrow */}
          <p className="text-xs tracking-widest uppercase mb-6 text-center" style={{ color: 'var(--gold)', opacity: 0.65 }}>
            Your karmic map
          </p>

          {/* Name */}
          <h1
            className="text-4xl sm:text-5xl font-serif text-center mb-2"
            style={{
              background: 'linear-gradient(160deg, #f0e8d4 0%, #c9a45a 50%, #f0e8d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {meta.name}
          </h1>

          {/* Birth info */}
          <p className="text-sm text-center mb-12" style={{ color: 'var(--muted)' }}>
            {formatDate(meta.birth_date)}
            {meta.birth_time !== '12:00' && ` · ${meta.birth_time}`}
            {meta.location_name && ` · ${meta.location_name}`}
          </p>

          {/* Chart + Planet table */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 justify-center">
            {/* Chart wheel */}
            <div className="flex-shrink-0">
              <BirthChartWheel chart={chart} />
            </div>

            {/* Planet table */}
            <div className="flex-1 max-w-md w-full">
              {/* Lagna */}
              <div
                className="mb-4 px-4 py-3 rounded-lg"
                style={{
                  background: 'rgba(201,164,90,0.07)',
                  border: '1px solid rgba(201,164,90,0.2)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--gold)', opacity: 0.7 }}>
                      Lagna · Rising
                    </p>
                    <p className="text-lg font-serif" style={{ color: 'var(--cream)' }}>
                      {SIGN_SYMBOLS[chart.lagna.sign]} {chart.lagna.sign}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {chart.lagna.nakshatra} · Pada {chart.lagna.pada}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(242,235,218,0.25)' }}>
                      {chart.lagna.degree.toFixed(1)}° in sign
                    </p>
                  </div>
                </div>
              </div>

              {/* Planet rows */}
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {PLANET_ORDER.map((name, i) => {
                  const p: PlanetInfo | undefined = chart.planets[name]
                  if (!p) return null
                  const color = PLANET_COLORS[name] || 'var(--cream)'
                  return (
                    <div
                      key={name}
                      className="flex items-center px-4 py-3 gap-3"
                      style={{
                        borderBottom: i < PLANET_ORDER.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                      }}
                    >
                      {/* Symbol */}
                      <span className="text-base w-6 text-center flex-shrink-0" style={{ color }}>
                        {PLANET_SYMBOLS[name]}
                      </span>

                      {/* Name */}
                      <span className="text-sm w-20 flex-shrink-0" style={{ color: 'rgba(242,235,218,0.7)' }}>
                        {name}
                        {p.is_retrograde && (
                          <span className="ml-1 text-xs" style={{ color: 'rgba(242,235,218,0.28)' }}>R</span>
                        )}
                      </span>

                      {/* Sign */}
                      <span className="text-sm flex-1" style={{ color: 'var(--cream)' }}>
                        {SIGN_SYMBOLS[p.sign]} {p.sign}
                      </span>

                      {/* House */}
                      <span className="text-xs w-8 text-center flex-shrink-0" style={{ color: 'var(--muted)' }}>
                        H{p.house}
                      </span>

                      {/* Nakshatra */}
                      <span className="text-xs text-right hidden sm:block" style={{ color: 'rgba(242,235,218,0.3)', minWidth: '120px' }}>
                        {p.nakshatra} P{p.pada}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div className="max-w-5xl mx-auto px-6">
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,164,90,0.15), transparent)' }} />
        </div>

        {/* ── FREE READINGS ── */}
        <section className="max-w-3xl mx-auto px-6 py-14 space-y-8">
          <NakshatraCard data={data} />
          <DashaCard data={data} />
        </section>

        {/* ── DIVIDER ── */}
        <div className="max-w-5xl mx-auto px-6">
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
        </div>

        {/* ── TIER 1 BLURRED SECTIONS ── */}
        <section className="max-w-3xl mx-auto px-6 py-14 space-y-6">
          <p className="text-xs tracking-widest uppercase text-center mb-8" style={{ color: 'rgba(242,235,218,0.2)', letterSpacing: '0.2em' }}>
            More of your map
          </p>

          {/* Depth cards */}
          <BlurredSection
            title="12 Depth Readings"
            description="Shadow Pattern, Love Karma, Career Blueprint, Dharma, Hidden Power, Past Life Imprint, and more — each a 500-word reading from inside your chart."
            tier={1}
            tierLabel="The Map · €11.99/mo"
            price="€11.99/mo"
            onUnlock={() => openModal('depth readings')}
            preview={
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-6"
                style={{
                  background: 'rgba(255,255,255,0.028)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                }}
              >
                {['Shadow Pattern', 'Love Karma', 'Career Blueprint', 'Dharma', 'Hidden Power', 'Past Life Imprint'].map(t => (
                  <div
                    key={t}
                    className="px-3 py-4 rounded-lg text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <p className="text-xs" style={{ color: 'rgba(242,235,218,0.5)' }}>{t}</p>
                  </div>
                ))}
              </div>
            }
          />

          {/* Recurring readings */}
          <BlurredSection
            title="Your Weekly Rhythm"
            description="Monday briefings, new moon monthly readings, and transit alerts when the sky speaks directly to your chart. Not daily noise — meaningful signal."
            tier={1}
            tierLabel="The Map · €11.99/mo"
            price="€11.99/mo"
            onUnlock={() => openModal('weekly rhythm')}
            preview={
              <div
                className="p-6 space-y-4"
                style={{
                  background: 'rgba(255,255,255,0.028)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'rgba(201,164,90,0.15)', border: '1px solid rgba(201,164,90,0.25)' }} />
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgba(201,164,90,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monday · Weekly briefing</p>
                    <p className="text-sm" style={{ color: 'rgba(242,235,218,0.6)' }}>
                      Jupiter moves into your 5th house this week, activating the quiet creative force that's been gathering. Something you've been turning over in your mind is ready to surface…
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'rgba(100,150,220,0.15)', border: '1px solid rgba(100,150,220,0.25)' }} />
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgba(100,150,220,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Moon · Monthly reading</p>
                    <p className="text-sm" style={{ color: 'rgba(242,235,218,0.6)' }}>
                      This month's new moon falls in your 11th house, the house of future visions and collective belonging…
                    </p>
                  </div>
                </div>
              </div>
            }
          />
        </section>

        {/* ── DIVIDER ── */}
        <div className="max-w-5xl mx-auto px-6">
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
        </div>

        {/* ── TIER 2 BLURRED: CHAT ── */}
        <section className="max-w-3xl mx-auto px-6 py-14">
          <BlurredSection
            title="Your Chart-Aware Guide"
            description="An AI guide that has studied your complete chart. Ask anything about your life, decisions, relationships, or direction — and receive answers from inside your karmic map."
            tier={2}
            tierLabel="The Guide · €29.99/mo"
            price="€29.99/mo"
            onUnlock={() => openModal('your chart guide')}
            preview={
              <div
                className="p-6 space-y-4"
                style={{
                  background: 'rgba(255,255,255,0.028)',
                  border: '1px solid rgba(160,128,192,0.15)',
                  borderRadius: '16px',
                }}
              >
                <div className="flex justify-end">
                  <div
                    className="max-w-xs px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(242,235,218,0.7)' }}
                  >
                    Why do I keep attracting the same kind of relationship?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div
                    className="max-w-sm px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
                    style={{ background: 'rgba(160,128,192,0.08)', border: '1px solid rgba(160,128,192,0.15)', color: 'rgba(242,235,218,0.7)', lineHeight: '1.7' }}
                  >
                    Venus in your 7th house with Rahu creates a deep hunger for connection — but Rahu always wants more than what it has. The pattern isn't about the people you're attracting…
                  </div>
                </div>
              </div>
            }
          />
        </section>

        {/* ── DASHA TIMELINE ── */}
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div
            className="p-8"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
            }}
          >
            <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'rgba(242,235,218,0.3)', letterSpacing: '0.2em' }}>
              Your life chapters
            </p>
            <div className="space-y-2">
              {dasha.all_mahadashas.slice(0, 8).map((m, i) => {
                const isNow = dasha.current_mahadasha?.planet === m.planet &&
                              dasha.current_mahadasha?.start_date === m.start_date
                const isPast = new Date(m.end_date) < new Date()
                const color = isNow ? 'var(--gold)' : isPast ? 'rgba(242,235,218,0.2)' : 'rgba(242,235,218,0.4)'
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isNow ? 'var(--gold)' : 'rgba(255,255,255,0.15)' }}
                    />
                    <span
                      className="text-sm w-24"
                      style={{
                        color,
                        fontWeight: isNow ? 500 : 400,
                      }}
                    >
                      {m.planet}
                    </span>
                    <span className="text-xs flex-1" style={{ color: 'rgba(242,235,218,0.2)' }}>
                      {formatDate(m.start_date)} – {formatDate(m.end_date)}
                    </span>
                    {isNow && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(201,164,90,0.12)',
                          border: '1px solid rgba(201,164,90,0.25)',
                          color: 'var(--gold)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        now
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="max-w-xl mx-auto px-6 pb-24 text-center">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(242,235,218,0.2)', letterSpacing: '0.2em' }}>
            Naksha
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)', lineHeight: '1.8' }}>
            Your karmic map is here. The depth is waiting.
          </p>
          <button
            onClick={() => openModal('')}
            className="inline-flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase transition-all"
            style={{
              color: 'var(--cream)',
              border: '1px solid rgba(201,164,90,0.35)',
              borderRadius: '2px',
              letterSpacing: '0.22em',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(201,164,90,0.7)'
              el.style.boxShadow = '0 0 30px rgba(201,164,90,0.12)'
              el.style.background = 'rgba(201,164,90,0.05)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(201,164,90,0.35)'
              el.style.boxShadow = 'none'
              el.style.background = 'transparent'
            }}
          >
            Unlock the full map
            <span style={{ opacity: 0.6 }}>→</span>
          </button>

          <div className="mt-8">
            <button
              onClick={() => router.push('/onboarding')}
              className="text-xs"
              style={{ color: 'rgba(242,235,218,0.2)', letterSpacing: '0.1em' }}
            >
              Read a different chart →
            </button>
          </div>
        </section>
      </div>

      {/* Subscribe modal */}
      <SubscribeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        unlockedBy={modalContext}
      />
    </main>
  )
}

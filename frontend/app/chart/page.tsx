'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BirthChartWheel from '@/components/BirthChartWheel'
import { ChartResponse, PlanetInfo, StandoutItem, SoulTheme } from '@/lib/types'
import { PLANET_SYMBOLS, PLANET_COLORS, SIGN_SYMBOLS } from '@/lib/api'
import { getNakshatraSrc, getYogaMeta } from '@/lib/illustrations'
import { useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const fmtDeg = (d: number) =>
  `${Math.floor(d)}°${String(Math.round((d % 1) * 60)).padStart(2, '0')}'`

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

const SIGN_LORD: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

const SECTION_ACCENT = {
  core:  '#5B8CFF',
  gifts: '#7ec8a0',
  path:  '#a0c4e8',
  love:  '#e8a0c0',
}

// Cycling colors for standout item accents
const STANDOUT_COLORS = ['#d4b896', '#7ec8a0', '#a0c4e8', '#c0a0d8', '#e8a0c0']

// ── Main ──────────────────────────────────────────────────────────────────────

type ChartSubTab = 'reading' | 'chart'

export default function ChartPage() {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()
  const [data, setData] = useState<ChartResponse | null>(null)
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naksha_chart')
    if (!stored) { router.replace('/onboarding'); return }
    try { setData(JSON.parse(stored)); setTimeout(() => setVisible(true), 100) }
    catch { router.replace('/onboarding') }
  }, [router])

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--nk-ground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-text-2)' }}>
        Opening your map…
      </p>
    </div>
  )

  function handleGoDeeper(from?: string) {
    if (user) { router.push(from ? `/go-deeper?from=${from}` : '/go-deeper') } else { openAuthModal() }
  }

  function handleBonds() {
    if (user) { router.push('/bonds') } else { openAuthModal() }
  }

  return (
    <AppShell>
      <div className={visible ? 'page-visible' : 'page-enter'}>
        <MyChartView
          data={data}
          expandedPlanet={expandedPlanet}
          onExpandPlanet={setExpandedPlanet}
          onGoDeeper={handleGoDeeper}
          onBonds={handleBonds}
        />
      </div>
    </AppShell>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────

function MyChartView({ data, expandedPlanet, onExpandPlanet, onGoDeeper, onBonds }: {
  data: ChartResponse
  expandedPlanet: string | null
  onExpandPlanet: (p: string | null) => void
  onGoDeeper: (from?: string) => void
  onBonds: () => void
}) {
  const [subTab, setSubTab] = useState<ChartSubTab>('reading')
  const { user, openAuthModal } = useAuth()

  return (
    <div>
      {/* Pill segmented control */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--nk-surface)',
          border: '1px solid var(--nk-border)',
          borderRadius: 'var(--nk-r-pill)',
          padding: '3px',
          gap: '2px',
        }}>
          {([
            { id: 'reading' as ChartSubTab, label: 'Reading' },
            { id: 'chart'   as ChartSubTab, label: 'Chart' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
              padding: '6px 20px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: subTab === tab.id ? 'rgba(91,140,255,0.15)' : 'transparent',
              color: subTab === tab.id ? '#5B8CFF' : 'var(--nk-text-3)',
              transition: 'all var(--dur-fast)',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        {subTab === 'reading' && <ReadingView data={data} onGoDeeper={onGoDeeper} onBonds={onBonds} />}
        {subTab === 'chart'   && <div style={{ padding: '28px 20px 80px' }}><ChartDetailView data={data} expandedPlanet={expandedPlanet} onExpandPlanet={onExpandPlanet} user={user} onSave={openAuthModal} /></div>}
      </div>
    </div>
  )
}

// ── Reading View ──────────────────────────────────────────────────────────────

function ReadingView({ data, onGoDeeper, onBonds }: {
  data: ChartResponse
  onGoDeeper: (from?: string) => void
  onBonds: () => void
}) {
  const { readings } = data
  const hasContent = readings.core || readings.natural_powers || readings.growth_path || readings.soul_history || readings.love

  if (!hasContent) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', color: 'var(--nk-text-2)', lineHeight: 1.7, marginBottom: '8px' }}>
        Your full reading is not available yet.
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)' }}>
        Re-enter your birth data to generate the complete reading.
      </p>
    </div>
  )

  return (
    <div>
      <CoreSection data={data} onGoDeeper={onGoDeeper} />
      <NaturalGiftsSection data={data} onGoDeeper={onGoDeeper} />
      <PathSection data={data} onGoDeeper={onGoDeeper} />
      <LoveSection data={data} onBonds={onBonds} />
    </div>
  )
}

// ── 01 · Your Core Self ───────────────────────────────────────────────────────

function CoreSection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: (from?: string) => void }) {
  const { readings, chart, dasha } = data
  const core  = readings.core
  const moon  = chart.planets['Moon']
  const lagna = chart.lagna

  return (
    <Section number="01" title="Your Core Self" accent={SECTION_ACCENT.core}
      intro="The foundation of who you are — your nature, your presence, and the world you carry within."
      illustration="/illustrations/01-core-self.svg">

      {/* Who are you */}
      {core?.who_are_you && (
        <ReadingCard
          question="Who are you at your essence?"
          answer={core.who_are_you}
          accent={SECTION_ACCENT.core}
          chips={[
            lagna.sign && `${lagna.sign} Rising`,
            moon && `Moon · ${moon.sign} H${moon.house}`,
            moon && `Moon · ${moon.nakshatra}`,
          ].filter(Boolean) as string[]}
        />
      )}

      {/* What stands out — grid */}
      {core?.what_stands_out && core.what_stands_out.length > 0 && (
        <StandoutGrid items={core.what_stands_out} onGoDeeper={onGoDeeper} />
      )}

      {/* Presence & inner world — merged */}
      {core?.presence_and_inner_world && (
        <ReadingCard
          question="How you come across vs. your inner world"
          answer={core.presence_and_inner_world}
          accent={SECTION_ACCENT.core}
          chips={[
            `Lagna · ${lagna.sign}`,
            moon && `Moon · ${moon.nakshatra}`,
          ].filter(Boolean) as string[]}
        />
      )}
    </Section>
  )
}

// ── Standout Grid ─────────────────────────────────────────────────────────────

function StandoutGrid({ items, onGoDeeper }: { items: StandoutItem[]; onGoDeeper: (from?: string) => void }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--nk-border)',
      borderRadius: 'var(--nk-r-lg)',
      padding: '20px',
    }}>
      <p style={{
        fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: SECTION_ACCENT.core, marginBottom: '16px',
      }}>
        What stands out in your chart?
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {items.map((item, i) => {
          const color = STANDOUT_COLORS[i % STANDOUT_COLORS.length]
          return (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderTop: `2px solid ${color}30`,
              borderRadius: 'var(--nk-r-md)',
              padding: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: color, flexShrink: 0, marginTop: '5px',
                  boxShadow: `0 0 6px ${color}60`,
                }} />
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '15px', fontWeight: 500, color: 'var(--nk-text)', lineHeight: 1.3,
                }}>
                  {item.headline}
                </p>
              </div>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '11px',
                color: 'var(--nk-text-2)', lineHeight: 1.65, marginBottom: '10px',
              }}>
                {item.body}
              </p>
              {item.tag && (
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.05em',
                  padding: '2px 8px', borderRadius: '20px',
                  background: `${color}12`, border: `1px solid ${color}30`, color,
                }}>
                  {item.tag}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Go deeper CTA */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        marginTop: '14px', paddingTop: '12px',
        borderTop: '1px solid var(--nk-border)',
      }}>
        <button onClick={() => onGoDeeper('chart-stands-out')} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: SECTION_ACCENT.core,
          transition: 'opacity var(--dur-fast)',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Go deeper <span style={{ fontSize: '12px' }}>→</span>
        </button>
      </div>
    </div>
  )
}

// ── 02 · Your Natural Gifts ───────────────────────────────────────────────────

function NaturalGiftsSection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: (from?: string) => void }) {
  const { readings, chart } = data
  const powers  = readings.natural_powers
  const moon    = chart.planets['Moon']
  const jupiter = chart.planets['Jupiter']

  return (
    <Section number="02" title="Your Natural Gifts" accent={SECTION_ACCENT.gifts}
      intro="The strengths and archetypes you were born carrying — how your gifts naturally express in the world."
      illustration="/illustrations/02-natural-gifts.svg">

      {/* Gifts summary */}
      {powers?.gifts && (
        <ReadingCard
          question="Your strengths at a glance"
          answer={powers.gifts}
          accent={SECTION_ACCENT.gifts}
          chips={[
            jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`,
            moon && `Moon · ${moon.nakshatra}`,
            chart.yogas?.[0]?.name,
          ].filter(Boolean) as string[]}
        />
      )}

      {/* Archetypes */}
      {powers?.archetypes && powers.archetypes.length > 0 && (
        <div>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: SECTION_ACCENT.gifts, marginBottom: '10px',
          }}>
            Your archetypes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {powers.archetypes.map((arch, i) => (
              <div key={i} style={{
                background: 'rgba(126,200,160,0.06)',
                border: '1px solid rgba(126,200,160,0.15)',
                borderRadius: 'var(--nk-r-md)', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: arch.strength_labels?.length ? '12px' : 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '22px', color: SECTION_ACCENT.gifts, opacity: 0.6,
                    lineHeight: 1, flexShrink: 0, marginTop: '2px',
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '17px', fontWeight: 500, color: 'var(--nk-text)', marginBottom: '4px',
                    }}>
                      {arch.name}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '12px',
                      color: 'var(--nk-text-2)', lineHeight: 1.65,
                    }}>
                      {arch.description}
                    </p>
                  </div>
                </div>

                {/* Strength labels */}
                {arch.strength_labels && arch.strength_labels.length > 0 && (
                  <div style={{
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(126,200,160,0.12)',
                    display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: 'var(--nk-text-3)', marginRight: '2px',
                    }}>
                      Strengths
                    </span>
                    {arch.strength_labels.map((label, j) => (
                      <span key={j} style={{
                        fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.06em',
                        padding: '3px 10px', borderRadius: '20px',
                        background: 'rgba(126,200,160,0.10)', border: '1px solid rgba(126,200,160,0.25)',
                        color: SECTION_ACCENT.gifts,
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

// ── 03 · Your Path ────────────────────────────────────────────────────────────

function PathSection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: (from?: string) => void }) {
  const { readings, chart, dasha } = data
  const growth  = readings.growth_path
  const soul    = readings.soul_history
  const rahu    = chart.planets['Rahu']
  const ketu    = chart.planets['Ketu']
  const saturn  = chart.planets['Saturn']
  const jupiter = chart.planets['Jupiter']

  return (
    <Section number="03" title="Your Path" accent={SECTION_ACCENT.path}
      intro="Your purpose, your soul's depth, what you are here to build, and what asks to be released."
      illustration="/illustrations/03-your-path.svg">

      {/* Dharma */}
      {growth?.dharma && (
        <ReadingCard
          question="Your soul's purpose"
          answer={growth.dharma}
          accent={SECTION_ACCENT.path}
          chips={[
            rahu && `Rahu · ${rahu.sign} H${rahu.house}`,
            jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`,
            dasha.current_mahadasha && `${dasha.current_mahadasha.planet} Mahadasha`,
          ].filter(Boolean) as string[]}
          cta
          onGoDeeper={() => onGoDeeper('chart-soul')}
        />
      )}

      {/* Soul themes — bucketed */}
      {soul?.soul_themes && soul.soul_themes.length > 0 && (
        <SoulThemesGrid themes={soul.soul_themes} />
      )}

      {/* What to create */}
      {growth?.what_to_create && (
        <ReadingCard
          question="What you are here to build or create"
          answer={growth.what_to_create}
          accent={SECTION_ACCENT.path}
          chips={[
            saturn && `Saturn · ${saturn.sign} H${saturn.house}`,
            rahu && `Rahu · ${rahu.nakshatra}`,
          ].filter(Boolean) as string[]}
        />
      )}

      {/* Growth blocks */}
      {growth?.growth_blocks && (
        <ReadingCard
          question="What blocks your growth"
          answer={growth.growth_blocks}
          accent={SECTION_ACCENT.path}
          chips={[
            saturn && `Saturn · ${saturn.sign} H${saturn.house}`,
            ketu && `Ketu · ${ketu.sign} H${ketu.house}`,
          ].filter(Boolean) as string[]}
        />
      )}
    </Section>
  )
}

// ── Soul Themes Grid ──────────────────────────────────────────────────────────

// Subtle colors for past life labels
const PAST_LIFE_LABEL_COLORS = [
  { bg: 'rgba(192,160,216,0.12)', border: 'rgba(192,160,216,0.25)', text: '#c0a0d8' },
  { bg: 'rgba(160,196,232,0.12)', border: 'rgba(160,196,232,0.25)', text: '#a0c4e8' },
  { bg: 'rgba(212,184,150,0.10)', border: 'rgba(212,184,150,0.22)', text: '#d4b896' },
]

function SoulThemesGrid({ themes }: { themes: SoulTheme[] }) {
  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: SECTION_ACCENT.path, marginBottom: '10px',
      }}>
        What your soul already knows
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {themes.map((t, i) => (
          <div key={i} style={{
            background: 'rgba(160,196,232,0.06)',
            border: '1px solid rgba(160,196,232,0.15)',
            borderRadius: 'var(--nk-r-md)', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: t.past_life_labels?.length ? '12px' : 0 }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '22px', color: SECTION_ACCENT.path, opacity: 0.6,
                lineHeight: 1, flexShrink: 0, marginTop: '2px',
              }}>
                {i + 1}
              </span>
              <div>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '17px', fontWeight: 500, color: 'var(--nk-text)', marginBottom: '4px',
                }}>
                  {t.theme}
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '12px',
                  color: 'var(--nk-text-2)', lineHeight: 1.65,
                }}>
                  {t.description}
                </p>
              </div>
            </div>

            {/* Past life labels */}
            {t.past_life_labels && t.past_life_labels.length > 0 && (
              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid rgba(160,196,232,0.12)',
                display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--nk-text-3)', marginRight: '2px',
                }}>
                  Past life echoes
                </span>
                {t.past_life_labels.map((label, j) => {
                  const c = PAST_LIFE_LABEL_COLORS[j % PAST_LIFE_LABEL_COLORS.length]
                  return (
                    <span key={j} style={{
                      fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.06em',
                      padding: '3px 10px', borderRadius: '20px',
                      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                    }}>
                      {label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 04 · Love & Relationships ─────────────────────────────────────────────────

function LoveSection({ data, onBonds }: { data: ChartResponse; onBonds: () => void }) {
  const { readings, chart } = data
  const love   = readings.love
  const venus  = chart.planets['Venus']
  const moon   = chart.planets['Moon']
  const mars   = chart.planets['Mars']

  if (!love) return null

  return (
    <Section number="04" title="Love & Relationships" accent={SECTION_ACCENT.love}
      intro="How you love, what you need, and what kind of connection brings out the best in you."
      illustration="/illustrations/04-love-relationships.svg">

      {/* Love style */}
      {love.love_style && (
        <ReadingCard
          question="How you love and attach"
          answer={love.love_style}
          accent={SECTION_ACCENT.love}
          chips={[
            venus && `Venus · ${venus.sign} H${venus.house}`,
            moon && `Moon · ${moon.nakshatra}`,
          ].filter(Boolean) as string[]}
        />
      )}

      {/* Relationship needs */}
      {love.relationship_needs && (
        <ReadingCard
          question="What you need in relationships"
          answer={love.relationship_needs}
          accent={SECTION_ACCENT.love}
          chips={[
            mars && `Mars · ${mars.sign} H${mars.house}`,
            venus && `Venus · ${venus.nakshatra}`,
          ].filter(Boolean) as string[]}
        />
      )}

      {/* Bonds CTA */}
      <div style={{
        background: 'rgba(232,160,192,0.07)',
        border: '1px solid rgba(232,160,192,0.2)',
        borderRadius: 'var(--nk-r-lg)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '17px', color: 'var(--nk-text)', marginBottom: '4px',
          }}>
            Curious about a connection?
          </p>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '11px',
            color: 'var(--nk-text-3)', lineHeight: 1.5,
          }}>
            See how two charts speak to each other.
          </p>
        </div>
        <button onClick={onBonds} style={{
          flexShrink: 0,
          padding: '10px 20px',
          background: 'rgba(232,160,192,0.12)',
          border: '1px solid rgba(232,160,192,0.35)',
          borderRadius: '8px',
          color: SECTION_ACCENT.love,
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all var(--dur-fast)',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,160,192,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,160,192,0.12)' }}
        >
          See your compatibility →
        </button>
      </div>
    </Section>
  )
}

// ── Chart Detail ──────────────────────────────────────────────────────────────

function ChartDetailView({ data, expandedPlanet, onExpandPlanet, user, onSave }: {
  data: ChartResponse; expandedPlanet: string | null; onExpandPlanet: (p: string | null) => void
  user: ReturnType<typeof useAuth>['user']; onSave: () => void
}) {
  const { chart, meta } = data

  return (
    <div>
      {/* Identity */}
      <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--nk-border)' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 400, color: 'var(--nk-text)', lineHeight: 1.1, marginBottom: '6px' }}>
          {meta.name}
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)', lineHeight: 1.6 }}>
          {fmtDate(meta.birth_date)}{meta.birth_time !== '12:00' && ` · ${meta.birth_time}`}{meta.location_name && ` · ${meta.location_name}`}
        </p>
        {!user && (
          <button
            onClick={onSave}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(212,184,150,0.1)',
              border: '1px solid rgba(212,184,150,0.3)',
              borderRadius: '8px',
              color: 'var(--nk-gold)',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Save your chart →
          </button>
        )}
      </div>

      {/* Wheel */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <BirthChartWheel chart={chart} />
        </div>
      </div>

      {/* Chart meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', background: 'var(--nk-surface)', border: '1px solid var(--nk-border)', borderRadius: 'var(--nk-r-md)', padding: '16px 18px', marginBottom: '28px', boxShadow: 'var(--nk-shadow-sm)' }}>
        <MetaRow label="Rising sign"  value={`${SIGN_SYMBOLS[chart.lagna.sign] || ''} ${chart.lagna.sign}`} />
        <MetaRow label="Birth star"   value={`${chart.lagna.nakshatra} p${chart.lagna.pada}`} />
        {(() => {
          const lordName = SIGN_LORD[chart.lagna.sign]
          const lord = lordName ? chart.planets[lordName] : undefined
          if (!lordName) return null
          const lordVal = lord ? `${lordName} · ${lord.sign} H${lord.house}` : lordName
          return <MetaRow label="Lagna lord" value={lordVal} />
        })()}
        {chart.panchanga && <MetaRow label="Tithi" value={chart.panchanga.tithi} />}
        {chart.panchanga && <MetaRow label="Vara"  value={chart.panchanga.vara} />}
        <MetaRow label="Ayanamsa"     value="Lahiri" />
        <MetaRow label="House system" value="Whole sign" />
      </div>

      {/* Yogas */}
      {chart.yogas?.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-primary)', marginBottom: '10px' }}>
            Active yogas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {chart.yogas.map((yoga, i) => {
              const ym = getYogaMeta(yoga.name)
              return (
                <div key={i} style={{ background: `rgba(${ym?.color === '#D4B896' ? '212,184,150' : ym?.color === '#B99CDF' ? '185,156,223' : '91,140,255'},0.08)`, border: `1px solid ${ym?.color ? ym.color + '33' : 'var(--nk-primary-line)'}`, borderRadius: 'var(--nk-r-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {ym && (
                    <img src={ym.src} alt="" aria-hidden="true" style={{ width: '32px', height: '32px', flexShrink: 0, opacity: 0.85 }} />
                  )}
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: ym?.color || 'var(--nk-primary)', marginBottom: '2px' }}>{yoga.name}</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-3)' }}>{yoga.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Planets */}
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-primary)', marginBottom: '12px' }}>
        The nine grahas
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {PLANET_ORDER.map(name => {
          const p: PlanetInfo | undefined = chart.planets[name]
          if (!p) return null
          const isExpanded = expandedPlanet === name
          const color   = PLANET_COLORS[name] || 'rgba(255,255,255,0.7)'
          const reading = data.readings.planet_readings?.[name]
          return (
            <button key={name} onClick={() => onExpandPlanet(isExpanded ? null : name)} style={{
              textAlign: 'left', cursor: 'pointer',
              background: isExpanded ? 'var(--nk-primary-dim)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isExpanded ? 'var(--nk-primary-line)' : 'var(--nk-border)'}`,
              borderRadius: 'var(--nk-r-md)', padding: '14px',
              transition: 'all var(--dur-fast)',
              gridColumn: isExpanded ? 'span 2' : 'span 1',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '14px', color, filter: `drop-shadow(0 0 4px ${color}50)` }}>{PLANET_SYMBOLS[name] || name[0]}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--nk-text)' }}>{name}</span>
                </div>
                <DignityBadge dignity={p.dignity} />
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-2)', lineHeight: 1.5 }}>
                {fmtDeg(p.degree)} {p.sign} · H{p.house}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {getNakshatraSrc(p.nakshatra) && (
                  <img src={getNakshatraSrc(p.nakshatra)!} alt="" aria-hidden="true" style={{ width: '14px', height: '14px', opacity: 0.6, flexShrink: 0 }} />
                )}
                {p.nakshatra} p{p.pada}{p.is_retrograde ? ' · ℞' : ''}{p.combust ? ' · combust' : ''}
              </p>
              {isExpanded && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--nk-border)' }}>
                  {reading
                    ? <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', color: 'var(--nk-text)', lineHeight: 1.7 }}>{reading}</p>
                    : <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)' }}>Regenerate your chart to see this reading.</p>
                  }
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared Components ─────────────────────────────────────────────────────────

function Section({ number, title, accent, intro, illustration, children }: {
  number: string; title: string; accent: string; intro: string; illustration?: string; children: React.ReactNode
}) {
  return (
    <div style={{ padding: '36px 20px 40px', borderBottom: '1px solid var(--nk-border)' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: '6px' }}>
        {number}
      </p>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 400, color: 'var(--nk-text)', lineHeight: 1.1, marginBottom: '8px' }}>
        {title}
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-text-3)', lineHeight: 1.65, marginBottom: illustration ? '24px' : '22px' }}>
        {intro}
      </p>
      {illustration && (
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <img src={illustration} alt="" aria-hidden="true" style={{ width: '100%', maxWidth: '320px', height: 'auto', opacity: 0.9 }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  )
}

function ReadingCard({ question, answer, accent, chips, cta, onGoDeeper }: {
  question: string
  answer?: string
  accent: string
  chips: string[]
  cta?: boolean
  onGoDeeper?: (from?: string) => void
}) {
  // First sentence bold as summary, rest as body
  let headline = answer ?? ''
  let body = ''
  if (answer) {
    const m = answer.match(/^(.+?[.!?])\s+(.+)$/s)
    if (m && m[1].length < 200) { headline = m[1]; body = m[2] }
  }

  return (
    <div style={{
      background: 'var(--nk-surface)',
      border: '1px solid var(--nk-border)',
      borderRadius: 'var(--nk-r-lg)',
      padding: '20px',
      boxShadow: 'var(--nk-shadow-sm)',
    }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: '12px' }}>
        {question}
      </p>

      {answer ? (
        <>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '19px', fontWeight: 400, color: 'var(--nk-text)', lineHeight: 1.65, marginBottom: body ? '10px' : 0 }}>
            {headline}
          </p>
          {body && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', color: 'var(--nk-text-2)', lineHeight: 1.75 }}>
              {body}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)', lineHeight: 1.6 }}>
          Regenerate your chart to see this reading.
        </p>
      )}

      {(chips.length > 0 || cta) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--nk-border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {chips.map((chip, i) => {
              const parts = chip.split(' · ')
              // Type 1 — Nakshatra: last segment after · is a nakshatra name
              const nakshatraSrc = getNakshatraSrc(parts[parts.length - 1])
              // Type 2 — Yoga: full chip text matches a yoga
              const yogaMeta = getYogaMeta(chip)
              // Type 3 — Placement: extract planet symbol from first word
              const planetSymbol = PLANET_SYMBOLS[parts[0].split(' ')[0]]

              if (nakshatraSrc) {
                return (
                  <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.05em', padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--nk-text-3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <img src={nakshatraSrc} alt="" aria-hidden="true" style={{ width: '11px', height: '11px', opacity: 0.55, flexShrink: 0 }} />
                    {chip}
                  </span>
                )
              }

              if (yogaMeta) {
                return (
                  <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.05em', padding: '3px 9px', borderRadius: '20px', background: `${yogaMeta.color}12`, border: `1px solid ${yogaMeta.color}30`, color: yogaMeta.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <img src={yogaMeta.src} alt="" aria-hidden="true" style={{ width: '11px', height: '11px', opacity: 0.8, flexShrink: 0 }} />
                    {chip}
                  </span>
                )
              }

              // Placement chip
              return (
                <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.05em', padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--nk-text-3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {planetSymbol && <span style={{ fontSize: '11px', opacity: 0.6 }}>{planetSymbol}</span>}
                  {chip}
                </span>
              )
            })}
          </div>
          {cta && onGoDeeper && (
            <button onClick={() => onGoDeeper()} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.14em',
              textTransform: 'uppercase', color: accent,
              transition: 'opacity var(--dur-fast)',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Go deeper <span style={{ fontSize: '12px' }}>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nk-text-3)', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--nk-text)' }}>{value}</p>
    </div>
  )
}

function DignityBadge({ dignity }: { dignity?: string }) {
  if (!dignity || dignity === 'neutral') return null
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    exalted:      { bg: 'rgba(120,200,150,0.10)', border: 'rgba(120,200,150,0.20)', text: '#7ec896' },
    debilitated:  { bg: 'rgba(220,100,90,0.10)',  border: 'rgba(220,100,90,0.20)',  text: '#dc6460' },
    own:          { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.48)' },
    moolatrikona: { bg: 'rgba(240,168,48,0.10)',  border: 'rgba(240,168,48,0.20)',  text: '#f0a830' },
  }
  const c = colors[dignity]; if (!c) return null
  return (
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '20px', background: c.bg, border: `1px solid ${c.border}`, color: c.text, flexShrink: 0 }}>
      {dignity}
    </span>
  )
}

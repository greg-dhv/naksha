'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BirthChartWheel from '@/components/BirthChartWheel'
import { ChartResponse, PlanetInfo } from '@/lib/types'
import { PLANET_SYMBOLS, PLANET_COLORS, SIGN_SYMBOLS } from '@/lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const fmtDeg = (d: number) =>
  `${Math.floor(d)}°${String(Math.round((d % 1) * 60)).padStart(2, '0')}'`

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

// Section accent colours
const SECTION_ACCENT = {
  core:    'rgba(212,184,150,0.85)',
  powers:  '#7ec8a0',
  growth:  '#a0c4e8',
  soul:    '#c0a0d8',
  energy:  '#e8a0c0',
}

const FORCE_COLORS = {
  Shiva:  '#8899bb',
  Shakti: '#e8a0c0',
  Vishnu: '#f0a830',
}

// ── Nav config ────────────────────────────────────────────────────────────────

type Tab = 'home' | 'chart' | 'archetypes' | 'dharma'
type ChartSubTab = 'reading' | 'chart'

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home',       label: 'Home',       icon: '⌂' },
  { id: 'chart',      label: 'My chart',   icon: '◎' },
  { id: 'archetypes', label: 'Archetypes', icon: '✦' },
  { id: 'dharma',     label: 'Dharma',     icon: '◈' },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChartPage() {
  const router = useRouter()
  const [data, setData] = useState<ChartResponse | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('chart')
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naksha_chart')
    if (!stored) { router.replace('/onboarding'); return }
    try { setData(JSON.parse(stored)); setTimeout(() => setVisible(true), 100) }
    catch { router.replace('/onboarding') }
  }, [router])

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-text-2)' }}>
        Opening your map…
      </p>
    </div>
  )

  const { meta } = data

  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="app-sidebar">
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--clr-border)', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
              ✦
            </div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
              Naksha
            </span>
          </div>
        </div>

        <nav style={{ padding: '4px 10px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', marginBottom: '2px',
                transition: 'background var(--dur-fast)',
              }}
            >
              <span style={{ fontSize: '14px', opacity: activeTab === item.id ? 1 : 0.4, width: '18px', textAlign: 'center', color: 'var(--clr-text)' }}>
                {item.icon}
              </span>
              <span style={{
                fontFamily: 'var(--font-label)', fontSize: '13px', letterSpacing: '0.05em',
                color: activeTab === item.id ? 'var(--clr-text)' : 'var(--clr-text-2)',
                fontWeight: activeTab === item.id ? 600 : 400,
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--clr-border)' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--clr-text-3)' }}>
            {meta.name}
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '3px', border: 'none', background: 'none',
              cursor: 'pointer', padding: '8px 0',
            }}
          >
            <span style={{ fontSize: '16px', opacity: activeTab === item.id ? 1 : 0.35, color: 'var(--clr-text)' }}>
              {item.icon}
            </span>
            <span style={{
              fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activeTab === item.id ? 'var(--clr-text)' : 'var(--clr-text-3)',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Content ──────────────────────────────────────── */}
      <div className={`app-content ${visible ? 'page-visible' : 'page-enter'}`}>
        {activeTab === 'chart' && (
          <MyChartView
            data={data}
            expandedPlanet={expandedPlanet}
            onExpandPlanet={setExpandedPlanet}
          />
        )}
        {activeTab === 'home'       && <PlaceholderView label="Home"       icon="⌂" />}
        {activeTab === 'archetypes' && <PlaceholderView label="Archetypes" icon="✦" />}
        {activeTab === 'dharma'     && <PlaceholderView label="Dharma"     icon="◈" />}
      </div>
    </div>
  )
}

// ── Placeholder ───────────────────────────────────────────────────────────────

function PlaceholderView({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <span style={{ fontSize: '28px', opacity: 0.25 }}>{icon}</span>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>
        {label} — coming soon
      </p>
    </div>
  )
}

// ── My Chart Container ────────────────────────────────────────────────────────

function MyChartView({ data, expandedPlanet, onExpandPlanet }: {
  data: ChartResponse
  expandedPlanet: string | null
  onExpandPlanet: (p: string | null) => void
}) {
  const [subTab, setSubTab] = useState<ChartSubTab>('reading')
  const { meta } = data

  return (
    <div>
      {/* Page header */}
      <div style={{ padding: '28px 20px 0' }}>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: '5px' }}>
          Your karmic map
        </p>
        <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 400, color: 'var(--clr-text)', lineHeight: 1.1, marginBottom: '6px' }}>
          {meta.name}
        </h1>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)', lineHeight: 1.6 }}>
          {fmtDate(meta.birth_date)}
          {meta.birth_time !== '12:00' && ` · ${meta.birth_time}`}
          {meta.location_name && ` · ${meta.location_name}`}
        </p>
      </div>

      {/* Sub-tab bar */}
      <div style={{
        display: 'flex', padding: '20px 20px 0',
        borderBottom: '1px solid var(--clr-border)',
      }}>
        {([
          { id: 'reading' as const, label: 'My Reading' },
          { id: 'chart'   as const, label: 'My Chart' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              flexShrink: 0, padding: '8px 16px', marginBottom: '-1px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${subTab === tab.id ? 'rgba(255,255,255,0.65)' : 'transparent'}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: '0.08em',
              color: subTab === tab.id ? 'var(--clr-text)' : 'var(--clr-text-3)',
              transition: 'color var(--dur-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'reading' && <ReadingView data={data} />}
      {subTab === 'chart'   && (
        <div style={{ padding: '28px 20px 80px' }}>
          <ChartDetailView data={data} expandedPlanet={expandedPlanet} onExpandPlanet={onExpandPlanet} />
        </div>
      )}
    </div>
  )
}

// ── Reading View ──────────────────────────────────────────────────────────────

function ReadingView({ data }: { data: ChartResponse }) {
  const { readings } = data

  if (!readings.core && !readings.natural_powers && !readings.growth_path && !readings.soul_history && !readings.energy) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '18px', color: 'var(--clr-text-2)', lineHeight: 1.7, marginBottom: '8px' }}>
          Your full reading isn't available yet.
        </p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)' }}>
          Re-enter your birth data to generate the complete reading.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <CoreSection data={data} />
      <NaturalPowersSection data={data} />
      <GrowthPathSection data={data} />
      <SoulHistorySection data={data} />
      <EnergySection data={data} />
    </div>
  )
}

// ── 01 · Your Core ────────────────────────────────────────────────────────────

function CoreSection({ data }: { data: ChartResponse }) {
  const { readings, chart, dasha } = data
  const core = readings.core
  const moon = chart.planets['Moon']
  const sun  = chart.planets['Sun']
  const mars = chart.planets['Mars']
  const lagna = chart.lagna

  const exalted = Object.entries(chart.planets).find(([_, p]) => p.dignity === 'exalted')
  const yoga = chart.yogas?.[0]

  return (
    <ReadingSection number="01" title="Your Core" accent={SECTION_ACCENT.core}
      intro="The foundation of who you are — your nature, presence, and inner engine.">
      <QuestionCard
        question="Who are you?"
        answer={core?.who_are_you}
        accent={SECTION_ACCENT.core}
        chips={[
          lagna.sign && `${lagna.sign} Rising`,
          moon && `Moon · ${moon.sign} H${moon.house}`,
          moon && moon.nakshatra,
        ].filter(Boolean) as string[]}
      />
      <QuestionCard
        question="What stands out in your chart?"
        answer={core?.what_stands_out}
        accent={SECTION_ACCENT.core}
        chips={[
          exalted && `${exalted[0]} exalted · ${exalted[1].sign}`,
          yoga && yoga.name,
          dasha.current_mahadasha && `${dasha.current_mahadasha.planet} Mahadasha`,
        ].filter(Boolean) as string[]}
      />
      <QuestionCard
        question="How do you come across?"
        answer={core?.how_you_come_across}
        accent={SECTION_ACCENT.core}
        chips={[
          `Lagna · ${lagna.sign}`,
          `${lagna.nakshatra} P${lagna.pada}`,
        ]}
      />
      <QuestionCard
        question="How is your inner world?"
        answer={core?.inner_world}
        accent={SECTION_ACCENT.core}
        chips={[
          moon && `Moon · ${moon.sign}`,
          moon && `H${moon.house}`,
          moon && moon.nakshatra,
        ].filter(Boolean) as string[]}
      />
      <QuestionCard
        question="What drives you?"
        answer={core?.what_drives_you}
        accent={SECTION_ACCENT.core}
        chips={[
          sun  && `Sun · ${sun.sign} H${sun.house}`,
          mars && `Mars · ${mars.sign} H${mars.house}`,
        ].filter(Boolean) as string[]}
      />
    </ReadingSection>
  )
}

// ── 02 · Your Natural Powers ──────────────────────────────────────────────────

function NaturalPowersSection({ data }: { data: ChartResponse }) {
  const { readings, chart } = data
  const powers = readings.natural_powers
  const moon    = chart.planets['Moon']
  const jupiter = chart.planets['Jupiter']

  return (
    <ReadingSection number="02" title="Your Natural Powers" accent={SECTION_ACCENT.powers}
      intro="The gifts you were born with — what comes naturally, who you are at your most alive.">
      <QuestionCard
        question="What are your gifts?"
        answer={powers?.gifts}
        accent={SECTION_ACCENT.powers}
        chips={[
          jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`,
          moon && moon.nakshatra,
          chart.yogas?.[0] && chart.yogas[0].name,
        ].filter(Boolean) as string[]}
      />

      {/* Archetypes */}
      {powers?.archetypes && powers.archetypes.length > 0 && (
        <div>
          <p style={{
            fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: SECTION_ACCENT.powers,
            marginBottom: '12px',
          }}>
            What are your main archetypes?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {powers.archetypes.map((arch, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--clr-border)',
                borderLeft: `3px solid ${SECTION_ACCENT.powers}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
                  fontSize: '17px', fontWeight: 500,
                  color: 'var(--clr-text)', marginBottom: '5px',
                }}>
                  {arch.name}
                </p>
                <p style={{
                  fontFamily: 'var(--font-label)', fontSize: '12px',
                  color: 'var(--clr-text-2)', lineHeight: 1.65,
                }}>
                  {arch.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReadingSection>
  )
}

// ── 03 · Your Growth Path ─────────────────────────────────────────────────────

function GrowthPathSection({ data }: { data: ChartResponse }) {
  const { readings, chart, dasha } = data
  const growth  = readings.growth_path
  const rahu    = chart.planets['Rahu']
  const saturn  = chart.planets['Saturn']
  const jupiter = chart.planets['Jupiter']

  return (
    <ReadingSection number="03" title="Your Growth Path" accent={SECTION_ACCENT.growth}
      intro="What life is asking of you — the lessons, the purpose, the inner unfolding.">
      <QuestionCard
        question="What is life teaching you?"
        answer={growth?.life_teaching}
        accent={SECTION_ACCENT.growth}
        chips={[
          saturn  && `Saturn · ${saturn.sign} H${saturn.house}`,
          dasha.current_mahadasha && `${dasha.current_mahadasha.planet} Mahadasha`,
        ].filter(Boolean) as string[]}
      />
      <QuestionCard
        question="What is your dharma?"
        answer={growth?.dharma}
        accent={SECTION_ACCENT.growth}
        chips={[
          rahu    && `Rahu · ${rahu.sign} H${rahu.house}`,
          jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`,
        ].filter(Boolean) as string[]}
      />
      <QuestionCard
        question="What is your spiritual path?"
        answer={growth?.spiritual_path}
        accent={SECTION_ACCENT.growth}
        chips={[
          jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`,
          'H12',
        ].filter(Boolean) as string[]}
      />
    </ReadingSection>
  )
}

// ── 04 · Soul History ─────────────────────────────────────────────────────────

function SoulHistorySection({ data }: { data: ChartResponse }) {
  const { readings, chart } = data
  const soul   = readings.soul_history
  const ketu   = chart.planets['Ketu']
  const moon   = chart.planets['Moon']
  const saturn = chart.planets['Saturn']

  return (
    <ReadingSection number="04" title="Soul History" accent={SECTION_ACCENT.soul}
      intro="What the soul may already carry — the depths that arrived with you.">
      <QuestionCard
        question="What does your soul already know?"
        answer={soul?.soul_knows}
        accent={SECTION_ACCENT.soul}
        chips={[
          ketu && `Ketu · ${ketu.sign} H${ketu.house}`,
          ketu && ketu.nakshatra,
        ].filter(Boolean) as string[]}
      />
      <QuestionCard
        question="What were potential past life themes?"
        answer={soul?.past_life_themes}
        accent={SECTION_ACCENT.soul}
        chips={[
          ketu   && `Ketu · ${ketu.sign}`,
          moon   && `Moon · ${moon.sign}`,
          saturn && `Saturn · ${saturn.sign}`,
        ].filter(Boolean) as string[]}
      />
    </ReadingSection>
  )
}

// ── 05 · Your Energy ─────────────────────────────────────────────────────────

function EnergySection({ data }: { data: ChartResponse }) {
  const { readings } = data
  const energy = readings.energy

  if (!energy) {
    return (
      <ReadingSection number="05" title="Your Energy" accent={SECTION_ACCENT.energy}
        intro="The cosmic forces at work in you — Shiva, Shakti, and Vishnu.">
        <EmptyCard accent={SECTION_ACCENT.energy} />
      </ReadingSection>
    )
  }

  const forces: { key: 'Shiva' | 'Shakti' | 'Vishnu'; score: number; explanation: string }[] = [
    { key: 'Shiva',  score: energy.shiva_score,  explanation: energy.shiva_explanation },
    { key: 'Shakti', score: energy.shakti_score, explanation: energy.shakti_explanation },
    { key: 'Vishnu', score: energy.vishnu_score, explanation: energy.vishnu_explanation },
  ]

  return (
    <ReadingSection number="05" title="Your Energy" accent={SECTION_ACCENT.energy}
      intro="The three cosmic forces in your chart — their balance reveals your deepest nature.">

      {/* Force meters card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <p style={{
            fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: SECTION_ACCENT.energy,
          }}>
            What force is strongest in you?
          </p>
          <span style={{
            fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.12em',
            textTransform: 'uppercase', padding: '3px 10px',
            borderRadius: '20px',
            background: `${FORCE_COLORS[energy.dominant_force as keyof typeof FORCE_COLORS] || 'rgba(255,255,255,0.1)'}22`,
            border: `1px solid ${FORCE_COLORS[energy.dominant_force as keyof typeof FORCE_COLORS] || 'rgba(255,255,255,0.2)'}44`,
            color: FORCE_COLORS[energy.dominant_force as keyof typeof FORCE_COLORS] || 'var(--clr-text)',
          }}>
            {energy.dominant_force}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {forces.map(({ key, score, explanation }) => (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: FORCE_COLORS[key],
                    boxShadow: `0 0 8px ${FORCE_COLORS[key]}80`,
                  }} />
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text)' }}>
                    {key}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '13px', color: FORCE_COLORS[key], fontWeight: 600 }}>
                  {score}%
                </span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '8px' }}>
                <div style={{
                  width: `${score}%`, height: '100%',
                  background: `linear-gradient(90deg, ${FORCE_COLORS[key]}99, ${FORCE_COLORS[key]})`,
                  borderRadius: '2px',
                  transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              {explanation && (
                <p style={{
                  fontFamily: 'var(--font-label)', fontSize: '11px',
                  color: 'var(--clr-text-3)', lineHeight: 1.65,
                }}>
                  {explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <QuestionCard
        question="What are you here to cultivate more?"
        answer={energy.cultivate}
        accent={SECTION_ACCENT.energy}
        chips={[]}
      />
      <QuestionCard
        question="What practices are recommended for you?"
        answer={energy.practices}
        accent={SECTION_ACCENT.energy}
        chips={[]}
      />
    </ReadingSection>
  )
}

// ── Chart Detail (illustration + planets) ─────────────────────────────────────

function ChartDetailView({ data, expandedPlanet, onExpandPlanet }: {
  data: ChartResponse
  expandedPlanet: string | null
  onExpandPlanet: (p: string | null) => void
}) {
  const { chart } = data

  return (
    <div>
      {/* Wheel */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <BirthChartWheel chart={chart} />
        </div>
      </div>

      {/* Chart meta */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px 24px', background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)',
        padding: '16px 18px', marginBottom: '32px',
      }}>
        <MetaRow label="Rising sign"  value={`${SIGN_SYMBOLS[chart.lagna.sign] || ''} ${chart.lagna.sign}`} />
        <MetaRow label="Birth star"   value={chart.lagna.nakshatra} />
        {chart.panchanga && <MetaRow label="Tithi" value={chart.panchanga.tithi} />}
        {chart.panchanga && <MetaRow label="Vara"  value={chart.panchanga.vara}  />}
        <MetaRow label="Ayanamsa"     value="Lahiri" />
        <MetaRow label="House system" value="Whole sign" />
      </div>

      {/* Yogas */}
      {chart.yogas && chart.yogas.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-accent)', opacity: 0.85, marginBottom: '10px' }}>
            Active yogas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {chart.yogas.map((yoga, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
              }}>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', fontWeight: 600, color: 'var(--clr-text)', marginBottom: '2px' }}>
                  {yoga.name}
                </p>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', color: 'var(--clr-text-3)' }}>
                  {yoga.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planets */}
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-accent)', opacity: 0.85, marginBottom: '4px' }}>
        The nine grahas
      </p>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.6, marginBottom: '16px' }}>
        Tap any planet to read its placement.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {PLANET_ORDER.map(name => {
          const p: PlanetInfo | undefined = chart.planets[name]
          if (!p) return null
          const isExpanded = expandedPlanet === name
          const color = PLANET_COLORS[name] || 'rgba(255,255,255,0.7)'
          const reading = data.readings.planet_readings?.[name]

          return (
            <button
              key={name}
              onClick={() => onExpandPlanet(isExpanded ? null : name)}
              style={{
                textAlign: 'left', cursor: 'pointer',
                background: isExpanded ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.2)' : 'var(--clr-border)'}`,
                borderRadius: 'var(--radius-md)', padding: '14px',
                transition: 'all var(--dur-fast)',
                gridColumn: isExpanded ? 'span 2' : 'span 1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '15px', color, filter: `drop-shadow(0 0 5px ${color}50)` }}>
                    {PLANET_SYMBOLS[name] || name[0]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: '0.06em', color: 'var(--clr-text)', fontWeight: 600 }}>
                    {name}
                  </span>
                </div>
                <DignityBadge dignity={p.dignity} />
              </div>

              <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
                {fmtDeg(p.degree)} {p.sign} · H{p.house}
              </p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', color: 'var(--clr-text-3)', marginTop: '2px' }}>
                {p.nakshatra} p{p.pada}{p.is_retrograde ? ' · ℞' : ''}{p.combust ? ' · combust' : ''}
              </p>

              {isExpanded && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--clr-border)' }}>
                  {reading ? (
                    <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.75 }}>
                      {reading}
                    </p>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                      No reading available — regenerate your chart.
                    </p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared reading components ─────────────────────────────────────────────────

function ReadingSection({ number, title, accent, intro, children }: {
  number: string
  title: string
  accent: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      padding: '36px 20px 40px',
      borderBottom: '1px solid var(--clr-border)',
    }}>
      <p style={{
        fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em',
        textTransform: 'uppercase', color: accent, marginBottom: '6px',
      }}>
        {number}
      </p>
      <h2 style={{
        fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
        fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 400,
        color: 'var(--clr-text)', lineHeight: 1.1, marginBottom: '8px',
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: 'var(--font-label)', fontSize: '12px',
        color: 'var(--clr-text-3)', lineHeight: 1.65, marginBottom: '24px',
      }}>
        {intro}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  )
}

function QuestionCard({ question, answer, accent, chips }: {
  question: string
  answer?: string
  accent: string
  chips: string[]
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--clr-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 20px',
    }}>
      <p style={{
        fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: accent, marginBottom: '12px',
      }}>
        {question}
      </p>

      {answer ? (
        <p style={{
          fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
          fontSize: 'clamp(15px, 2.8vw, 17px)',
          color: 'rgba(255,255,255,0.82)',
          lineHeight: 1.85,
        }}>
          {answer}
        </p>
      ) : (
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)', lineHeight: 1.6 }}>
          Regenerate your chart to see this reading.
        </p>
      )}

      {chips.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px',
          marginTop: '16px', paddingTop: '14px',
          borderTop: '1px solid var(--clr-border)',
        }}>
          {chips.map((chip, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.06em',
              padding: '3px 9px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.11)',
              color: 'var(--clr-text-3)',
            }}>
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyCard({ accent }: { accent: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--clr-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px 20px',
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)' }}>
        Regenerate your chart to unlock this reading.
      </p>
    </div>
  )
}

// ── Shared utility components ─────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: '2px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '13px', color: 'var(--clr-text)' }}>
        {value}
      </p>
    </div>
  )
}

function DignityBadge({ dignity }: { dignity?: string }) {
  if (!dignity || dignity === 'neutral') return null
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    exalted:      { bg: 'rgba(120,200,150,0.12)', border: 'rgba(120,200,150,0.22)', text: '#7ec896' },
    debilitated:  { bg: 'rgba(220,100,90,0.12)',  border: 'rgba(220,100,90,0.22)',  text: '#dc6460' },
    own:          { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.13)', text: 'rgba(255,255,255,0.50)' },
    moolatrikona: { bg: 'rgba(240,168,48,0.10)',  border: 'rgba(240,168,48,0.20)',  text: '#f0a830' },
  }
  const c = colors[dignity]
  if (!c) return null
  return (
    <span style={{
      fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.1em',
      textTransform: 'uppercase', padding: '2px 7px', borderRadius: '20px',
      background: c.bg, border: `1px solid ${c.border}`, color: c.text, flexShrink: 0,
    }}>
      {dignity}
    </span>
  )
}

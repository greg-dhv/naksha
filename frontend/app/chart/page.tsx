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

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

const SECTION_ACCENT = {
  core:   '#d4b896',
  powers: '#7ec8a0',
  growth: '#a0c4e8',
  soul:   '#c0a0d8',
  energy: '#e8a0c0',
}

const FORCE_COLORS = {
  Shiva:  '#8899bb',
  Shakti: '#e8a0c0',
  Vishnu: '#f0a830',
}

// ── Nav ───────────────────────────────────────────────────────────────────────

type Tab = 'home' | 'chart' | 'deeper' | 'bonds'
type ChartSubTab = 'reading' | 'chart'

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChartPage() {
  const router = useRouter()
  const [data, setData]     = useState<ChartResponse | null>(null)
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
  const goDeeper = () => setActiveTab('deeper')

  // ── Sidebar nav item renderer ──
  const SidebarItem = ({ id, label, icon }: { id: Tab; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', borderRadius: 'var(--radius-md)',
        background: activeTab === id ? 'rgba(255,255,255,0.09)' : 'transparent',
        border: 'none', cursor: 'pointer', marginBottom: '2px',
        transition: 'background var(--dur-fast)',
      }}
    >
      <span style={{ fontSize: '14px', opacity: activeTab === id ? 1 : 0.4, width: '18px', textAlign: 'center', color: 'var(--clr-text)' }}>
        {icon}
      </span>
      <span style={{
        fontFamily: 'var(--font-label)', fontSize: '13px', letterSpacing: '0.04em',
        color: activeTab === id ? 'var(--clr-text)' : 'var(--clr-text-2)',
        fontWeight: activeTab === id ? 600 : 400,
      }}>
        {label}
      </span>
    </button>
  )

  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="app-sidebar">
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--clr-border)', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(212,184,150,0.12)', border: '1px solid rgba(212,184,150,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'rgba(212,184,150,0.8)' }}>
              ✦
            </div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--clr-text)' }}>
              Naksha
            </span>
          </div>
        </div>

        <nav style={{ padding: '4px 10px', flex: 1 }}>
          <SidebarItem id="home"  label="Home"     icon="⌂" />
          <SidebarItem id="chart" label="My Chart" icon="◎" />

          {/* Explore section */}
          <div style={{ padding: '16px 12px 6px', marginTop: '8px' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>
              Explore
            </p>
          </div>
          <SidebarItem id="deeper" label="Go Deeper" icon="▾" />
          <SidebarItem id="bonds"  label="Bonds"     icon="◯" />
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--clr-border)' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--clr-text-3)' }}>
            {meta.name}
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="bottom-nav">
        {([
          { id: 'home'  as Tab, label: 'Home',     icon: '⌂' },
          { id: 'chart' as Tab, label: 'My Chart', icon: '◎' },
          { id: 'deeper' as Tab, label: 'Go Deeper', icon: '▾' },
          { id: 'bonds' as Tab, label: 'Bonds',    icon: '◯' },
        ]).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', border: 'none', background: 'none', cursor: 'pointer', padding: '8px 0' }}
          >
            <span style={{ fontSize: '15px', opacity: activeTab === item.id ? 1 : 0.35, color: 'var(--clr-text)' }}>{item.icon}</span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: activeTab === item.id ? 'var(--clr-text)' : 'var(--clr-text-3)' }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Content ──────────────────────────────────────── */}
      <div className={`app-content ${visible ? 'page-visible' : 'page-enter'}`}>
        {activeTab === 'chart' && (
          <MyChartView data={data} expandedPlanet={expandedPlanet} onExpandPlanet={setExpandedPlanet} onGoDeeper={goDeeper} />
        )}
        {activeTab === 'home'   && <PlaceholderView label="Home"     icon="⌂" />}
        {activeTab === 'deeper' && <PlaceholderView label="Go Deeper" icon="▾" />}
        {activeTab === 'bonds'  && <PlaceholderView label="Bonds"    icon="◯" />}
      </div>
    </div>
  )
}

// ── Placeholder ───────────────────────────────────────────────────────────────

function PlaceholderView({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <span style={{ fontSize: '26px', opacity: 0.2 }}>{icon}</span>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>
        {label} — coming soon
      </p>
    </div>
  )
}

// ── My Chart Container ────────────────────────────────────────────────────────

function MyChartView({ data, expandedPlanet, onExpandPlanet, onGoDeeper }: {
  data: ChartResponse
  expandedPlanet: string | null
  onExpandPlanet: (p: string | null) => void
  onGoDeeper: () => void
}) {
  const [subTab, setSubTab] = useState<ChartSubTab>('reading')
  const { meta } = data

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '28px 20px 0' }}>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: '5px' }}>
          Your karmic map
        </p>
        <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 400, color: 'var(--clr-text)', lineHeight: 1.1, marginBottom: '6px' }}>
          {meta.name}
        </h1>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)', lineHeight: 1.6 }}>
          {fmtDate(meta.birth_date)}{meta.birth_time !== '12:00' && ` · ${meta.birth_time}`}{meta.location_name && ` · ${meta.location_name}`}
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', padding: '20px 20px 0', borderBottom: '1px solid var(--clr-border)' }}>
        {([
          { id: 'reading' as ChartSubTab, label: 'My Reading' },
          { id: 'chart'   as ChartSubTab, label: 'My Chart' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
            flexShrink: 0, padding: '8px 16px', marginBottom: '-1px',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${subTab === tab.id ? 'rgba(255,255,255,0.6)' : 'transparent'}`,
            cursor: 'pointer',
            fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: '0.08em',
            color: subTab === tab.id ? 'var(--clr-text)' : 'var(--clr-text-3)',
            transition: 'color var(--dur-fast)',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'reading' && <ReadingView data={data} onGoDeeper={onGoDeeper} />}
      {subTab === 'chart'   && <div style={{ padding: '28px 20px 80px' }}><ChartDetailView data={data} expandedPlanet={expandedPlanet} onExpandPlanet={onExpandPlanet} /></div>}
    </div>
  )
}

// ── Reading View ──────────────────────────────────────────────────────────────

function ReadingView({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: () => void }) {
  const { readings } = data
  const hasContent = readings.core || readings.natural_powers || readings.growth_path || readings.soul_history || readings.energy

  if (!hasContent) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '18px', color: 'var(--clr-text-2)', lineHeight: 1.7, marginBottom: '8px' }}>
        Your full reading isn't available yet.
      </p>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)' }}>
        Re-enter your birth data to generate the complete reading.
      </p>
    </div>
  )

  return (
    <div>
      <CoreSection data={data} onGoDeeper={onGoDeeper} />
      <NaturalPowersSection data={data} onGoDeeper={onGoDeeper} />
      <GrowthPathSection data={data} onGoDeeper={onGoDeeper} />
      <SoulHistorySection data={data} onGoDeeper={onGoDeeper} />
      <EnergySection data={data} onGoDeeper={onGoDeeper} />
    </div>
  )
}

// ── 01 · Your Core ────────────────────────────────────────────────────────────

function CoreSection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: () => void }) {
  const { readings, chart, dasha } = data
  const core  = readings.core
  const moon  = chart.planets['Moon']
  const sun   = chart.planets['Sun']
  const mars  = chart.planets['Mars']
  const lagna = chart.lagna
  const exalted = Object.entries(chart.planets).find(([_, p]) => p.dignity === 'exalted')
  const yoga = chart.yogas?.[0]

  return (
    <Section number="01" title="Your Core" accent={SECTION_ACCENT.core}
      intro="The foundation of who you are — your nature, presence, and inner engine.">
      <ReadingCard question="Who are you?" answer={core?.who_are_you} accent={SECTION_ACCENT.core}
        chips={[lagna.sign && `${lagna.sign} Rising`, moon && `Moon · ${moon.sign} H${moon.house}`, moon?.nakshatra].filter(Boolean) as string[]} />
      <ReadingCard question="What stands out in your chart?" answer={core?.what_stands_out} accent={SECTION_ACCENT.core}
        cta onGoDeeper={onGoDeeper}
        chips={[exalted && `${exalted[0]} exalted`, yoga?.name, dasha.current_mahadasha && `${dasha.current_mahadasha.planet} Dasha`].filter(Boolean) as string[]} />
      <ReadingCard question="How do you come across?" answer={core?.how_you_come_across} accent={SECTION_ACCENT.core}
        chips={[`Lagna · ${lagna.sign}`, `${lagna.nakshatra} P${lagna.pada}`]} />
      <ReadingCard question="How is your inner world?" answer={core?.inner_world} accent={SECTION_ACCENT.core}
        chips={[moon && `Moon · ${moon.sign} H${moon.house}`, moon?.nakshatra].filter(Boolean) as string[]} />
      <ReadingCard question="What drives you?" answer={core?.what_drives_you} accent={SECTION_ACCENT.core}
        chips={[sun && `Sun · ${sun.sign} H${sun.house}`, mars && `Mars · ${mars.sign} H${mars.house}`].filter(Boolean) as string[]} />
    </Section>
  )
}

// ── 02 · Your Natural Powers ──────────────────────────────────────────────────

function NaturalPowersSection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: () => void }) {
  const { readings, chart } = data
  const powers  = readings.natural_powers
  const moon    = chart.planets['Moon']
  const jupiter = chart.planets['Jupiter']

  return (
    <Section number="02" title="Your Natural Powers" accent={SECTION_ACCENT.powers}
      intro="The gifts you were born with — what comes naturally, who you are at your most alive.">
      <ReadingCard question="What are your gifts?" answer={powers?.gifts} accent={SECTION_ACCENT.powers}
        cta onGoDeeper={onGoDeeper}
        chips={[jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`, moon?.nakshatra, chart.yogas?.[0]?.name].filter(Boolean) as string[]} />

      {powers?.archetypes && powers.archetypes.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: SECTION_ACCENT.powers, marginBottom: '12px' }}>
            What are your main archetypes?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {powers.archetypes.map((arch, i) => (
              <div key={i} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                background: 'rgba(126,200,160,0.06)',
                border: '1px solid rgba(126,200,160,0.15)',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
              }}>
                <span style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '22px', color: SECTION_ACCENT.powers, opacity: 0.6, lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>
                  {i + 1}
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '17px', fontWeight: 500, color: 'var(--clr-text)', marginBottom: '4px' }}>
                    {arch.name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.65 }}>
                    {arch.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

// ── 03 · Your Growth Path ─────────────────────────────────────────────────────

function GrowthPathSection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: () => void }) {
  const { readings, chart, dasha } = data
  const growth  = readings.growth_path
  const rahu    = chart.planets['Rahu']
  const saturn  = chart.planets['Saturn']
  const jupiter = chart.planets['Jupiter']

  return (
    <Section number="03" title="Your Growth Path" accent={SECTION_ACCENT.growth}
      intro="What life is asking of you — the lessons, the purpose, the inner unfolding.">
      <ReadingCard question="What is life teaching you?" answer={growth?.life_teaching} accent={SECTION_ACCENT.growth}
        chips={[saturn && `Saturn · ${saturn.sign} H${saturn.house}`, dasha.current_mahadasha && `${dasha.current_mahadasha.planet} Mahadasha`].filter(Boolean) as string[]} />
      <ReadingCard question="What is your dharma?" answer={growth?.dharma} accent={SECTION_ACCENT.growth}
        cta onGoDeeper={onGoDeeper}
        chips={[rahu && `Rahu · ${rahu.sign} H${rahu.house}`, jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`].filter(Boolean) as string[]} />
      <ReadingCard question="What is your spiritual path?" answer={growth?.spiritual_path} accent={SECTION_ACCENT.growth}
        chips={[jupiter && `Jupiter · ${jupiter.sign} H${jupiter.house}`, 'H12'].filter(Boolean) as string[]} />
    </Section>
  )
}

// ── 04 · Soul History ─────────────────────────────────────────────────────────

function SoulHistorySection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: () => void }) {
  const { readings, chart } = data
  const soul   = readings.soul_history
  const ketu   = chart.planets['Ketu']
  const moon   = chart.planets['Moon']
  const saturn = chart.planets['Saturn']

  return (
    <Section number="04" title="Soul History" accent={SECTION_ACCENT.soul}
      intro="What the soul may already carry — the depths that arrived with you.">
      <ReadingCard question="What does your soul already know?" answer={soul?.soul_knows} accent={SECTION_ACCENT.soul}
        chips={[ketu && `Ketu · ${ketu.sign} H${ketu.house}`, ketu?.nakshatra].filter(Boolean) as string[]} />
      <ReadingCard question="What were potential past life themes?" answer={soul?.past_life_themes} accent={SECTION_ACCENT.soul}
        cta onGoDeeper={onGoDeeper}
        chips={[ketu && `Ketu · ${ketu.sign}`, moon && `Moon · ${moon.sign}`, saturn && `Saturn · ${saturn.sign}`].filter(Boolean) as string[]} />
    </Section>
  )
}

// ── 05 · Your Energy ─────────────────────────────────────────────────────────

function EnergySection({ data, onGoDeeper }: { data: ChartResponse; onGoDeeper: () => void }) {
  const { readings } = data
  const energy = readings.energy

  if (!energy) return (
    <Section number="05" title="Your Energy" accent={SECTION_ACCENT.energy}
      intro="The cosmic forces at work in you — Shiva, Shakti, and Vishnu.">
      <div style={{ padding: '28px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border)' }}>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)' }}>Regenerate your chart to unlock this reading.</p>
      </div>
    </Section>
  )

  const forces: { key: 'Shiva' | 'Shakti' | 'Vishnu'; score: number; explanation: string }[] = [
    { key: 'Shiva',  score: energy.shiva_score,  explanation: energy.shiva_explanation },
    { key: 'Shakti', score: energy.shakti_score, explanation: energy.shakti_explanation },
    { key: 'Vishnu', score: energy.vishnu_score, explanation: energy.vishnu_explanation },
  ]
  const dominant = forces.reduce((a, b) => a.score > b.score ? a : b)

  return (
    <Section number="05" title="Your Energy" accent={SECTION_ACCENT.energy}
      intro="The three cosmic forces in your chart — their balance reveals your deepest nature.">

      {/* Dominant force + bars */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: '22px', marginBottom: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: SECTION_ACCENT.energy }}>
            What force is strongest in you?
          </p>
          <span style={{
            fontFamily: 'var(--font-label)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '20px',
            background: `${FORCE_COLORS[dominant.key]}18`,
            border: `1px solid ${FORCE_COLORS[dominant.key]}40`,
            color: FORCE_COLORS[dominant.key],
          }}>
            {dominant.key}
          </span>
        </div>

        {/* Force bars */}
        {forces.map(({ key, score, explanation }) => (
          <div key={key} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: FORCE_COLORS[key], boxShadow: `0 0 8px ${FORCE_COLORS[key]}70` }} />
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text)' }}>{key}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: '13px', fontWeight: 600, color: FORCE_COLORS[key] }}>{score}%</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${FORCE_COLORS[key]}80, ${FORCE_COLORS[key]})`, borderRadius: '2px' }} />
            </div>
            {explanation && (
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)', lineHeight: 1.65 }}>{explanation}</p>
            )}
          </div>
        ))}
      </div>

      <ReadingCard question="What are you here to cultivate more?" answer={energy.cultivate} accent={SECTION_ACCENT.energy} chips={[]} />
      <ReadingCard question="What practices are recommended for you?" answer={energy.practices} accent={SECTION_ACCENT.energy}
        cta onGoDeeper={onGoDeeper} chips={[]} />
    </Section>
  )
}

// ── Chart Detail ──────────────────────────────────────────────────────────────

function ChartDetailView({ data, expandedPlanet, onExpandPlanet }: {
  data: ChartResponse; expandedPlanet: string | null; onExpandPlanet: (p: string | null) => void
}) {
  const { chart } = data

  return (
    <div>
      {/* Wheel */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <BirthChartWheel chart={chart} />
        </div>
      </div>

      {/* Chart meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: '28px' }}>
        <MetaRow label="Rising sign"  value={`${SIGN_SYMBOLS[chart.lagna.sign] || ''} ${chart.lagna.sign}`} />
        <MetaRow label="Birth star"   value={chart.lagna.nakshatra} />
        {chart.panchanga && <MetaRow label="Tithi" value={chart.panchanga.tithi} />}
        {chart.panchanga && <MetaRow label="Vara"  value={chart.panchanga.vara} />}
        <MetaRow label="Ayanamsa"     value="Lahiri" />
        <MetaRow label="House system" value="Whole sign" />
      </div>

      {/* Yogas */}
      {chart.yogas?.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-accent)', marginBottom: '10px' }}>
            Active yogas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {chart.yogas.map((yoga, i) => (
              <div key={i} style={{ background: 'rgba(212,184,150,0.07)', border: '1px solid rgba(212,184,150,0.18)', borderRadius: 'var(--radius-md)', padding: '8px 14px' }}>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', fontWeight: 600, color: 'var(--clr-accent)', marginBottom: '2px' }}>{yoga.name}</p>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', color: 'var(--clr-text-3)' }}>{yoga.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planets */}
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-accent)', opacity: 0.85, marginBottom: '12px' }}>
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
              background: isExpanded ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.18)' : 'var(--clr-border)'}`,
              borderRadius: 'var(--radius-md)', padding: '14px',
              transition: 'all var(--dur-fast)',
              gridColumn: isExpanded ? 'span 2' : 'span 1',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '14px', color, filter: `drop-shadow(0 0 4px ${color}50)` }}>{PLANET_SYMBOLS[name] || name[0]}</span>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text)' }}>{name}</span>
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
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--clr-border)' }}>
                  {reading
                    ? <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.75 }}>{reading}</p>
                    : <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)' }}>Regenerate your chart to see this reading.</p>
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

// ── Shared Reading Components ─────────────────────────────────────────────────

function Section({ number, title, accent, intro, children }: {
  number: string; title: string; accent: string; intro: string; children: React.ReactNode
}) {
  return (
    <div style={{ padding: '36px 20px 40px', borderBottom: '1px solid var(--clr-border)' }}>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: '6px' }}>
        {number}
      </p>
      <h2 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 400, color: 'var(--clr-text)', lineHeight: 1.1, marginBottom: '8px' }}>
        {title}
      </h2>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.65, marginBottom: '22px' }}>
        {intro}
      </p>
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
  onGoDeeper?: () => void
}) {
  // Split into headline (first sentence) + body for visual hierarchy
  let headline = answer ?? ''
  let body = ''
  if (answer) {
    const m = answer.match(/^(.+?[.!?])\s+(.+)$/s)
    if (m && m[1].length < 200) { headline = m[1]; body = m[2] }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--clr-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: '12px' }}>
        {question}
      </p>

      {answer ? (
        <>
          <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 'clamp(16px, 3vw, 18px)', color: 'var(--clr-text)', lineHeight: 1.6, marginBottom: body ? '10px' : 0 }}>
            {headline}
          </p>
          {body && (
            <p style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 'clamp(14px, 2.5vw, 15px)', color: 'var(--clr-text-2)', lineHeight: 1.85 }}>
              {body}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)', lineHeight: 1.6 }}>
          Regenerate your chart to see this reading.
        </p>
      )}

      {/* Footer row: chips + CTA */}
      {(chips.length > 0 || cta) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--clr-border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {chips.map((chip, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.05em', padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--clr-text-3)' }}>
                {chip}
              </span>
            ))}
          </div>
          {cta && onGoDeeper && (
            <button onClick={onGoDeeper} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.14em',
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
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '13px', color: 'var(--clr-text)' }}>{value}</p>
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
    <span style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '20px', background: c.bg, border: `1px solid ${c.border}`, color: c.text, flexShrink: 0 }}>
      {dignity}
    </span>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { getHomeData, HomeData, WeeklySection } from '@/lib/api'

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f5c842', Moon: '#d4e8f0', Mars: '#e85c4a', Mercury: '#7ec8a0',
  Jupiter: '#f0a830', Venus: '#e8a0c0', Saturn: '#8899bb', Rahu: '#a080c0', Ketu: '#c0a070',
}

const FALLBACK_LABELS = ['The current', 'The path', 'Moving through']

const CARRY_STYLES: Record<string, { border: string; label: string; dot: string }> = {
  "A question to sit with": { border: 'rgba(185,156,223,0.35)', label: 'rgba(185,156,223,0.85)', dot: '#b99cdf' },
  "This week's word":       { border: 'rgba(126,200,160,0.35)', label: 'rgba(126,200,160,0.85)', dot: '#7ec8a0' },
  "A practice":             { border: 'rgba(240,184,96,0.35)',  label: 'rgba(240,184,96,0.85)',  dot: '#f0b860' },
  "Watch for this":         { border: 'rgba(91,140,255,0.4)',   label: 'rgba(91,140,255,0.9)',   dot: '#5B8CFF' },
}
const DEFAULT_CARRY = CARRY_STYLES["A question to sit with"]

function fmtWeek(w: string): string {
  return new Date(w).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}
function fmtDate(d: string, long?: boolean): string {
  const date = new Date(d)
  if (long) return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}
function timeRemaining(end: string): string {
  const ms = new Date(end).getTime() - Date.now()
  if (ms <= 0) return 'ended'
  const days = Math.floor(ms / 86400000)
  if (days < 14) return `${days}d left`
  if (days < 60) return `${Math.round(days / 7)}wk left`
  if (days < 730) return `${Math.round(days / 30)}mo left`
  return `${Math.round(days / 365)}yr left`
}
function progressPct(start: string, end: string): number {
  const s = new Date(start).getTime(), e = new Date(end).getTime(), now = Date.now()
  return Math.min(100, Math.max(1, ((now - s) / (e - s)) * 100))
}

// ── SVG Illustrations ──────────────────────────────────────────────────────

function OrbitalRings({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <circle cx="120" cy="120" r="108" stroke="#5B8CFF" strokeWidth="0.5" opacity={opacity} />
      <circle cx="120" cy="120" r="80"  stroke="#5B8CFF" strokeWidth="0.5" opacity={opacity * 0.85} />
      <circle cx="120" cy="120" r="52"  stroke="#D4B896" strokeWidth="0.5" opacity={opacity * 0.7} />
      <circle cx="120" cy="120" r="28"  stroke="#D4B896" strokeWidth="0.5" opacity={opacity * 0.55} />
      <circle cx="120" cy="120" r="4"   fill="#D4B896" opacity={opacity * 2.5} />
      <line x1="120" y1="8"   x2="120" y2="232" stroke="#5B8CFF" strokeWidth="0.3" opacity={opacity * 0.5} />
      <line x1="8"   y1="120" x2="232" y2="120" stroke="#5B8CFF" strokeWidth="0.3" opacity={opacity * 0.5} />
      <circle cx="228" cy="120" r="4"   fill="#5B8CFF" opacity={opacity * 1.5} />
      <circle cx="120" cy="40"  r="3.5" fill="#D4B896" opacity={opacity * 1.3} />
      <circle cx="68"  cy="120" r="3"   fill="#B99CDF" opacity={opacity * 1.2} />
      <circle cx="120" cy="172" r="2.5" fill="#7EC8A0" opacity={opacity * 1.1} />
    </svg>
  )
}

function MovementAccent({ color, angle }: { color: string; angle: number }) {
  const rad = (angle * Math.PI) / 180
  const x = 14 + 10 * Math.cos(rad)
  const y = 14 + 10 * Math.sin(rad)
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="10" stroke={color} strokeWidth="0.6" opacity="0.22" />
      <circle cx="14" cy="14" r="5.5" stroke={color} strokeWidth="0.5" opacity="0.14" />
      <circle cx="14" cy="14" r="1.5" fill={color} opacity="0.35" />
      <circle cx={x} cy={y} r="2.2" fill={color} opacity="0.65" />
    </svg>
  )
}

function DashaOrbital({ maha, antar, prat }: { maha?: string; antar?: string; prat?: string }) {
  const pratColor  = PLANET_COLORS[prat  || ''] || '#5B8CFF'
  const antarColor = PLANET_COLORS[antar || ''] || 'rgba(91,140,255,0.6)'
  const mahaColor  = PLANET_COLORS[maha  || ''] || 'rgba(255,255,255,0.25)'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="46" stroke={mahaColor}  strokeWidth="0.5" opacity="0.2" />
      <circle cx="50" cy="50" r="30" stroke={antarColor} strokeWidth="0.7" opacity="0.3" />
      <circle cx="50" cy="50" r="14" stroke={pratColor}  strokeWidth="1"   opacity="0.55" />
      <circle cx="50" cy="50" r="2.5" fill="#D4B896" opacity="0.6" />
      {maha && <>
        <circle cx="96" cy="50" r="3" fill={mahaColor} opacity="0.4" />
        <text x="96" y="54.5" fill={mahaColor} fontSize="9" textAnchor="middle" opacity="0.45" fontFamily="serif">{PLANET_GLYPHS[maha]}</text>
      </>}
      {antar && <>
        <circle cx="50" cy="20" r="3.5" fill={antarColor} opacity="0.55" />
        <text x="50" y="24.5" fill={antarColor} fontSize="10" textAnchor="middle" opacity="0.6" fontFamily="serif">{PLANET_GLYPHS[antar]}</text>
      </>}
      {prat && <>
        <circle cx="36" cy="50" r="4" fill={pratColor} opacity="0.85" />
        <text x="36" y="54.5" fill={pratColor} fontSize="11" textAnchor="middle" fontFamily="serif" fontWeight="bold">{PLANET_GLYPHS[prat]}</text>
      </>}
    </svg>
  )
}

// ── Timeline Row ────────────────────────────────────────────────────────────

interface TimelineRowProps {
  planet: string; start: string; end: string; sublabel: string
  barHeight: number; fillColor: string; trackColor: string
  glowColor?: string; isNow?: boolean
}
function TimelineRow({ planet, start, end, sublabel, barHeight, fillColor, trackColor, glowColor, isNow }: TimelineRowProps) {
  const pct = progressPct(start, end)
  const remaining = timeRemaining(end)
  const glyph = PLANET_GLYPHS[planet] || ''
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: barHeight === 8 ? '16px' : barHeight === 5 ? '13px' : '11px', color: isNow ? 'var(--nk-primary)' : 'var(--nk-text-3)', lineHeight: 1 }}>{glyph}</span>
          <div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: isNow ? '14px' : '12px', fontWeight: isNow ? 600 : 400, color: isNow ? 'var(--nk-text)' : 'var(--nk-text-2)' }}>{planet}</span>
            {isNow && (
              <span style={{ marginLeft: '7px', fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'var(--nk-primary-dim)', color: 'var(--nk-primary)', padding: '2px 8px', borderRadius: 'var(--nk-r-pill)', border: '1px solid var(--nk-primary-line)' }}>now</span>
            )}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: isNow ? 'var(--nk-primary)' : 'var(--nk-text-3)' }}>{remaining}</span>
      </div>
      <div style={{ position: 'relative', height: `${barHeight}px`, background: trackColor, borderRadius: `${barHeight}px`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: fillColor, borderRadius: `${barHeight}px`, boxShadow: glowColor ? `0 0 10px ${glowColor}` : undefined, transition: 'width 0.8s var(--ease-entry)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-3)', letterSpacing: '0.04em' }}>{fmtDate(start, true)} – {fmtDate(end, true)}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: isNow ? 'var(--nk-primary)' : 'var(--nk-text-4)' }}>{sublabel}</span>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, token, loading, openAuthModal } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<HomeData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [briefingExpanded, setBriefingExpanded] = useState(false)

  useEffect(() => {
    if (loading) return
    const stored = localStorage.getItem('naksha_chart')
    if (!stored && !user) { router.replace('/'); return }
  }, [loading, user, token])

  useEffect(() => {
    if (!token) return
    setFetching(true)
    getHomeData(token)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [token])

  if (loading) return null

  const cycles = data?.life_cycle
  const carryStyle = data?.weekly_carry_label
    ? (CARRY_STYLES[data.weekly_carry_label] ?? DEFAULT_CARRY)
    : DEFAULT_CARRY

  const activeMaha  = cycles?.mahadasha?.planet
  const activeAntar = cycles?.antardasha?.planet
  const activePrat  = cycles?.pratyantardasha?.planet

  // Planet signature for the pull quote card
  const sigPlanet      = activePrat || activeAntar
  const sigGlyph       = sigPlanet ? PLANET_GLYPHS[sigPlanet] : null
  const sigColor       = sigPlanet ? PLANET_COLORS[sigPlanet] : 'var(--nk-primary)'

  return (
    <AppShell>
      <div style={{
        flex: 1, padding: '32px 20px 56px',
        maxWidth: '600px', width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '40px',
      }}>

        {/* ── This Week ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-primary)' }}>
              This week
            </p>
            {data?.weekly_briefing_week && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-4)' }}>
                w/c {fmtWeek(data.weekly_briefing_week)}
              </p>
            )}
          </div>

          {/* ── Not signed in ── */}
          {!user ? (
            <div style={{
              background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
              borderRadius: 'var(--nk-r-lg)', padding: '48px 28px',
              textAlign: 'center', boxShadow: 'var(--nk-shadow-sm)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                <OrbitalRings opacity={0.06} />
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 300, color: 'var(--nk-text-2)', marginBottom: '20px', lineHeight: 1.75, position: 'relative', zIndex: 1 }}>
                Your weekly reading is generated every Monday, personalised to your chart and current life season.
              </p>
              <button
                onClick={() => openAuthModal()}
                style={{ position: 'relative', zIndex: 1, padding: '10px 22px', background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)', borderRadius: 'var(--nk-r-sm)', color: 'var(--nk-primary)', fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Sign in to unlock →
              </button>
            </div>

          ) : fetching && !data?.weekly_briefing ? (
            <div style={{
              background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
              borderRadius: 'var(--nk-r-lg)', padding: '56px 24px',
              textAlign: 'center', boxShadow: 'var(--nk-shadow-sm)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                <OrbitalRings opacity={0.05} />
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.14em', color: 'var(--nk-text-3)', position: 'relative', zIndex: 1 }}>
                Reading the stars for you…
              </p>
            </div>

          ) : data?.weekly_briefing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* ── 1. Pull Quote — the cover ── */}
              {data.weekly_pull_quote && (
                <div style={{
                  background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
                  borderRadius: 'var(--nk-r-lg)', padding: '52px 32px 48px',
                  textAlign: 'center', boxShadow: 'var(--nk-shadow-md)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Orbital rings — background decoration */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                    <OrbitalRings opacity={0.09} />
                  </div>

                  {/* Active planet signature pill */}
                  {sigGlyph && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      marginBottom: '24px', padding: '4px 12px',
                      background: `${sigColor}18`,
                      border: `1px solid ${sigColor}2e`,
                      borderRadius: 'var(--nk-r-pill)',
                      position: 'relative', zIndex: 1,
                    }}>
                      <span style={{ fontSize: '13px', color: sigColor, lineHeight: 1 }}>{sigGlyph}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: sigColor, opacity: 0.8 }}>{sigPlanet}</span>
                    </div>
                  )}

                  {/* The quote */}
                  <p style={{
                    fontFamily: 'var(--nk-font-display)',
                    fontSize: 'clamp(19px, 4.5vw, 25px)',
                    fontWeight: 400, lineHeight: 1.65, letterSpacing: '-0.01em',
                    color: 'var(--nk-text)', position: 'relative', zIndex: 1,
                  }}>
                    {data.weekly_pull_quote}
                  </p>
                </div>
              )}

              {/* ── 2. Briefing as collapsible movements ── */}
              {(() => {
                const SECTION_COLORS = ['var(--nk-primary)', 'var(--nk-gold)', 'var(--nk-violet)']
                const SECTION_ANGLES = [40, 220, 130]
                const sections: WeeklySection[] = data.weekly_sections?.length
                  ? data.weekly_sections
                  : (data.weekly_briefing?.split('\n\n').filter(Boolean) ?? []).map(b => ({ label: null, body: b }))

                // Preview: first section body truncated to 2 sentences
                const firstBody = sections[0]?.body ?? ''
                const previewEnd = (() => {
                  let count = 0
                  for (let i = 0; i < firstBody.length; i++) {
                    if (firstBody[i] === '.' || firstBody[i] === '!' || firstBody[i] === '?') {
                      count++
                      if (count === 2) return i + 1
                    }
                  }
                  return firstBody.length
                })()
                const previewText = firstBody.slice(0, previewEnd).trim()
                const hasMore = sections.length > 1 || firstBody.length > previewEnd

                return (
                  <div style={{
                    background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
                    borderRadius: 'var(--nk-r-lg)', padding: '24px',
                    boxShadow: 'var(--nk-shadow-sm)',
                  }}>
                    {briefingExpanded ? (
                      // ── Expanded: all sections ──
                      <>
                        {sections.map((sec, i) => (
                          <div key={i}>
                            {i > 0 && <div style={{ margin: '20px 0', height: '1px', background: 'var(--nk-border-hair)' }} />}
                            <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start' }}>
                              <div style={{ paddingTop: '2px' }}>
                                <MovementAccent color={SECTION_COLORS[i % SECTION_COLORS.length]} angle={SECTION_ANGLES[i % SECTION_ANGLES.length]} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontFamily: 'var(--font-sans)', fontSize: '9px',
                                  letterSpacing: '0.2em', textTransform: 'uppercase',
                                  color: SECTION_COLORS[i % SECTION_COLORS.length],
                                  marginBottom: '8px', opacity: 0.75,
                                }}>
                                  {sec.label ?? FALLBACK_LABELS[i] ?? FALLBACK_LABELS[FALLBACK_LABELS.length - 1]}
                                </p>
                                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--nk-text-2)', lineHeight: 1.85, margin: 0 }}>
                                  {sec.body}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setBriefingExpanded(false)}
                          style={{ marginTop: '18px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-4)', letterSpacing: '0.06em' }}
                        >
                          show less ↑
                        </button>
                      </>
                    ) : (
                      // ── Collapsed: first section label + 2-sentence preview ──
                      <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start' }}>
                        <div style={{ paddingTop: '2px' }}>
                          <MovementAccent color="var(--nk-primary)" angle={40} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {sections[0]?.label && (
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-primary)', marginBottom: '8px', opacity: 0.75 }}>
                              {sections[0].label}
                            </p>
                          )}
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--nk-text-2)', lineHeight: 1.85, margin: 0 }}>
                            {previewText}
                            {hasMore && (
                              <>{' '}<span
                                onClick={() => setBriefingExpanded(true)}
                                style={{ color: 'var(--nk-primary)', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.03em' }}
                              >see more →</span></>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── 3. Carry — tarot card ── */}
              {data.weekly_carry_text && (
                <div style={{
                  background: 'var(--nk-surface)',
                  border: `1px solid ${carryStyle.border}`,
                  borderRadius: 'var(--nk-r-lg)',
                  padding: '44px 32px 40px',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  {/* Corner brackets */}
                  {(['tl','tr','bl','br'] as const).map(corner => (
                    <div key={corner} style={{
                      position: 'absolute',
                      top:    corner.startsWith('t') ? '14px' : undefined,
                      bottom: corner.startsWith('b') ? '14px' : undefined,
                      left:   corner.endsWith('l')   ? '14px' : undefined,
                      right:  corner.endsWith('r')   ? '14px' : undefined,
                      width: '14px', height: '14px',
                      borderTop:    corner.startsWith('t') ? `1px solid ${carryStyle.border}` : undefined,
                      borderBottom: corner.startsWith('b') ? `1px solid ${carryStyle.border}` : undefined,
                      borderLeft:   corner.endsWith('l')   ? `1px solid ${carryStyle.border}` : undefined,
                      borderRight:  corner.endsWith('r')   ? `1px solid ${carryStyle.border}` : undefined,
                      opacity: 0.8,
                    }} />
                  ))}

                  {/* Label */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginBottom: '22px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: carryStyle.dot, opacity: 0.8 }} />
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: carryStyle.label }}>
                      {data.weekly_carry_label || 'Carry this with you'}
                    </p>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: carryStyle.dot, opacity: 0.8 }} />
                  </div>

                  {/* The carry text — large, centered, serif */}
                  <p style={{
                    fontFamily: 'var(--nk-font-display)',
                    fontSize: 'clamp(18px, 4.2vw, 23px)',
                    fontWeight: 400,
                    fontStyle: data.weekly_carry_label === 'A question to sit with' ? 'italic' : 'normal',
                    color: 'var(--nk-text)', lineHeight: 1.6, letterSpacing: '-0.01em',
                  }}>
                    {data.weekly_carry_text}
                  </p>
                </div>
              )}

            </div>
          ) : null}
        </section>

        {/* ── Your Season ── */}
        <section>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-primary)', marginBottom: '20px' }}>
            Your season
          </p>

          {cycles && (cycles.mahadasha || cycles.antardasha || cycles.pratyantardasha) ? (
            <div style={{
              background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
              borderRadius: 'var(--nk-r-lg)', padding: '24px 20px',
              boxShadow: 'var(--nk-shadow-sm)',
            }}>
              {/* Header: orbital diagram + active cycle label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <DashaOrbital maha={activeMaha} antar={activeAntar} prat={activePrat} />
                <div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-4)', letterSpacing: '0.1em', marginBottom: '5px', textTransform: 'uppercase' }}>
                    Active cycle
                  </p>
                  <p style={{ fontFamily: 'var(--nk-font-display)', fontSize: '19px', color: 'var(--nk-text)', lineHeight: 1.25 }}>
                    {activePrat
                      ? `${PLANET_GLYPHS[activePrat] || ''} ${activePrat}`
                      : activeMaha
                      ? `${PLANET_GLYPHS[activeMaha] || ''} ${activeMaha}`
                      : '—'} period
                  </p>
                  {activePrat && (activeMaha || activeAntar) && (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)', marginTop: '4px' }}>
                      in {activeMaha || ''}{activeAntar ? ` · ${activeAntar}` : ''} season
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {cycles.mahadasha && (
                  <TimelineRow
                    planet={cycles.mahadasha.planet} start={cycles.mahadasha.start_date} end={cycles.mahadasha.end_date}
                    sublabel="Mahadasha" barHeight={3} fillColor="rgba(255,255,255,0.18)" trackColor="rgba(255,255,255,0.05)"
                  />
                )}
                {cycles.mahadasha && cycles.antardasha && <div style={{ margin: '16px 0', height: '1px', background: 'var(--nk-border-hair)' }} />}
                {cycles.antardasha && (
                  <TimelineRow
                    planet={cycles.antardasha.planet} start={cycles.antardasha.start_date} end={cycles.antardasha.end_date}
                    sublabel="Antardasha" barHeight={5} fillColor="rgba(91,140,255,0.5)" trackColor="rgba(255,255,255,0.05)"
                  />
                )}
                {cycles.antardasha && cycles.pratyantardasha && <div style={{ margin: '16px 0', height: '1px', background: 'var(--nk-border-hair)' }} />}
                {cycles.pratyantardasha && (
                  <TimelineRow
                    planet={cycles.pratyantardasha.planet} start={cycles.pratyantardasha.start_date} end={cycles.pratyantardasha.end_date}
                    sublabel="Pratyantardasha" barHeight={8} fillColor="var(--nk-primary)" trackColor="var(--nk-primary-dim)"
                    glowColor="rgba(91,140,255,0.4)" isNow
                  />
                )}
              </div>

              <button
                onClick={() => user ? router.push('/go-deeper?from=season') : openAuthModal()}
                style={{
                  marginTop: '20px', width: '100%', padding: '13px 18px',
                  background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)',
                  borderRadius: 'var(--nk-r-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,140,255,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,140,255,0.5)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--nk-primary-dim)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-primary-line)' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--nk-primary)', marginBottom: '2px' }}>
                    What does the year ahead hold?
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)' }}>
                    Ask about love, career, and personal growth
                  </p>
                </div>
                <span style={{ color: 'var(--nk-primary)', fontSize: '16px', flexShrink: 0, marginLeft: '12px' }}>→</span>
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--nk-surface)', border: '1px solid var(--nk-border)', borderRadius: 'var(--nk-r-md)', padding: '20px 18px', boxShadow: 'var(--nk-shadow-sm)' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--nk-text-3)', lineHeight: 1.6 }}>
                {user ? 'Generate your chart to see your life cycle.' : 'Sign in to see your personalised life cycle.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Explore ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nk-primary)', marginBottom: '4px' }}>
            Explore
          </p>
          {[
            { href: '/go-deeper', icon: '✦', title: 'Go Deeper', desc: 'Ask about your chart, current life season or anything on your mind.' },
            { href: '/bonds',     icon: '◯', title: 'Bonds',     desc: 'Explore compatibility with friends or partners.' },
          ].map(card => (
            <div
              key={card.href}
              onClick={() => user ? router.push(card.href) : openAuthModal()}
              style={{ background: 'var(--nk-surface)', border: '1px solid var(--nk-border)', borderRadius: 'var(--nk-r-md)', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'border-color 150ms ease, background 150ms ease', cursor: 'pointer', boxShadow: 'var(--nk-shadow-sm)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-primary-line)'; (e.currentTarget as HTMLElement).style.background = 'var(--nk-surface-2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--nk-surface)' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--nk-r-sm)', background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--nk-primary)', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--nk-text)', marginBottom: '3px' }}>{card.title}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-text-3)', lineHeight: 1.5 }}>{card.desc}</p>
              </div>
              <span style={{ color: 'var(--nk-primary)', fontSize: '16px', flexShrink: 0 }}>→</span>
            </div>
          ))}
        </section>

      </div>
    </AppShell>
  )
}

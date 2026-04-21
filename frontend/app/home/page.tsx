'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { getHomeData, HomeData } from '@/lib/api'

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const CARRY_COLORS: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  "A question to sit with": {
    bg: 'linear-gradient(135deg, rgba(108,92,231,0.13) 0%, rgba(140,100,220,0.06) 100%)',
    border: 'rgba(140,100,220,0.28)',
    label: 'rgba(190,160,255,0.85)',
    dot: '#b99cdf',
  },
  "This week's word": {
    bg: 'linear-gradient(135deg, rgba(0,184,166,0.12) 0%, rgba(0,150,136,0.06) 100%)',
    border: 'rgba(0,184,166,0.28)',
    label: 'rgba(100,220,200,0.85)',
    dot: '#5ecdb8',
  },
  "A practice": {
    bg: 'linear-gradient(135deg, rgba(232,121,82,0.12) 0%, rgba(200,90,60,0.06) 100%)',
    border: 'rgba(232,121,82,0.28)',
    label: 'rgba(255,160,120,0.85)',
    dot: '#e8795a',
  },
  "Watch for this": {
    bg: 'linear-gradient(135deg, rgba(212,184,150,0.13) 0%, rgba(180,150,110,0.06) 100%)',
    border: 'rgba(212,184,150,0.28)',
    label: 'rgba(212,184,150,0.9)',
    dot: 'var(--clr-accent)',
  },
}

const DEFAULT_CARRY_COLOR = CARRY_COLORS["A question to sit with"]

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
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const now = Date.now()
  return Math.min(100, Math.max(1, ((now - s) / (e - s)) * 100))
}

interface TimelineRowProps {
  planet: string
  start: string
  end: string
  label: string
  sublabel: string
  barHeight: number
  fillColor: string
  trackColor: string
  glowColor?: string
  isNow?: boolean
}

function TimelineRow({ planet, start, end, label, sublabel, barHeight, fillColor, trackColor, glowColor, isNow }: TimelineRowProps) {
  const pct = progressPct(start, end)
  const remaining = timeRemaining(end)
  const glyph = PLANET_GLYPHS[planet] || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: barHeight === 8 ? '16px' : barHeight === 5 ? '13px' : '11px',
            color: isNow ? 'var(--clr-accent)' : 'var(--clr-text-2)',
            lineHeight: 1,
          }}>
            {glyph}
          </span>
          <div>
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: isNow ? '14px' : '12px',
              fontWeight: isNow ? 600 : 400,
              color: isNow ? 'var(--clr-text)' : 'var(--clr-text-2)',
            }}>
              {planet}
            </span>
            {isNow && (
              <span style={{
                marginLeft: '7px',
                fontFamily: 'var(--font-label)',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'rgba(212,184,150,0.15)',
                color: 'var(--clr-accent)',
                padding: '1px 7px',
                borderRadius: '20px',
              }}>
                now
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontFamily: 'var(--font-label)',
            fontSize: '10px',
            color: isNow ? 'var(--clr-accent)' : 'var(--clr-text-3)',
          }}>
            {remaining}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'relative',
        height: `${barHeight}px`,
        background: trackColor,
        borderRadius: `${barHeight}px`,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: fillColor,
          borderRadius: `${barHeight}px`,
          boxShadow: glowColor ? `0 0 8px ${glowColor}` : undefined,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Date range + period label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          fontFamily: 'var(--font-label)',
          fontSize: '10px',
          color: 'var(--clr-text-3)',
          letterSpacing: '0.04em',
        }}>
          {fmtDate(start, true)} – {fmtDate(end, true)}
        </span>
        <span style={{
          fontFamily: 'var(--font-label)',
          fontSize: '9px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: isNow ? 'rgba(212,184,150,0.5)' : 'var(--clr-text-3)',
          opacity: 0.7,
        }}>
          {sublabel}
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, token, loading, openAuthModal } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<HomeData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [chartName, setChartName] = useState<string>('')
  const [briefingExpanded, setBriefingExpanded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naksha_chart')
    if (!stored) { router.replace('/onboarding'); return }
    if (!token) {
      try {
        const chart = JSON.parse(stored)
        setChartName(chart?.meta?.name || '')
      } catch {}
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    setFetching(true)
    getHomeData(token)
      .then(d => {
        setData(d)
        if (d.birth_name) setChartName(d.birth_name)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [token])

  if (loading) return null

  const cycles = data?.life_cycle
  const carryColors = data?.weekly_carry_label
    ? (CARRY_COLORS[data.weekly_carry_label] ?? DEFAULT_CARRY_COLOR)
    : DEFAULT_CARRY_COLOR

  return (
    <AppShell>
    <div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px 20px 48px',
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>

        {/* ── This Week ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{
              fontFamily: 'var(--font-label)', fontSize: '10px',
              letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-accent)',
            }}>
              This week
            </p>
            {data?.weekly_briefing_week && (
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', color: 'var(--clr-text-3)' }}>
                w/c {fmtWeek(data.weekly_briefing_week)}
              </p>
            )}
          </div>

          {!user ? (
            /* Not logged in */
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--clr-border)',
              borderRadius: '14px', padding: '24px', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 300,
                color: 'var(--clr-text-2)', marginBottom: '14px', lineHeight: 1.6,
              }}>
                Your weekly reading is generated every Monday, personalised to your chart and current life season.
              </p>
              <button
                onClick={openAuthModal}
                style={{
                  padding: '10px 22px', background: 'rgba(212,184,150,0.1)',
                  border: '1px solid rgba(212,184,150,0.3)', borderRadius: '8px',
                  color: 'var(--clr-accent)', fontFamily: 'var(--font-label)',
                  fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Sign in to unlock →
              </button>
            </div>

          ) : fetching && !data?.weekly_briefing ? (
            /* Loading */
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--clr-border)',
              borderRadius: '14px', padding: '28px 24px',
            }}>
              <p style={{
                fontFamily: 'var(--font-label)', fontSize: '11px',
                letterSpacing: '0.14em', color: 'var(--clr-text-3)', textAlign: 'center',
              }}>
                Reading the stars for you…
              </p>
            </div>

          ) : data?.weekly_briefing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Pull quote — the thesis line */}
              {data.weekly_pull_quote && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(212,184,150,0.2)',
                  borderRadius: '14px',
                  padding: '22px 24px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative quote mark */}
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '16px',
                    fontSize: '72px',
                    lineHeight: 1,
                    fontFamily: 'Georgia, serif',
                    color: 'var(--clr-accent)',
                    opacity: 0.18,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>
                    "
                  </span>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(16px, 3vw, 19px)',
                    fontWeight: 400,
                    color: 'var(--clr-text)',
                    lineHeight: 1.65,
                    paddingTop: '8px',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {data.weekly_pull_quote}
                  </p>
                </div>
              )}

              {/* Full briefing — collapsible */}
              {(() => {
                const paras = data.weekly_briefing.split('\n\n').filter(Boolean)
                // Preview: first paragraph truncated to ~2 sentences
                const firstPara = paras[0] || ''
                const sentenceBreak = (() => {
                  let count = 0
                  for (let i = 0; i < firstPara.length; i++) {
                    if (firstPara[i] === '.' || firstPara[i] === '!' || firstPara[i] === '?') {
                      count++
                      if (count === 2) return i + 1
                    }
                  }
                  return Math.min(160, firstPara.length)
                })()
                const previewText = firstPara.slice(0, sentenceBreak).trim()
                const hasMore = firstPara.length > sentenceBreak || paras.length > 1

                return (
                  <div style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: '14px',
                    padding: '24px',
                  }}>
                    {briefingExpanded ? (
                      paras.map((para, i, arr) => (
                        <p key={i} style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(14px, 2.4vw, 16px)',
                          color: 'var(--clr-text-2)',
                          lineHeight: 1.85,
                          marginBottom: i < arr.length - 1 ? '16px' : 0,
                        }}>
                          {para}
                        </p>
                      ))
                    ) : (
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(14px, 2.4vw, 16px)',
                        color: 'var(--clr-text-2)',
                        lineHeight: 1.85,
                        margin: 0,
                      }}>
                        {previewText}
                        {hasMore && (
                          <>
                            {'… '}
                            <span
                              onClick={() => setBriefingExpanded(true)}
                              style={{
                                color: 'var(--clr-accent)',
                                fontFamily: 'var(--font-label)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                letterSpacing: '0.04em',
                                opacity: 0.85,
                              }}
                            >
                              See more
                            </span>
                          </>
                        )}
                      </p>
                    )}
                    {briefingExpanded && hasMore && (
                      <span
                        onClick={() => setBriefingExpanded(false)}
                        style={{
                          display: 'inline-block',
                          marginTop: '12px',
                          color: 'var(--clr-accent)',
                          fontFamily: 'var(--font-label)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          opacity: 0.85,
                        }}
                      >
                        See less
                      </span>
                    )}
                  </div>
                )
              })()}

              {/* Carry this with you */}
              {data.weekly_carry_text && (
                <div style={{
                  background: carryColors.bg,
                  border: `1px solid ${carryColors.border}`,
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: carryColors.dot, flexShrink: 0,
                    }} />
                    <p style={{
                      fontFamily: 'var(--font-label)',
                      fontSize: '9px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: carryColors.label,
                    }}>
                      {data.weekly_carry_label || 'Carry this with you'}
                    </p>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(14px, 2.5vw, 16px)',
                    color: 'var(--clr-text)',
                    lineHeight: 1.7,
                  }}>
                    {data.weekly_carry_text}
                  </p>
                </div>
              )}

            </div>
          ) : null}
        </section>

        {/* ── Life Cycle Timeline ── */}
        <section>
          <p style={{
            fontFamily: 'var(--font-label)', fontSize: '10px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--clr-accent)', marginBottom: '14px',
          }}>
            Your season
          </p>

          {cycles ? (
            <div style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--clr-border)',
              borderRadius: '14px',
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}>

              {/* Mahadasha */}
              {cycles.mahadasha && (
                <TimelineRow
                  planet={cycles.mahadasha.planet}
                  start={cycles.mahadasha.start_date}
                  end={cycles.mahadasha.end_date}
                  label="Life arc"
                  sublabel="Mahadasha"
                  barHeight={3}
                  fillColor="rgba(255,255,255,0.22)"
                  trackColor="rgba(255,255,255,0.06)"
                />
              )}

              {/* Divider with nesting indicator */}
              {cycles.mahadasha && cycles.antardasha && (
                <div style={{
                  margin: '14px 0 14px 12px',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  paddingLeft: '0',
                  height: '1px',
                  background: 'rgba(255,255,255,0.05)',
                }} />
              )}

              {/* Antardasha */}
              {cycles.antardasha && (
                <TimelineRow
                  planet={cycles.antardasha.planet}
                  start={cycles.antardasha.start_date}
                  end={cycles.antardasha.end_date}
                  label="This season"
                  sublabel="Antardasha"
                  barHeight={5}
                  fillColor="rgba(212,184,150,0.45)"
                  trackColor="rgba(255,255,255,0.07)"
                />
              )}

              {cycles.antardasha && cycles.pratyantardasha && (
                <div style={{
                  margin: '14px 0 14px 12px',
                  height: '1px',
                  background: 'rgba(255,255,255,0.05)',
                }} />
              )}

              {/* Pratyantardasha */}
              {cycles.pratyantardasha && (
                <TimelineRow
                  planet={cycles.pratyantardasha.planet}
                  start={cycles.pratyantardasha.start_date}
                  end={cycles.pratyantardasha.end_date}
                  label="Right now"
                  sublabel="Pratyantardasha"
                  barHeight={8}
                  fillColor="var(--clr-accent)"
                  trackColor="rgba(212,184,150,0.1)"
                  glowColor="rgba(212,184,150,0.35)"
                  isNow
                />
              )}

              {/* Go Deeper CTA */}
              <button
                onClick={() => user ? router.push('/go-deeper?from=season') : openAuthModal()}
                style={{
                  marginTop: '18px',
                  width: '100%',
                  padding: '13px 18px',
                  background: 'rgba(212,184,150,0.07)',
                  border: '1px solid rgba(212,184,150,0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 200ms ease, border-color 200ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(212,184,150,0.12)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,184,150,0.35)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(212,184,150,0.07)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,184,150,0.2)'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--clr-text)',
                    marginBottom: '2px',
                  }}>
                    What does the year ahead hold?
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: '11px',
                    color: 'var(--clr-text-3)',
                  }}>
                    Ask about the year ahead in love, career, and personal life
                  </p>
                </div>
                <span style={{ color: 'var(--clr-accent)', fontSize: '16px', flexShrink: 0, marginLeft: '12px' }}>→</span>
              </button>

            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--clr-border)',
              borderRadius: '12px', padding: '20px 18px',
            }}>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '13px', color: 'var(--clr-text-3)', lineHeight: 1.6 }}>
                {user ? 'Generate your chart to see your life cycle.' : 'Sign in to see your personalised life cycle.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Explore ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{
            fontFamily: 'var(--font-label)', fontSize: '10px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--clr-accent)', marginBottom: '4px',
          }}>
            Explore
          </p>

          <div
            onClick={() => user ? router.push('/go-deeper') : openAuthModal()}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--clr-border)',
              borderRadius: '12px', padding: '20px 18px',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'border-color 200ms ease, background 200ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-border)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>💬</span>
            <div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '14px', fontWeight: 600, color: 'var(--clr-text)', marginBottom: '3px' }}>Go Deeper</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.5 }}>Ask any question about your chart — your personal astrologer, always available.</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--clr-text-3)', fontSize: '16px', flexShrink: 0 }}>→</span>
          </div>

          <div
            onClick={() => user ? router.push('/bonds') : openAuthModal()}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--clr-border)',
              borderRadius: '12px', padding: '20px 18px',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'border-color 200ms ease, background 200ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-border)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>◯</span>
            <div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '14px', fontWeight: 600, color: 'var(--clr-text)', marginBottom: '3px' }}>Bonds</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.5 }}>Explore compatibility with friends or partners — a deep karmic reading for any relationship.</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--clr-text-3)', fontSize: '16px', flexShrink: 0 }}>→</span>
          </div>
        </section>

      </div>
    </div>
    </AppShell>
  )
}

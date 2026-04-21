'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { searchUsers, getCompatibility, listBonds } from '@/lib/api'
import { UserSearchResult, BondResult, BondReport } from '@/lib/types'

type RelType = 'friendship' | 'relationship'

function LeadText({ text, fontSize = '15px', lineHeight = 1.85 }: { text: string; fontSize?: string; lineHeight?: number }) {
  const match = text.match(/^(.*?[.!?])\s*([\s\S]*)$/)
  if (!match) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize, color: 'var(--nk-text)', lineHeight, fontWeight: 300, margin: 0 }}>
        {text}
      </p>
    )
  }
  const [, first, rest] = match
  return (
    <p style={{ fontFamily: 'var(--font-sans)', fontSize, color: 'var(--nk-text)', lineHeight, fontWeight: 300, margin: 0 }}>
      <span style={{ fontWeight: 600 }}>{first}</span>
      {rest && ` ${rest}`}
    </p>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 38
  const cx = 52
  const circumference = 2 * Math.PI * r
  const progress = (score / 100) * circumference
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" style={{ display: 'block' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke="var(--nk-primary)" strokeWidth="5"
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ filter: 'drop-shadow(0 0 6px rgba(91,140,255,0.5))' }}
      />
      <text x={cx} y={cx + 7} textAnchor="middle" fill="var(--nk-text)"
        fontSize="22" fontFamily="var(--font-sans)" fontWeight="300">
        {score}
      </text>
    </svg>
  )
}

function ScoreBar({ score }: { score: number }) {
  const opacity = score >= 80 ? 1 : score >= 60 ? 0.65 : 0.35
  return (
    <div style={{ width: '100%', height: '3px', background: 'var(--nk-border)', borderRadius: '2px', marginTop: '8px', marginBottom: '10px' }}>
      <div style={{
        width: `${score}%`, height: '100%',
        background: `rgba(91,140,255,${opacity})`,
        borderRadius: '2px', transition: 'width 0.8s ease',
      }} />
    </div>
  )
}

function BondReportView({ bond, onReset }: { bond: BondResult; onReset: () => void }) {
  const r = bond.report as BondReport
  const label = bond.relationship_type === 'friendship' ? 'Friendship' : 'Relationship'

  return (
    <div style={{ paddingBottom: '48px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--nk-primary)', marginBottom: '6px',
        }}>
          {label} · Compatibility
        </p>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: 'clamp(20px, 5vw, 26px)',
          fontWeight: 300, color: 'var(--nk-text)', lineHeight: 1.2,
        }}>
          {bond.person1.name || `@${bond.person1.username}`} & {bond.person2.name || `@${bond.person2.username}`}
        </h1>
      </div>

      {/* Archetype hero */}
      <div style={{
        background: 'var(--nk-surface)',
        border: '1px solid var(--nk-primary-line)',
        borderRadius: 'var(--nk-r-lg)',
        padding: '24px',
        marginBottom: '10px',
        display: 'flex', alignItems: 'center', gap: '24px',
        boxShadow: 'var(--nk-shadow-md)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--nk-text-3)', marginBottom: '8px',
          }}>
            Bond archetype
          </p>
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(20px, 5vw, 26px)',
            fontWeight: 300, color: 'var(--nk-gold)', lineHeight: 1.15, marginBottom: '10px',
          }}>
            {r.archetype_name}
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '14px',
            fontWeight: 300, color: 'var(--nk-text-2)', lineHeight: 1.65,
          }}>
            {r.archetype_tagline}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <ScoreRing score={r.score} />
        </div>
      </div>

      {/* Core dynamic */}
      <div style={{
        background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
        borderRadius: 'var(--nk-r-lg)', padding: '22px',
        marginBottom: '10px', boxShadow: 'var(--nk-shadow-sm)',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--nk-primary)', marginBottom: '14px',
        }}>
          Core dynamic
        </p>
        <LeadText text={r.core_dynamic} fontSize="clamp(14px, 2.5vw, 15px)" lineHeight={1.85} />
      </div>

      {/* Category breakdown */}
      <div style={{
        background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
        borderRadius: 'var(--nk-r-lg)', padding: '22px',
        marginBottom: '10px', boxShadow: 'var(--nk-shadow-sm)',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--nk-primary)', marginBottom: '20px',
        }}>
          {bond.relationship_type === 'friendship' ? 'Friendship dimensions' : 'Relationship dimensions'}
        </p>
        {r.categories.map((cat, i) => (
          <div key={i} style={{ marginBottom: i < r.categories.length - 1 ? '20px' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '12px',
                color: 'var(--nk-text-2)', letterSpacing: '0.04em',
              }}>
                {cat.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '11px',
                color: 'var(--nk-primary)',
              }}>
                {cat.score}
              </span>
            </div>
            <ScoreBar score={cat.score} />
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '13px',
              fontWeight: 300, color: 'var(--nk-text-2)', lineHeight: 1.75, margin: 0,
            }}>
              {cat.narrative}
            </p>
          </div>
        ))}
      </div>

      {/* Key aspects */}
      <div style={{
        background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
        borderRadius: 'var(--nk-r-lg)', padding: '22px',
        marginBottom: '10px', boxShadow: 'var(--nk-shadow-sm)',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--nk-primary)', marginBottom: '16px',
        }}>
          Key aspects
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {r.key_aspects.map((a, i) => (
            <div key={i} style={{
              background: 'var(--nk-surface-2)',
              border: '1px solid var(--nk-border)',
              borderTop: '2px solid var(--nk-primary-line)',
              borderRadius: 'var(--nk-r-sm)',
              padding: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'var(--nk-primary)', flexShrink: 0, marginTop: '5px',
                  boxShadow: '0 0 6px rgba(91,140,255,0.5)',
                }} />
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '13px',
                  fontWeight: 600, color: 'var(--nk-text)', lineHeight: 1.3, margin: 0,
                }}>
                  {a.aspect}
                </p>
              </div>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '11px',
                fontWeight: 300, color: 'var(--nk-text-2)', lineHeight: 1.65, margin: 0,
              }}>
                {a.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths / Growth edges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          background: 'rgba(126,200,160,0.06)', border: '1px solid rgba(126,200,160,0.2)',
          borderRadius: 'var(--nk-r-lg)', padding: '18px',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--nk-success)', marginBottom: '14px',
          }}>
            What flows
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {r.strengths.map((s, i) => (
              <li key={i} style={{
                fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 300,
                color: 'var(--nk-text-2)', lineHeight: 1.65,
                marginBottom: i < r.strengths.length - 1 ? '8px' : 0,
                paddingLeft: '14px', position: 'relative',
              }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--nk-success)' }}>·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div style={{
          background: 'rgba(240,184,96,0.06)', border: '1px solid rgba(240,184,96,0.2)',
          borderRadius: 'var(--nk-r-lg)', padding: '18px',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--nk-warning)', marginBottom: '14px',
          }}>
            Growth edges
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {r.growth_edges.map((g, i) => (
              <li key={i} style={{
                fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 300,
                color: 'var(--nk-text-2)', lineHeight: 1.65,
                marginBottom: i < r.growth_edges.length - 1 ? '8px' : 0,
                paddingLeft: '14px', position: 'relative',
              }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--nk-warning)' }}>·</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Explore another bond CTA */}
      <div style={{
        background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
        borderRadius: 'var(--nk-r-lg)', padding: '22px', marginBottom: '28px',
        boxShadow: 'var(--nk-shadow-sm)',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 300,
          color: 'var(--nk-text)', lineHeight: 1.5, marginBottom: '6px',
        }}>
          Explore another bond
        </p>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '12px',
          color: 'var(--nk-text-3)', lineHeight: 1.6, marginBottom: '18px',
        }}>
          Every connection has its own karmic thread.
        </p>
        <button
          onClick={onReset}
          style={{
            width: '100%', padding: '13px',
            background: 'var(--nk-primary-dim)',
            border: '1px solid var(--nk-primary-line)',
            borderRadius: 'var(--nk-r-sm)',
            color: 'var(--nk-primary)',
            fontFamily: 'var(--font-sans)', fontSize: '11px',
            letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(91,140,255,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--nk-primary-dim)')}
        >
          New bond →
        </button>
      </div>

    </div>
  )
}

export default function BondsPage() {
  const { user, token, loading, openAuthModal } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [selected, setSelected] = useState<UserSearchResult | null>(null)
  const [relType, setRelType] = useState<RelType>('friendship')
  const [bond, setBond] = useState<BondResult | null>(null)
  const [pastBonds, setPastBonds] = useState<BondResult[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!loading && !user) openAuthModal()
  }, [loading, user])

  useEffect(() => {
    if (!token) return
    listBonds(token).then(setPastBonds).catch(() => {})
  }, [token])

  useEffect(() => {
    clearTimeout(searchTimeout.current)
    if (!query.trim() || !token) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchUsers(token, query)
        setResults(res)
      } catch {}
    }, 320)
  }, [query, token])

  async function generate() {
    if (!selected || !token) return
    setError(''); setGenerating(true); setBond(null)
    try {
      const result = await getCompatibility(token, selected.username, relType)
      setBond(result)
      setPastBonds(prev => [result, ...prev.filter(b => b.id !== result.id)])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  function handleReset() {
    setBond(null); setSelected(null); setQuery(''); setError('')
  }

  if (loading) return null

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--nk-ground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--nk-text-3)', fontSize: '13px' }}>Sign in to access Bonds</p>
      </div>
    )
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {bond && (
          <div style={{
            padding: '14px 20px 0',
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(11,18,32,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--nk-border-hair)',
          }}>
            <button
              onClick={handleReset}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--nk-text-3)',
                transition: 'color var(--dur-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--nk-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--nk-text-3)')}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>←</span>
              Back
            </button>
          </div>
        )}

        <div style={{ flex: 1, padding: '28px 20px', maxWidth: '600px', width: '100%', margin: '0 auto', paddingBottom: '40px' }}>

          {bond ? (
            <BondReportView bond={bond} onReset={handleReset} />
          ) : (
            <>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 300,
                color: 'var(--nk-text)', marginBottom: '6px', lineHeight: 1.3,
              }}>
                Explore a bond
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '13px',
                color: 'var(--nk-text-3)', marginBottom: '24px', lineHeight: 1.6,
              }}>
                Search by @username. Both people need a chart for a compatibility reading.
              </p>

              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="@username"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null) }}
                  style={{
                    width: '100%',
                    background: 'var(--nk-surface)',
                    border: `1px solid ${selected ? 'var(--nk-primary-line)' : 'var(--nk-border)'}`,
                    borderRadius: 'var(--nk-r-sm)',
                    padding: '12px 14px',
                    color: 'var(--nk-text)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                />
                {results.length > 0 && !selected && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'var(--nk-surface-2)',
                    border: '1px solid var(--nk-border)',
                    borderRadius: 'var(--nk-r-sm)',
                    overflow: 'hidden', zIndex: 20,
                    boxShadow: 'var(--nk-shadow-md)',
                  }}>
                    {results.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setSelected(r); setQuery(`@${r.username}`); setResults([]) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 14px', border: 'none', background: 'transparent',
                          color: 'var(--nk-text)', cursor: 'pointer', textAlign: 'left',
                          borderBottom: '1px solid var(--nk-border-hair)',
                          transition: 'background 150ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--nk-primary-dim)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>@{r.username}</span>
                        {!r.has_chart && (
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-4)', letterSpacing: '0.08em' }}>no chart yet</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selected && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '10px',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: 'var(--nk-text-3)', marginBottom: '10px',
                  }}>
                    Connection type
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['friendship', 'relationship'] as RelType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setRelType(t)}
                        style={{
                          flex: 1, padding: '10px',
                          background: relType === t ? 'var(--nk-primary-dim)' : 'var(--nk-surface)',
                          border: `1px solid ${relType === t ? 'var(--nk-primary-line)' : 'var(--nk-border)'}`,
                          borderRadius: 'var(--nk-r-sm)',
                          color: relType === t ? 'var(--nk-primary)' : 'var(--nk-text-2)',
                          fontFamily: 'var(--font-sans)', fontSize: '12px', letterSpacing: '0.06em',
                          cursor: 'pointer', transition: 'all 150ms ease', textTransform: 'capitalize',
                        }}
                      >
                        {t === 'friendship' ? '◯ Friendship' : '♡ Relationship'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-danger)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {error}
                </p>
              )}

              <button
                onClick={generate}
                disabled={!selected || generating}
                style={{
                  width: '100%', padding: '13px',
                  background: selected && !generating ? 'var(--nk-primary)' : 'var(--nk-surface)',
                  border: `1px solid ${selected && !generating ? 'var(--nk-primary)' : 'var(--nk-border)'}`,
                  borderRadius: 'var(--nk-r-sm)',
                  color: selected && !generating ? '#fff' : 'var(--nk-text-3)',
                  fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.18em',
                  textTransform: 'uppercase', cursor: selected && !generating ? 'pointer' : 'not-allowed',
                  transition: 'all 200ms ease',
                  boxShadow: selected && !generating ? 'var(--nk-primary-glow)' : 'none',
                }}
              >
                {generating ? 'Reading the stars…' : 'Generate compatibility'}
              </button>

              {/* Past readings */}
              {pastBonds.length > 0 && (
                <div style={{ marginTop: '36px' }}>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '10px',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'var(--nk-text-4)', marginBottom: '12px',
                  }}>
                    Past readings
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pastBonds.map(b => {
                      const icon = b.relationship_type === 'friendship' ? '◯' : '♡'
                      const name1 = b.person1.name || `@${b.person1.username}`
                      const name2 = b.person2.name || `@${b.person2.username}`
                      return (
                        <button
                          key={b.id}
                          onClick={() => setBond(b)}
                          style={{
                            width: '100%', background: 'var(--nk-surface)',
                            border: '1px solid var(--nk-border)',
                            borderRadius: 'var(--nk-r-sm)',
                            padding: '14px 16px', textAlign: 'left',
                            cursor: 'pointer', transition: 'all 150ms ease',
                            boxShadow: 'var(--nk-shadow-sm)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--nk-surface-2)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-border-hover)'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--nk-surface)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-border)'
                          }}
                        >
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--nk-text)', marginBottom: '4px' }}>
                            {icon} {name1} & {name2}
                          </p>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)', letterSpacing: '0.02em' }}>
                            {b.report.archetype_name}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

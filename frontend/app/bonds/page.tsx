'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { searchUsers, getCompatibility, listBonds } from '@/lib/api'
import { UserSearchResult, BondResult, BondReport, BondCategory } from '@/lib/types'

type RelType = 'friendship' | 'relationship'

// Collapsible reading card — same pattern as ReadingCard in chart page
function BondReadingCard({ label, text, accent = 'var(--nk-primary)' }: { label: string; text: string; accent?: string }) {
  const [expanded, setExpanded] = useState(false)

  let headline = text
  let body = ''
  const m = text.match(/^(.+?[.!?])\s+([A-Z].+)$/s)
  if (m) {
    headline = m[1]
    body = m[2]
  } else {
    const cut = text.lastIndexOf(' ', 160)
    if (cut > 60) {
      headline = text.slice(0, cut) + '…'
      body = text
    }
  }
  const hasBody = !!body

  return (
    <div
      onClick={() => hasBody && setExpanded(e => !e)}
      style={{
        background: 'var(--nk-surface)',
        border: '1px solid var(--nk-border)',
        borderRadius: 'var(--nk-r-lg)',
        padding: '20px',
        boxShadow: 'var(--nk-shadow-sm)',
        cursor: hasBody ? 'pointer' : 'default',
        transition: 'border-color var(--dur-fast)',
      }}
      onMouseEnter={e => { if (hasBody) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.18)' }}
      onMouseLeave={e => { if (hasBody) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
    >
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: '12px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(16px, 3vw, 19px)', fontWeight: 400, color: 'var(--nk-text)', lineHeight: 1.65, marginBottom: hasBody ? '10px' : 0 }}>
        {headline}
      </p>
      {expanded && body && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--nk-text-2)', lineHeight: 1.75, marginBottom: '10px' }}>
          {body}
        </p>
      )}
      {hasBody && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.08em', color: accent, opacity: 0.75 }}>
          {expanded ? '↑ Less' : 'Read more ↓'}
        </p>
      )}
    </div>
  )
}

// Single collapsible dimension row with optional synastry comparison view
function DimensionRow({ cat, person1Name, person2Name, isOpen, onToggle }: {
  cat: BondCategory
  person1Name: string
  person2Name: string
  isOpen: boolean
  onToggle: () => void
}) {
  const hasSynastry = !!(cat.person1_context && cat.person2_context)
  const scoreOpacity = cat.score >= 80 ? 1 : cat.score >= 60 ? 0.65 : 0.35

  return (
    <div
      onClick={onToggle}
      style={{
        background: isOpen ? 'rgba(91,140,255,0.05)' : 'var(--nk-surface)',
        border: `1px solid ${isOpen ? 'rgba(91,140,255,0.22)' : 'var(--nk-border)'}`,
        borderRadius: 'var(--nk-r-md)',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all var(--dur-fast)',
      }}
    >
      {/* Header row — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: '12px', letterSpacing: '0.04em',
          color: isOpen ? 'var(--nk-text)' : 'var(--nk-text-2)', fontWeight: isOpen ? 500 : 400,
          flex: 1,
        }}>
          {cat.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-primary)' }}>
            {cat.score}
          </span>
          <span style={{
            fontSize: '10px', color: 'var(--nk-text-4)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--dur-fast)',
            display: 'inline-block',
          }}>
            ▾
          </span>
        </div>
      </div>

      {/* Score bar — always visible */}
      <div style={{ width: '100%', height: '2px', background: 'var(--nk-border)', borderRadius: '2px', marginTop: '8px' }}>
        <div style={{
          width: `${cat.score}%`, height: '100%',
          background: `rgba(91,140,255,${scoreOpacity})`,
          borderRadius: '2px', transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Expanded: synastry comparison + narrative */}
      {isOpen && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--nk-border)' }}
          onClick={e => e.stopPropagation()}
        >
          {hasSynastry && (
            <div style={{ marginBottom: '14px' }}>
              {/* Two-column comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--nk-border-hair)',
                  borderRadius: 'var(--nk-r-sm)',
                  padding: '12px',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--nk-text-4)', marginBottom: '6px',
                  }}>
                    {person1Name}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-text-2)', lineHeight: 1.55,
                  }}>
                    {cat.person1_context}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--nk-border-hair)',
                  borderRadius: 'var(--nk-r-sm)',
                  padding: '12px',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--nk-text-4)', marginBottom: '6px',
                  }}>
                    {person2Name}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-text-2)', lineHeight: 1.55,
                  }}>
                    {cat.person2_context}
                  </p>
                </div>
              </div>
              {/* The dynamic label */}
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--nk-text-4)', textAlign: 'center', marginBottom: '8px',
              }}>
                ↓ the dynamic ↓
              </p>
            </div>
          )}
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '13px',
            fontWeight: 300, color: 'var(--nk-text-2)', lineHeight: 1.75,
          }}>
            {cat.narrative}
          </p>
        </div>
      )}
    </div>
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


function DimensionsCard({ categories, label, person1Name, person2Name }: {
  categories: BondCategory[]
  label: string
  person1Name: string
  person2Name: string
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
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
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {categories.map((cat, i) => (
          <DimensionRow
            key={i}
            cat={cat}
            person1Name={person1Name}
            person2Name={person2Name}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
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
      <div style={{ marginBottom: '10px' }}>
        <BondReadingCard label="Core dynamic" text={r.core_dynamic} />
      </div>

      {/* Category breakdown */}
      <DimensionsCard
        categories={r.categories}
        label={bond.relationship_type === 'friendship' ? 'Friendship dimensions' : 'Relationship dimensions'}
        person1Name={bond.person1.name || bond.person1.username}
        person2Name={bond.person2.name || bond.person2.username}
      />

      {/* Flow pairs */}
      {r.flow_pairs && r.flow_pairs.length > 0 && (
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
            You have · Use it for
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {r.flow_pairs.map((pair, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: '9px',
                  letterSpacing: '0.12em', color: 'var(--nk-text-4)',
                  marginBottom: '6px', paddingLeft: '2px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px' }}>
                  {/* Gift */}
                  <div style={{
                    flex: 1, minWidth: '100px',
                    background: 'rgba(126,200,160,0.07)',
                    border: '1px solid rgba(126,200,160,0.18)',
                    borderRadius: 'var(--nk-r-sm)',
                    padding: '12px',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '9px',
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: 'var(--nk-success)', marginBottom: '5px', opacity: 0.8,
                    }}>
                      You have
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px',
                      color: 'var(--nk-text)', lineHeight: 1.55, margin: 0,
                    }}>
                      {pair.gift}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    flexShrink: 0, width: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--nk-text-4)', fontSize: '11px',
                  }}>
                    →
                  </div>

                  {/* Practice */}
                  <div style={{
                    flex: 1, minWidth: '100px',
                    background: 'rgba(240,184,96,0.06)',
                    border: '1px solid rgba(240,184,96,0.18)',
                    borderRadius: 'var(--nk-r-sm)',
                    padding: '12px',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '9px',
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: 'var(--nk-warning)', marginBottom: '5px', opacity: 0.8,
                    }}>
                      The practice
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px',
                      color: 'var(--nk-text-2)', lineHeight: 1.55, margin: 0,
                    }}>
                      {pair.practice}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

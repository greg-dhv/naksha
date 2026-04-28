'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { geocodeLocation, generateChart } from '@/lib/api'
import { GeocodeResult } from '@/lib/types'

type Step = 'name' | 'date' | 'time' | 'location'
const STEPS: Step[] = ['name', 'date', 'time', 'location']

const LOADING_PHASES = [
  { label: 'Nakshatra', text: 'Fixing your birth star…' },
  { label: 'Moon', text: 'Reading your lunar mind…' },
  { label: 'Ascendant', text: 'Calculating your rising sign…' },
  { label: 'The Nine Grahas', text: 'Mapping all planetary positions…' },
  { label: 'Dasha', text: 'Tracing your life seasons…' },
  { label: 'Rahu & Ketu', text: 'Reading your karmic axis…' },
  { label: 'Yogas', text: 'Detecting planetary combinations…' },
  { label: 'Your Essence', text: 'Weaving it all into your map…' },
]

interface FormData {
  name: string
  birth_date: string
  birth_time: string
  birth_time_unknown: boolean
  location: GeocodeResult | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [form, setForm] = useState<FormData>({
    name: '', birth_date: '', birth_time: '', birth_time_unknown: false, location: null,
  })
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [phaseVisible, setPhaseVisible] = useState(true)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => { setVisible(true); inputRef.current?.focus() }, 80)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (!loading) { setLoadingPhase(0); setPhaseVisible(true); return }
    const cycle = setInterval(() => {
      setPhaseVisible(false)
      const t = setTimeout(() => {
        setLoadingPhase(p => (p + 1) % LOADING_PHASES.length)
        setPhaseVisible(true)
      }, 600)
      return () => clearTimeout(t)
    }, 3500)
    return () => clearInterval(cycle)
  }, [loading])

  const stepIndex = STEPS.indexOf(step)

  const canProceed = () => {
    if (step === 'name') return form.name.trim().length > 0
    if (step === 'date') return form.birth_date.length > 0
    if (step === 'time') return form.birth_time.length > 0 || form.birth_time_unknown
    if (step === 'location') return form.location !== null
    return false
  }

  const next = () => {
    if (!canProceed()) return
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else submit()
  }

  const back = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const searchLocation = (query: string) => {
    setLocationQuery(query)
    if (form.location) setForm(f => ({ ...f, location: null }))
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (query.trim().length < 2) { setLocationResults([]); setError(''); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try { setLocationResults(await geocodeLocation(query)) }
      catch { setLocationResults([]); setError('Location search unavailable — is the backend running?') }
      finally { setSearching(false) }
    }, 380)
  }

  const submit = async () => {
    if (!form.location) return
    setLoading(true); setError('')
    try {
      const data = await generateChart({
        name: form.name.trim(),
        birth_date: form.birth_date,
        birth_time: form.birth_time || '12:00',
        birth_time_unknown: form.birth_time_unknown,
        lat: form.location.lat,
        lon: form.location.lon,
        location_name: form.location.short_name,
      })
      localStorage.setItem('naksha_chart', JSON.stringify(data))
      router.push('/chart')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (loading) return (
    <>
      <style>{`
        @keyframes nk-spin-cw  { to { transform: rotate(360deg) } }
        @keyframes nk-spin-ccw { to { transform: rotate(-360deg) } }
        @keyframes nk-orb-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes nk-loader-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .nk-phase-text {
          transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .nk-phase-text.hidden {
          opacity: 0;
          transform: translateY(8px);
        }
        .nk-phase-text.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      <main style={{
        minHeight: '100vh',
        background: 'var(--nk-ground)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'nk-loader-in 0.6s ease both',
      }}>
        {/* Orbital mandala */}
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="nk-orb-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
              <stop offset="45%"  stopColor="rgba(91,140,255,0.65)" />
              <stop offset="100%" stopColor="rgba(91,140,255,0)" />
            </radialGradient>
            <radialGradient id="nk-orb-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(91,140,255,0.18)" />
              <stop offset="100%" stopColor="rgba(91,140,255,0)" />
            </radialGradient>
          </defs>

          {/* Static guide rings */}
          <circle cx="110" cy="110" r="103" fill="none" stroke="rgba(91,140,255,0.07)" strokeWidth="1" />
          <circle cx="110" cy="110" r="70"  fill="none" stroke="rgba(91,140,255,0.11)" strokeWidth="1" />

          {/* Inner dashed ring — slow CW */}
          <circle
            cx="110" cy="110" r="44"
            fill="none" stroke="rgba(91,140,255,0.32)" strokeWidth="1"
            strokeDasharray="3 7"
            style={{ animation: 'nk-spin-cw 12s linear infinite', transformOrigin: '110px 110px' }}
          />

          {/* 27 nakshatra dots — slow CW */}
          <g style={{ animation: 'nk-spin-cw 50s linear infinite', transformOrigin: '110px 110px' }}>
            {Array.from({ length: 27 }, (_, i) => {
              const angle = (i / 27) * 2 * Math.PI - Math.PI / 2
              const x = 110 + 103 * Math.cos(angle)
              const y = 110 + 103 * Math.sin(angle)
              const major = i % 9 === 0
              const mid   = i % 3 === 0
              return (
                <circle
                  key={i} cx={x} cy={y}
                  r={major ? 2.5 : mid ? 1.5 : 1}
                  fill={`rgba(91,140,255,${major ? 0.95 : mid ? 0.5 : 0.2})`}
                />
              )
            })}
          </g>

          {/* 9 planet dots — CCW */}
          <g style={{ animation: 'nk-spin-ccw 20s linear infinite', transformOrigin: '110px 110px' }}>
            {Array.from({ length: 9 }, (_, i) => {
              const angle = (i / 9) * 2 * Math.PI - Math.PI / 2
              const x = 110 + 70 * Math.cos(angle)
              const y = 110 + 70 * Math.sin(angle)
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={9}   fill="rgba(212,184,150,0.07)" />
                  <circle cx={x} cy={y} r={3.5}  fill="rgba(212,184,150,0.9)" />
                </g>
              )
            })}
          </g>

          {/* Center halo + orb */}
          <circle
            cx="110" cy="110" r="32"
            fill="url(#nk-orb-halo)"
            style={{ animation: 'nk-orb-pulse 3s ease-in-out infinite' }}
          />
          <circle
            cx="110" cy="110" r="13"
            fill="url(#nk-orb-core)"
            style={{ animation: 'nk-orb-pulse 3s ease-in-out infinite' }}
          />
        </svg>

        {/* Phase text — fixed height prevents illustration from shifting */}
        <div style={{ marginTop: '52px', textAlign: 'center', width: '100%', maxWidth: '320px' }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'var(--nk-primary)', opacity: 0.65,
            marginBottom: '18px',
          }}>
            Mapping your Naksha
          </p>
          {/* Fixed height so text changes never shift the illustration above */}
          <div style={{ height: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className={`nk-phase-text ${phaseVisible ? 'visible' : 'hidden'}`}>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '10px',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(212,184,150,0.55)',
                marginBottom: '8px',
              }}>
                {LOADING_PHASES[loadingPhase].label}
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '16px',
                fontWeight: 300, letterSpacing: '0.01em',
                color: 'rgba(245,247,251,0.42)',
                whiteSpace: 'nowrap',
              }}>
                {LOADING_PHASES[loadingPhase].text}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )

  const writtenDate = form.birth_date
    ? new Date(form.birth_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: '11px',
    letterSpacing: '0.22em', textTransform: 'uppercase',
    color: 'var(--nk-primary)', marginBottom: '28px', display: 'block',
  }

  const questionStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: 'clamp(26px, 4vw, 38px)',
    fontWeight: 200, color: 'var(--nk-text)', lineHeight: 1.2, marginBottom: '10px',
  }

  const hintStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: '13px',
    color: 'var(--nk-text-3)', marginBottom: '36px', lineHeight: 1.65,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: '1px solid var(--nk-border)',
    color: 'var(--nk-text)', fontSize: 'clamp(22px, 3vw, 30px)',
    fontFamily: 'var(--font-sans)', fontWeight: 300,
    padding: '8px 0 14px', outline: 'none',
    transition: 'border-color 200ms ease',
  }

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--nk-ground)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', position: 'relative',
    }}>
      {/* Back */}
      {stepIndex > 0 && (
        <button
          onClick={back}
          style={{
            position: 'absolute', top: '36px', left: '40px',
            fontFamily: 'var(--font-sans)', fontSize: '11px',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nk-text-3)', background: 'none', border: 'none',
            cursor: 'pointer', transition: 'color 200ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--nk-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--nk-text-3)')}
        >
          ← Back
        </button>
      )}

      {/* Logo — links back to landing */}
      <Link href="/" style={{ position: 'absolute', top: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', color: 'var(--nk-primary)',
        }}>✦</div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--nk-text-3)' }}>
          Naksha
        </span>
      </Link>

      {/* Progress */}
      <div style={{ position: 'absolute', top: '44px', right: '40px', display: 'flex', gap: '6px' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            height: '2px',
            width: i === stepIndex ? '24px' : '8px',
            background: i <= stepIndex ? 'var(--nk-primary)' : 'var(--nk-border)',
            borderRadius: '1px',
            opacity: i <= stepIndex ? 0.8 : 0.4,
            transition: 'width var(--dur-normal) var(--ease), background var(--dur-normal)',
          }} />
        ))}
      </div>

      {/* Form */}
      <div className={visible ? 'page-visible' : 'page-enter'} style={{ width: '100%', maxWidth: '480px' }}>

        {/* NAME */}
        {step === 'name' && (
          <div>
            <span style={labelStyle}>Begin</span>
            <h2 style={questionStyle}>How should we call you?</h2>
            <p style={hintStyle}>Your name makes the reading feel personal.</p>
            <input
              ref={inputRef} type="text" placeholder="Your name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && next()}
              style={inputStyle} autoComplete="given-name"
              onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-primary)')}
              onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-border)')}
            />
          </div>
        )}

        {/* DATE */}
        {step === 'date' && (
          <div>
            <span style={labelStyle}>{form.name}</span>
            <h2 style={questionStyle}>When were you born?</h2>
            <p style={hintStyle}>Your birth date anchors your karmic map.</p>
            <input
              ref={inputRef} type="date"
              value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && next()}
              style={inputStyle}
              max={new Date().toISOString().split('T')[0]}
              onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-primary)')}
              onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-border)')}
            />
            {writtenDate && (
              <p style={{ marginTop: '14px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--nk-primary)', opacity: 0.8 }}>
                {writtenDate}
              </p>
            )}
          </div>
        )}

        {/* TIME */}
        {step === 'time' && (
          <div>
            <span style={labelStyle}>{form.name}</span>
            <h2 style={questionStyle}>What time were you born?</h2>
            <p style={hintStyle}>Your rising sign depends on the hour. As precise as you know.</p>
            {!form.birth_time_unknown ? (
              <>
                <input
                  ref={inputRef} type="time"
                  value={form.birth_time}
                  onChange={e => setForm(f => ({ ...f, birth_time: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-primary)')}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-border)')}
                />
                <button
                  onClick={() => setForm(f => ({ ...f, birth_time_unknown: true, birth_time: '' }))}
                  style={{
                    marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '12px',
                    letterSpacing: '0.04em', color: 'var(--nk-text-3)',
                    textDecoration: 'underline', textUnderlineOffset: '3px',
                  }}
                >
                  I don't know my exact birth time
                </button>
              </>
            ) : (
              <div>
                <p style={{ ...hintStyle, fontStyle: 'italic', marginBottom: '16px' }}>
                  We'll use noon as a reference. Planets and life season will be accurate; house positions approximate.
                </p>
                <button
                  onClick={() => setForm(f => ({ ...f, birth_time_unknown: false }))}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '12px',
                    letterSpacing: '0.08em', color: 'var(--nk-primary)',
                  }}
                >
                  I do know my birth time →
                </button>
              </div>
            )}
          </div>
        )}

        {/* LOCATION */}
        {step === 'location' && (
          <div>
            <span style={labelStyle}>{form.name}</span>
            <h2 style={questionStyle}>Where were you born?</h2>
            <p style={hintStyle}>City and country is enough.</p>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef} type="text" placeholder="Search a city…"
                value={form.location ? form.location.short_name : locationQuery}
                onChange={e => searchLocation(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && form.location) next() }}
                style={{ ...inputStyle, color: form.location ? 'var(--nk-primary)' : 'var(--nk-text)' }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--nk-primary)')}
                onBlur={e => (e.currentTarget.style.borderBottomColor = form.location ? 'var(--nk-primary)' : 'var(--nk-border)')}
                autoComplete="off"
              />
              {searching && (
                <span style={{
                  position: 'absolute', right: 0, bottom: '14px',
                  fontFamily: 'var(--font-sans)', fontSize: '10px',
                  color: 'var(--nk-text-4)', letterSpacing: '0.12em',
                }}>
                  searching…
                </span>
              )}
              {locationResults.length > 0 && !form.location && (
                <div style={{
                  position: 'absolute', top: '100%', marginTop: '4px',
                  width: '100%', zIndex: 20,
                  background: 'var(--nk-surface-2)',
                  border: '1px solid var(--nk-border)',
                  borderRadius: 'var(--nk-r-md)',
                  overflow: 'hidden',
                  boxShadow: 'var(--nk-shadow-md)',
                }}>
                  {locationResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setForm(f => ({ ...f, location: r })); setLocationResults([]); setLocationQuery(r.short_name) }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '13px 18px',
                        background: 'none', border: 'none',
                        borderBottom: i < locationResults.length - 1 ? '1px solid var(--nk-border-hair)' : 'none',
                        cursor: 'pointer', transition: 'background var(--dur-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--nk-primary-dim)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '15px', color: 'var(--nk-text)', display: 'block' }}>
                        {r.short_name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--nk-text-3)', display: 'block', marginTop: '2px' }}>
                        {r.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p style={{ marginTop: '16px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--nk-danger)' }}>
            {error}
          </p>
        )}

        {/* Continue */}
        <div style={{ marginTop: '52px' }}>
          <button
            onClick={next}
            disabled={!canProceed() || loading}
            style={{
              background: 'none', border: 'none',
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)', fontSize: '11px',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: canProceed() && !loading ? 'var(--nk-text)' : 'var(--nk-text-4)',
              transition: 'color var(--dur-normal)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
          >
            {loading ? (
              <>
                <span style={{ color: 'var(--nk-primary)' }}>Mapping your chart</span>
                <span style={{ opacity: 0.5 }}>· · ·</span>
              </>
            ) : step === 'location' ? 'Reveal my map →' : 'Continue →'}
          </button>
        </div>
      </div>
    </main>
  )
}

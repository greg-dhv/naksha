'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { geocodeLocation, generateChart } from '@/lib/api'
import { GeocodeResult } from '@/lib/types'

type Step = 'name' | 'date' | 'time' | 'location'
const STEPS: Step[] = ['name', 'date', 'time', 'location']

interface FormData {
  name: string
  birth_date: string
  birth_time: string
  birth_time_unknown: boolean
  location: GeocodeResult | null
}

const S: Record<string, React.CSSProperties> = {
  label: {
    fontFamily: 'var(--font-label)',
    fontSize: 'var(--text-label)',
    letterSpacing: 'var(--tracking-caps)',
    textTransform: 'uppercase' as const,
    color: 'var(--clr-accent)',
    opacity: 0.75,
    marginBottom: '32px',
    display: 'block',
  },
  question: {
    fontFamily: 'var(--font-sans, "Nunito Sans", system-ui)',
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 200,
    color: 'var(--clr-text)',
    lineHeight: 1.2,
    marginBottom: '12px',
  },
  hint: {
    fontFamily: 'var(--font-label)',
    fontSize: 'var(--text-xs)',
    color: 'var(--clr-text-2)',
    marginBottom: '40px',
    lineHeight: 1.6,
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.22)',
    color: 'var(--clr-text)',
    fontSize: 'clamp(22px, 3vw, 30px)',
    fontFamily: 'var(--font-sans, "Nunito Sans", system-ui)',
    fontWeight: 300,
    padding: '8px 0 14px',
    outline: 'none',
    transition: 'border-color var(--dur-normal)',
  },
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
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => { setVisible(true); inputRef.current?.focus() }, 80)
    return () => clearTimeout(t)
  }, [step])

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

  const writtenDate = form.birth_date
    ? new Date(form.birth_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--clr-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        position: 'relative',
      }}
    >
      {/* Back */}
      {stepIndex > 0 && (
        <button
          onClick={back}
          style={{
            position: 'absolute', top: '36px', left: '52px',
            fontFamily: 'var(--font-label)',
            fontSize: 'var(--text-label)',
            letterSpacing: 'var(--tracking-caps)',
            textTransform: 'uppercase',
            color: 'var(--clr-text-3)',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'color var(--dur-normal)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--clr-text-3)')}
        >
          ← Back
        </button>
      )}

      {/* Progress */}
      <div style={{ position: 'absolute', top: '42px', display: 'flex', gap: '8px' }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              height: '2px',
              width: i === stepIndex ? '28px' : '8px',
              background: i <= stepIndex ? 'var(--clr-accent)' : 'var(--clr-border)',
              borderRadius: '1px',
              opacity: i <= stepIndex ? 0.7 : 0.4,
              transition: 'width var(--dur-normal) var(--ease), background var(--dur-normal)',
            }}
          />
        ))}
      </div>

      {/* Form */}
      <div
        className={visible ? 'page-visible' : 'page-enter'}
        style={{ width: '100%', maxWidth: '480px' }}
      >
        {/* ── NAME ── */}
        {step === 'name' && (
          <div>
            <span style={S.label}>Begin</span>
            <h2 style={S.question}>How should we call you?</h2>
            <p style={S.hint}>Your name makes the reading feel personal.</p>
            <input
              ref={inputRef}
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && next()}
              style={S.input}
              autoComplete="given-name"
            />
          </div>
        )}

        {/* ── DATE ── */}
        {step === 'date' && (
          <div>
            <span style={S.label}>{form.name}</span>
            <h2 style={S.question}>When were you born?</h2>
            <p style={S.hint}>Your birth date anchors your karmic map.</p>
            <input
              ref={inputRef}
              type="date"
              value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && next()}
              style={S.input}
              max={new Date().toISOString().split('T')[0]}
            />
            {writtenDate && (
              <p style={{ marginTop: '14px', fontFamily: 'var(--font-label)', fontSize: 'var(--text-sm)', color: 'var(--clr-accent)', opacity: 0.75 }}>
                {writtenDate}
              </p>
            )}
          </div>
        )}

        {/* ── TIME ── */}
        {step === 'time' && (
          <div>
            <span style={S.label}>{form.name}</span>
            <h2 style={S.question}>What time were you born?</h2>
            <p style={S.hint}>Your rising sign depends on the hour. As precise as you know.</p>
            {!form.birth_time_unknown ? (
              <>
                <input
                  ref={inputRef}
                  type="time"
                  value={form.birth_time}
                  onChange={e => setForm(f => ({ ...f, birth_time: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  style={S.input}
                />
                <button
                  onClick={() => setForm(f => ({ ...f, birth_time_unknown: true, birth_time: '' }))}
                  style={{
                    marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-label)', fontSize: 'var(--text-label)',
                    letterSpacing: '0.1em', color: 'var(--clr-text-3)',
                    textDecoration: 'underline', textUnderlineOffset: '3px',
                  }}
                >
                  I don't know my exact birth time
                </button>
              </>
            ) : (
              <div>
                <p style={{ ...S.hint, fontStyle: 'italic', marginBottom: '16px' }}>
                  We'll use noon as a reference. Planets and life season will be accurate; house positions approximate.
                </p>
                <button
                  onClick={() => setForm(f => ({ ...f, birth_time_unknown: false }))}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-label)', fontSize: 'var(--text-label)',
                    letterSpacing: '0.12em', color: 'var(--clr-accent)', opacity: 0.7,
                  }}
                >
                  I do know my birth time →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── LOCATION ── */}
        {step === 'location' && (
          <div>
            <span style={S.label}>{form.name}</span>
            <h2 style={S.question}>Where were you born?</h2>
            <p style={S.hint}>City and country is enough.</p>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search a city…"
                value={form.location ? form.location.short_name : locationQuery}
                onChange={e => searchLocation(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && form.location) next() }}
                style={{ ...S.input, color: form.location ? 'var(--clr-accent)' : 'var(--clr-text)' }}
                autoComplete="off"
              />
              {searching && (
                <span style={{ position: 'absolute', right: 0, bottom: '14px', fontFamily: 'var(--font-label)', fontSize: '10px', color: 'var(--clr-text-3)', letterSpacing: '0.12em' }}>
                  searching…
                </span>
              )}
              {locationResults.length > 0 && !form.location && (
                <div style={{
                  position: 'absolute', top: '100%', marginTop: '4px', width: '100%', zIndex: 20,
                  background: '#3a4e5c', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}>
                  {locationResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setForm(f => ({ ...f, location: r })); setLocationResults([]); setLocationQuery(r.short_name) }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '14px 18px', background: 'none',
                        border: 'none', borderBottom: i < locationResults.length - 1 ? '1px solid var(--clr-border-2)' : 'none',
                        cursor: 'pointer', transition: 'background var(--dur-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,170,110,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontFamily: 'var(--font-label)', fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--clr-text)', display: 'block' }}>
                        {r.short_name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-label)', fontSize: '11px', color: 'var(--clr-text-3)', display: 'block', marginTop: '2px' }}>
                        {r.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ marginTop: '16px', fontFamily: 'var(--font-label)', fontSize: 'var(--text-xs)', color: '#e06a6a' }}>
            {error}
          </p>
        )}

        {/* Continue */}
        <div style={{ marginTop: '52px' }}>
          <button
            onClick={next}
            disabled={!canProceed() || loading}
            style={{
              background: 'none', border: 'none', cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-label)', fontSize: 'var(--text-label)',
              letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase',
              color: canProceed() && !loading ? 'var(--clr-text)' : 'var(--clr-text-3)',
              transition: 'color var(--dur-normal)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
          >
            {loading ? (
              <>
                <span style={{ color: 'var(--clr-accent)' }}>Mapping your chart</span>
                <span style={{ opacity: 0.5 }}>· · ·</span>
              </>
            ) : step === 'location' ? 'Reveal my map →' : 'Continue →'}
          </button>
        </div>
      </div>
    </main>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LuminousField from '@/components/LuminousField'
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

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [form, setForm] = useState<FormData>({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_time_unknown: false,
    location: null,
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
    const t = setTimeout(() => {
      setVisible(true)
      inputRef.current?.focus()
    }, 80)
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
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    } else {
      submit()
    }
  }

  const back = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') next()
  }

  const searchLocation = (query: string) => {
    setLocationQuery(query)
    form.location && setForm(f => ({ ...f, location: null }))
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (query.trim().length < 2) {
      setLocationResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await geocodeLocation(query)
        setLocationResults(results)
      } catch {
        // silently ignore
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const submit = async () => {
    if (!form.location) return
    setLoading(true)
    setError('')
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(201,164,90,0.35)',
    color: 'var(--cream)',
    fontSize: '1.5rem',
    padding: '8px 0 12px',
    outline: 'none',
    fontFamily: 'Georgia, serif',
    transition: 'border-color 0.3s ease',
  }

  const transitionStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.55s ease, transform 0.55s ease',
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-void px-6">
      <LuminousField intensity={0.7} />

      {/* Back */}
      {stepIndex > 0 && (
        <button
          onClick={back}
          className="absolute top-8 left-8 text-xs tracking-widest uppercase z-10"
          style={{ color: 'rgba(242,235,218,0.3)', letterSpacing: '0.18em' }}
        >
          ← back
        </button>
      )}

      {/* Progress dots */}
      <div className="absolute top-10 flex gap-2 z-10">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === stepIndex ? '20px' : '6px',
              height: '6px',
              background: i <= stepIndex ? 'rgba(201,164,90,0.7)' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md" style={transitionStyle}>
        {/* Step: Name */}
        {step === 'name' && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-8" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              Begin
            </p>
            <h2 className="text-3xl font-serif mb-2" style={{ color: 'var(--cream)', lineHeight: 1.4 }}>
              How should we call you?
            </h2>
            <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
              Your name helps the reading feel personal.
            </p>
            <input
              ref={inputRef}
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              autoComplete="given-name"
            />
          </div>
        )}

        {/* Step: Date */}
        {step === 'date' && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-8" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              {form.name}
            </p>
            <h2 className="text-3xl font-serif mb-2" style={{ color: 'var(--cream)', lineHeight: 1.4 }}>
              When were you born?
            </h2>
            <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
              Your birth date anchors your karmic map.
            </p>
            <input
              ref={inputRef}
              type="date"
              value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        {/* Step: Time */}
        {step === 'time' && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-8" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              {form.name}
            </p>
            <h2 className="text-3xl font-serif mb-2" style={{ color: 'var(--cream)', lineHeight: 1.4 }}>
              What time were you born?
            </h2>
            <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
              Your rising sign depends on the hour. As precise as you know.
            </p>

            {!form.birth_time_unknown ? (
              <>
                <input
                  ref={inputRef}
                  type="time"
                  value={form.birth_time}
                  onChange={e => setForm(f => ({ ...f, birth_time: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  style={inputStyle}
                />
                <button
                  onClick={() => setForm(f => ({ ...f, birth_time_unknown: true, birth_time: '' }))}
                  className="mt-6 text-xs"
                  style={{ color: 'rgba(242,235,218,0.28)', letterSpacing: '0.08em', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  I don't know my exact birth time
                </button>
              </>
            ) : (
              <div className="py-4">
                <p className="text-sm mb-4" style={{ color: 'rgba(242,235,218,0.5)', fontStyle: 'italic' }}>
                  We'll use noon as a reference. Your house placements may be approximate, but your planets and life season will be accurate.
                </p>
                <button
                  onClick={() => setForm(f => ({ ...f, birth_time_unknown: false }))}
                  className="text-xs"
                  style={{ color: 'var(--gold)', opacity: 0.7, letterSpacing: '0.08em' }}
                >
                  I do know my birth time →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Location */}
        {step === 'location' && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-8" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              {form.name}
            </p>
            <h2 className="text-3xl font-serif mb-2" style={{ color: 'var(--cream)', lineHeight: 1.4 }}>
              Where were you born?
            </h2>
            <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
              City and country is enough.
            </p>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search a city…"
                value={form.location ? form.location.short_name : locationQuery}
                onChange={e => searchLocation(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && form.location) next()
                }}
                style={{
                  ...inputStyle,
                  color: form.location ? 'var(--gold)' : 'var(--cream)',
                }}
                autoComplete="off"
              />

              {searching && (
                <div className="absolute right-0 bottom-3 text-xs" style={{ color: 'var(--muted)' }}>
                  searching…
                </div>
              )}

              {locationResults.length > 0 && !form.location && (
                <div
                  className="absolute top-full mt-2 w-full z-20 py-1"
                  style={{
                    background: 'rgba(12,12,24,0.97)',
                    border: '1px solid rgba(201,164,90,0.2)',
                    borderRadius: '8px',
                  }}
                >
                  {locationResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setForm(f => ({ ...f, location: r }))
                        setLocationResults([])
                        setLocationQuery(r.short_name)
                      }}
                      className="w-full text-left px-4 py-3 text-sm transition-colors"
                      style={{ color: 'var(--cream)', borderBottom: i < locationResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,164,90,0.06)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <span style={{ fontWeight: 500 }}>{r.short_name}</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm" style={{ color: '#e85c4a', opacity: 0.85 }}>
            {error}
          </p>
        )}

        {/* Next / Submit */}
        <div className="mt-14 flex items-center justify-between">
          <button
            onClick={next}
            disabled={!canProceed() || loading}
            className="inline-flex items-center gap-3 text-sm tracking-widest uppercase transition-all duration-300"
            style={{
              color: canProceed() && !loading ? 'var(--cream)' : 'rgba(242,235,218,0.2)',
              letterSpacing: '0.2em',
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? (
              <>
                <span style={{ color: 'var(--gold)' }}>Mapping your chart</span>
                <LoadingDots />
              </>
            ) : step === 'location' ? (
              <>Reveal my map <span style={{ opacity: 0.6 }}>→</span></>
            ) : (
              <>Continue <span style={{ opacity: 0.6 }}>→</span></>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: '4px',
            height: '4px',
            background: 'var(--gold)',
            animation: `glowPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

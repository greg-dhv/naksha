'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { login, register, saveChart } from '@/lib/api'

export default function AuthModal({ initialTab = 'register' }: { initialTab?: 'login' | 'register' }) {
  const { closeAuthModal, setAuth } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = tab === 'register'
        ? await register(email, password, username)
        : await login(email, password)

      // For new registrations: save chart to server BEFORE closing modal
      // so that /api/home has chart data ready on first load
      if (tab === 'register') {
        const stored = localStorage.getItem('naksha_chart')
        if (stored) {
          try {
            const chart = JSON.parse(stored)
            const birthData = {
              name: chart.meta?.name,
              birth_date: chart.meta?.birth_date,
              birth_time: chart.meta?.birth_time,
              location_name: chart.meta?.location_name,
            }
            await saveChart(result.token, chart, birthData)
          } catch {}
        }
      }

      setAuth(result.token, result.user)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: focusedField === field ? 'rgba(91,140,255,0.06)' : 'var(--nk-surface-2)',
    border: `1px solid ${focusedField === field ? 'rgba(91,140,255,0.4)' : 'var(--nk-border)'}`,
    borderRadius: 'var(--nk-r-md)',
    padding: '14px 16px',
    color: 'var(--nk-text)',
    fontSize: '15px',
    fontFamily: 'var(--nk-font-sans)',
    outline: 'none',
    transition: 'border-color 150ms ease, background 150ms ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(91,140,255,0.10)' : 'none',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,12,22,0.40)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) closeAuthModal() }}
    >
      <div style={{
        position: 'relative',
        background: 'var(--nk-surface)',
        border: '1px solid var(--nk-border)',
        borderRadius: 'var(--nk-r-lg)',
        padding: '36px 32px 32px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--nk-shadow-lg)',
      }}>

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close"
          style={{
            position: 'absolute', top: '14px', right: '14px',
            width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--nk-border)',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--nk-text-3)',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--nk-text-2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--nk-text)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--nk-border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--nk-text-3)'
          }}
        >
          ×
        </button>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--nk-font-sans)', fontSize: '10px',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--nk-gold)', marginBottom: '10px',
        }}>
          Naksha
        </p>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--nk-font-display)', fontSize: 'clamp(22px, 5vw, 28px)',
          fontWeight: 400, color: 'var(--nk-text)',
          marginBottom: '6px', lineHeight: 1.2,
        }}>
          {tab === 'register' ? 'Save your karmic map' : 'Welcome back'}
        </h2>
        <p style={{
          fontFamily: 'var(--nk-font-sans)', fontSize: '13px',
          color: 'var(--nk-text-3)', marginBottom: '28px', lineHeight: 1.65,
        }}>
          {tab === 'register'
            ? 'Create your account to access Go Deeper, Bonds, and save your chart.'
            : 'Sign in to continue your journey.'}
        </p>

        {/* Pill tab switcher — same pattern as chart page */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--nk-surface-2)',
          border: '1px solid var(--nk-border)',
          borderRadius: 'var(--nk-r-pill)',
          padding: '3px', gap: '2px',
          marginBottom: '24px',
        }}>
          {(['register', 'login'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                padding: '7px 22px',
                borderRadius: '16px',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--nk-font-sans)', fontSize: '10px',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                background: tab === t ? 'rgba(91,140,255,0.15)' : 'transparent',
                color: tab === t ? 'var(--nk-primary)' : 'var(--nk-text-3)',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t === 'register' ? 'Sign Up' : 'Sign In'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            required
            style={inputStyle('email')}
          />
          {tab === 'register' && (
            <input
              type="text"
              placeholder="@username"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/^@/, ''))}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle('username')}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            required
            style={inputStyle('password')}
          />

          {error && (
            <p style={{
              fontFamily: 'var(--nk-font-sans)', fontSize: '12px',
              color: 'var(--nk-danger)', lineHeight: 1.5,
              padding: '8px 12px',
              background: 'rgba(224,106,106,0.08)',
              border: '1px solid rgba(224,106,106,0.20)',
              borderRadius: 'var(--nk-r-sm)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '14px',
              background: loading ? 'rgba(91,140,255,0.15)' : 'rgba(91,140,255,0.18)',
              border: '1px solid rgba(91,140,255,0.35)',
              borderRadius: 'var(--nk-r-md)',
              color: loading ? 'var(--nk-text-3)' : 'var(--nk-primary)',
              fontFamily: 'var(--nk-font-sans)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              boxShadow: loading ? 'none' : 'var(--nk-primary-glow)',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,140,255,0.28)' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,140,255,0.18)' }}
          >
            {loading ? 'Please wait…' : tab === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

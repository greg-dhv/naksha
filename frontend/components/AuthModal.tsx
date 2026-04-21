'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { login, register, saveChart } from '@/lib/api'

export default function AuthModal() {
  const { closeAuthModal, setAuth } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = tab === 'register'
        ? await register(email, password, username)
        : await login(email, password)

      // Close the modal immediately — don't block on chart save
      setAuth(result.token, result.user)

      // On register only: auto-save any chart from localStorage in the background
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
            saveChart(result.token, chart, birthData).catch(() => {})
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(12,20,28,0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) closeAuthModal() }}
    >
      <div style={{
        background: 'var(--clr-bg-deep)',
        border: '1px solid var(--clr-border)',
        borderRadius: '16px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Header */}
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--clr-accent)', marginBottom: '8px' }}>
          Naksha
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 300, color: '#fff', marginBottom: '6px', lineHeight: 1.2 }}>
          {tab === 'register' ? 'Save your karmic map' : 'Welcome back'}
        </h2>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '13px', color: 'var(--clr-text-2)', marginBottom: '28px', lineHeight: 1.6 }}>
          {tab === 'register'
            ? 'Create your account to access Go Deeper, Bonds, and save your chart.'
            : 'Sign in to continue your journey.'}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
          {(['register', 'login'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: '0.08em',
                background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'all 200ms ease',
              }}
            >
              {t === 'register' ? 'Sign Up' : 'Sign In'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          {tab === 'register' && (
            <input
              type="text"
              placeholder="@username"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/^@/, ''))}
              required
              style={inputStyle}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: '#e06a6a', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '13px',
              background: loading ? 'rgba(212,184,150,0.3)' : 'rgba(212,184,150,0.15)',
              border: '1px solid rgba(212,184,150,0.4)',
              borderRadius: '8px',
              color: loading ? 'rgba(255,255,255,0.4)' : 'var(--clr-accent)',
              fontFamily: 'var(--font-label)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {loading ? 'Please wait…' : tab === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

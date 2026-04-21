'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { deleteAccount } from '@/lib/api'

export default function AccountModal({ onClose }: { onClose: () => void }) {
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!token) return
    setDeleting(true)
    try {
      await deleteAccount(token)
      logout()
      localStorage.removeItem('naksha_chart')
      router.replace('/')
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(12,20,28,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--clr-bg-deep)',
        border: '1px solid var(--clr-border)',
        borderRadius: '16px',
        padding: '36px',
        width: '100%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--clr-accent)', marginBottom: '6px' }}>
            Account
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, color: '#fff', lineHeight: 1.2 }}>
            {user?.username ? `@${user.username}` : 'My Account'}
          </h2>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--clr-border)', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: '4px' }}>Username</p>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '14px', color: 'var(--clr-text)' }}>@{user?.username}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--clr-border)', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: '4px' }}>Email</p>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '14px', color: 'var(--clr-text)' }}>{user?.email}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => { logout(); onClose() }}
          style={{
            padding: '11px', marginBottom: '40px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: 'var(--clr-text-2)',
            fontFamily: 'var(--font-label)', fontSize: '11px', letterSpacing: '0.14em',
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Sign out
        </button>

        {/* Delete — hidden at the bottom */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-label)', fontSize: '11px',
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.08em',
              textAlign: 'left',
              padding: '0',
              transition: 'color 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(220,80,80,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
          >
            Delete account
          </button>
        ) : (
          <div style={{ borderTop: '1px solid rgba(220,80,80,0.2)', paddingTop: '16px' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '12px', color: 'rgba(220,80,80,0.8)', marginBottom: '12px', lineHeight: 1.6 }}>
              This permanently deletes your account, chart, and all readings. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1, padding: '10px',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  color: 'var(--clr-text-3)', fontFamily: 'var(--font-label)', fontSize: '11px',
                  letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px',
                  background: 'rgba(220,80,80,0.15)', border: '1px solid rgba(220,80,80,0.35)', borderRadius: '8px',
                  color: deleting ? 'rgba(220,80,80,0.4)' : 'rgba(220,80,80,0.9)',
                  fontFamily: 'var(--font-label)', fontSize: '11px',
                  letterSpacing: '0.1em', cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

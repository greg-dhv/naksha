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
        background: 'rgba(7,12,22,0.40)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
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
          onClick={onClose}
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
          marginBottom: '28px', lineHeight: 1.2,
        }}>
          {user?.username ? `@${user.username}` : 'My Account'}
        </h2>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            background: 'var(--nk-surface-2)',
            border: '1px solid var(--nk-border)',
            borderRadius: 'var(--nk-r-md)',
            padding: '12px 16px',
          }}>
            <p style={{
              fontFamily: 'var(--nk-font-sans)', fontSize: '9px',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--nk-text-3)', marginBottom: '4px',
            }}>Username</p>
            <p style={{ fontFamily: 'var(--nk-font-sans)', fontSize: '14px', color: 'var(--nk-text)' }}>
              @{user?.username}
            </p>
          </div>
          <div style={{
            background: 'var(--nk-surface-2)',
            border: '1px solid var(--nk-border)',
            borderRadius: 'var(--nk-r-md)',
            padding: '12px 16px',
          }}>
            <p style={{
              fontFamily: 'var(--nk-font-sans)', fontSize: '9px',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--nk-text-3)', marginBottom: '4px',
            }}>Email</p>
            <p style={{ fontFamily: 'var(--nk-font-sans)', fontSize: '14px', color: 'var(--nk-text)' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => { logout(); onClose() }}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '32px',
            background: 'rgba(91,140,255,0.18)',
            border: '1px solid rgba(91,140,255,0.35)',
            borderRadius: 'var(--nk-r-md)',
            color: 'var(--nk-primary)',
            fontFamily: 'var(--nk-font-sans)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            boxShadow: 'var(--nk-primary-glow)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,140,255,0.28)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,140,255,0.18)' }}
        >
          Sign out
        </button>

        {/* Delete — hidden at the bottom */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--nk-font-sans)', fontSize: '11px',
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
            <p style={{
              fontFamily: 'var(--nk-font-sans)', fontSize: '12px',
              color: 'var(--nk-danger)', marginBottom: '12px', lineHeight: 1.6,
            }}>
              This permanently deletes your account, chart, and all readings. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1, padding: '10px',
                  background: 'transparent',
                  border: '1px solid var(--nk-border)',
                  borderRadius: 'var(--nk-r-sm)',
                  color: 'var(--nk-text-3)',
                  fontFamily: 'var(--nk-font-sans)', fontSize: '11px',
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
                  background: 'rgba(220,80,80,0.15)',
                  border: '1px solid rgba(220,80,80,0.35)',
                  borderRadius: 'var(--nk-r-sm)',
                  color: deleting ? 'rgba(220,80,80,0.4)' : 'rgba(220,80,80,0.9)',
                  fontFamily: 'var(--nk-font-sans)', fontSize: '11px',
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

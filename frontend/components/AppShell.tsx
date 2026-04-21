'use client'
import { useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AccountModal from './AccountModal'

const NAV_ITEMS = [
  { label: 'Home',      icon: '⌂',  href: '/home',       protected: false },
  { label: 'My Chart',  icon: '◎',  href: '/chart',      protected: false },
  { label: 'Go Deeper', icon: '✦',  href: '/go-deeper',  protected: true  },
  { label: 'Bonds',     icon: '◯',  href: '/bonds',      protected: true  },
]

const EXPLORE_FROM = ['/go-deeper', '/bonds']

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showAccount, setShowAccount] = useState(false)

  function navigate(href: string, isProtected: boolean) {
    if (isProtected && !user) { openAuthModal(); return }
    router.push(href)
  }

  const SidebarItem = ({ label, icon, href, isProtected }: { label: string; icon: string; href: string; isProtected: boolean }) => {
    const active = pathname === href
    return (
      <button
        onClick={() => navigate(href, isProtected)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '9px 12px 9px 14px',
          borderRadius: 'var(--nk-r-sm)',
          background: active ? 'var(--nk-primary-dim)' : 'transparent',
          borderLeft: `2px solid ${active ? 'var(--nk-primary)' : 'transparent'}`,
          border: 'none', cursor: 'pointer', marginBottom: '2px',
          transition: 'background var(--dur-fast)',
          boxSizing: 'border-box',
        }}
      >
        <span style={{
          fontSize: '13px',
          opacity: active ? 1 : 0.35,
          width: '16px', textAlign: 'center',
          color: active ? 'var(--nk-primary)' : 'var(--nk-text)',
        }}>
          {icon}
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          letterSpacing: '0.04em',
          color: active ? 'var(--nk-primary)' : 'var(--nk-text-2)',
          fontWeight: active ? 600 : 400,
          flex: 1, textAlign: 'left',
        }}>
          {label}
        </span>
        {isProtected && !user && (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--nk-text-4)', letterSpacing: '0.06em' }}>
            Sign in
          </span>
        )}
      </button>
    )
  }

  const exploreItems = NAV_ITEMS.filter(n => EXPLORE_FROM.includes(n.href))
  const mainItems = NAV_ITEMS.filter(n => !EXPLORE_FROM.includes(n.href))

  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ── */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div style={{ padding: '0 20px 28px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: 'var(--nk-primary)',
            }}>
              ✦
            </div>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: '11px',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              fontWeight: 600, color: 'var(--nk-text)',
            }}>
              Naksha
            </span>
          </div>
        </div>

        <nav style={{ padding: '4px 10px', flex: 1 }}>
          {mainItems.map(item => (
            <SidebarItem key={item.href} label={item.label} icon={item.icon} href={item.href} isProtected={item.protected} />
          ))}

          <div style={{ padding: '18px 14px 6px', marginTop: '4px' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '9px',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--nk-text-4)',
            }}>
              Explore
            </p>
          </div>

          {exploreItems.map(item => (
            <SidebarItem key={item.href} label={item.label} icon={item.icon} href={item.href} isProtected={item.protected} />
          ))}
        </nav>

        {/* Account */}
        <button
          onClick={() => user ? setShowAccount(true) : openAuthModal()}
          style={{
            margin: '8px 10px 0',
            borderTop: '1px solid var(--nk-border)',
            background: 'none', border: 'none', cursor: 'pointer',
            width: 'calc(100% - 20px)',
            display: 'flex', alignItems: 'center', gap: '10px',
            borderRadius: 'var(--nk-r-sm)',
            padding: '12px 10px',
            transition: 'background var(--dur-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: user ? 'var(--nk-primary-dim)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${user ? 'var(--nk-primary-line)' : 'var(--nk-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: user ? 'var(--nk-primary)' : 'var(--nk-text-3)',
            flexShrink: 0,
          }}>
            {user ? user.username[0].toUpperCase() : '?'}
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user ? `@${user.username}` : 'Sign in'}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--nk-text-4)' }}>
              {user ? 'Account' : 'Save your chart'}
            </p>
          </div>
        </button>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href, item.protected)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', border: 'none', background: 'none',
                cursor: 'pointer', padding: '8px 0',
              }}
            >
              <span style={{
                fontSize: '15px',
                opacity: active ? 1 : 0.3,
                color: active ? 'var(--nk-primary)' : 'var(--nk-text)',
              }}>
                {item.icon}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '9px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: active ? 'var(--nk-primary)' : 'var(--nk-text-3)',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
        {/* Account / Sign-in */}
        <button
          onClick={() => user ? setShowAccount(true) : openAuthModal()}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '3px', border: 'none', background: 'none',
            cursor: 'pointer', padding: '8px 0',
          }}
        >
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: user ? 'var(--nk-primary-dim)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${user ? 'var(--nk-primary-line)' : 'var(--nk-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', color: user ? 'var(--nk-primary)' : 'var(--nk-text-3)',
          }}>
            {user ? user.username[0].toUpperCase() : '?'}
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '9px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--nk-text-3)',
          }}>
            {user ? 'Account' : 'Sign in'}
          </span>
        </button>
      </nav>

      {/* ── Page content ── */}
      <div className="app-content">
        {children}
      </div>

      {showAccount && user && <AccountModal onClose={() => setShowAccount(false)} />}
    </div>
  )
}

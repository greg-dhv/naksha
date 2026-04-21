'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { AuthUser } from '@/lib/types'
import { getMe, getUserChart } from '@/lib/api'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  showAuthModal: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naksha_token')
    if (!stored) { setLoading(false); return }
    getMe(stored)
      .then(u => { setToken(stored); setUser(u) })
      .catch(() => localStorage.removeItem('naksha_token'))
      .finally(() => setLoading(false))
  }, [])

  const setAuth = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem('naksha_token', t)
    setToken(t)
    setUser(u)
    setShowAuthModal(false)
    // Sync localStorage chart with the logged-in user's server chart if one exists.
    // On error (new user with no saved chart), keep the existing local chart intact.
    getUserChart(t)
      .then(chart => localStorage.setItem('naksha_chart', JSON.stringify(chart)))
      .catch(() => { /* no-op: new users have no server chart yet */ })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('naksha_token')
    localStorage.removeItem('naksha_chart')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      setAuth, logout,
      showAuthModal,
      openAuthModal: () => setShowAuthModal(true),
      closeAuthModal: () => setShowAuthModal(false),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

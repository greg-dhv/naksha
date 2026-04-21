'use client'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthModalWrapper from './AuthModalWrapper'
import { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModalWrapper />
    </AuthProvider>
  )
}

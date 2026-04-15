import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Naksha — Your Karmic Map',
  description: 'Vedic astrology that actually knows you. A living relationship with your karmic blueprint.',
  openGraph: {
    title: 'Naksha — Your Karmic Map',
    description: 'Vedic astrology that actually knows you.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

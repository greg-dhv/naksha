import type { Metadata } from 'next'
import { Nunito_Sans } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600'],
  variable: '--font-sans',
  display: 'swap',
})

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
    <html lang="en" className={nunitoSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
